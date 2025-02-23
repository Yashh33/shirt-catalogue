// FashnAPI configuration (replace these with your actual values)
const FASHN_API_URL = "https://api.fashn.ai/v1";  // Example: https://api.fashn.ai
const FASHN_API_KEY = "fa-nDicHHggyx5o-JdloP0aTQUk9fYUzQChIPgvY";

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
const garmentImageUrl = params.garment;
let fullGarmentImageUrl = garmentImageUrl;
if (!/^https?:\/\//i.test(garmentImageUrl)) {
  fullGarmentImageUrl = window.location.origin + '/' + garmentImageUrl;
}
document.getElementById('garmentImg').src = fullGarmentImageUrl;

// Variable to store model image data URL
let modelImageDataUrl = null;

// Convert the uploaded file to a data URL
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
    "Authorization": `Bearer ${FASHN_API_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    // Initiate the prediction
    let response = await fetch(`${FASHN_API_URL}/run`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      resultDiv.innerHTML = `Failed to initiate prediction: ${await response.text()}`;
      return;
    }

    let data = await response.json();
    const predictionId = data.id;
    if (!predictionId) {
      resultDiv.innerHTML = "Error: No prediction ID returned.";
      return;
    }

    resultDiv.innerHTML = "Prediction initiated. Please wait while we process your images...";

    // Poll for the prediction result
    while (true) {
      let statusResponse = await fetch(`${FASHN_API_URL}/status/${predictionId}`, { headers: headers });
      let statusData = await statusResponse.json();

      if (statusData.status === "completed") {
        const outputUrl = statusData.output && statusData.output[0];
        if (outputUrl) {
          resultDiv.innerHTML = `<p>Your result is ready!</p><img src="${outputUrl}" alt="Result Image">`;
        } else {
          resultDiv.innerHTML = "Error: No output image found.";
        }
        break;
      } else if (statusData.status === "failed") {
        // Log the API error details if available
        const apiError = statusData.error ? `<br>Error Details: ${statusData.error.name} - ${statusData.error.message}` : '';
        resultDiv.innerHTML = `The prediction failed. Please try again.${apiError}`;
        break;
      } else {
        // Still processing; wait for 5 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    resultDiv.innerHTML = "An error occurred: " + error.message;
  }
});
