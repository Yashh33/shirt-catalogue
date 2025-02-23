// Utility function to parse query parameters
function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');
  for (let pair of pairs) {
    let [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return params;
}

const params = getQueryParams();
const garmentImageUrl = params.garment || 'images/placeholder.png';

// Ensure correct path handling
let fullGarmentImageUrl = garmentImageUrl.startsWith('http') ? garmentImageUrl : window.location.origin + '/' + garmentImageUrl;
document.getElementById('garmentImg').src = fullGarmentImageUrl;

// Handle Model Image Upload
let modelImageDataUrl = null;
document.getElementById('modelImageInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      modelImageDataUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Handle the Start button click to call FashnAPI
document.getElementById('startBtn').addEventListener('click', async function() {
  const resultDiv = document.getElementById('result');
  if (!modelImageDataUrl) {
    resultDiv.innerHTML = "Please upload a model image.";
    return;
  }
  
  resultDiv.innerHTML = "Processing your images...";

  const payload = {
    model_image: modelImageDataUrl,
    garment_image: fullGarmentImageUrl,
    category: "tops",
    garment_photo_type: "model",
    mode: "quality",
    restore_background: true
  };

  const headers = {
    "Authorization": `Bearer fa-nDicHHggyx5o-JdloP0aTQUk9fYUzQChIPgvY`,
    "Content-Type": "application/json"
  };

  try {
    let response = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      resultDiv.innerHTML = `Failed: ${await response.text()}`;
      return;
    }

    let data = await response.json();
    const predictionId = data.id;

    resultDiv.innerHTML = "Processing...";

    while (true) {
      let statusResponse = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, { headers: headers });
      let statusData = await statusResponse.json();

      if (statusData.status === "completed") {
        const outputUrl = statusData.output && statusData.output[0];
        if (outputUrl) {
          resultDiv.innerHTML = `<p>Result Ready!</p><img src="${outputUrl}" alt="Result">`;
        } else {
          resultDiv.innerHTML = "Error: No output image.";
        }
        break;
      } else if (statusData.status === "failed") {
        resultDiv.innerHTML = `Prediction failed. Try again.`;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    resultDiv.innerHTML = "Error: " + error.message;
  }
});
