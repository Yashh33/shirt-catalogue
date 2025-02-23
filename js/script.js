// Load shirt data from the JSON file and display in gallery
let shirtsData = [];

async function loadShirtData() {
  try {
    const response = await fetch('data/shirts.json');
    shirtsData = await response.json();
    displayShirts(shirtsData);
  } catch (error) {
    console.error('Error loading shirt data:', error);
  }
}

function displayShirts(shirts) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  shirts.forEach(shirt => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <a href="detail.html?garment=${encodeURIComponent(shirt.image)}">
        <img src="${shirt.image}" alt="Shirt ${shirt.id}">
      </a>
      <p>Shirt ID: ${shirt.id}</p>
    `;
    gallery.appendChild(card);
  });
}

// Set up search functionality using Fuse.js
function setupSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const options = {
    keys: ['id'],
    threshold: 0.3
  };

  // Initialize Fuse with the loaded data
  let fuse = new Fuse(shirtsData, options);

  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query === '') {
      displayShirts(shirtsData);
    } else {
      const result = fuse.search(query).map(result => result.item);
      displayShirts(result);
    }
  });
}

async function init() {
  await loadShirtData();
  setupSearch();
}

window.addEventListener('DOMContentLoaded', init);
