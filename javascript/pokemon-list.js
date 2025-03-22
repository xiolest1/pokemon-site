// This file handles rendering the Pokemon list (and TCG cards) plus search.

// Globals
let currentlyShowingAmount = 0;
let maxIndex = 29;
let currentList = [];
let currentMode = 'pokedex'; // default

const TCG_API_KEY = 'e1288f81-a4d1-4383-845f-58f3f0f49970';

/** Colors for Pokémon types */
const typeColors = {
  'normal': '#BCBCAC',
  'fighting': '#BC5442',
  'flying': '#669AFF',
  'poison': '#AB549A',
  'ground': '#DEBC54',
  'rock': '#BCAC66',
  'bug': '#ABBC1C',
  'ghost': '#6666BC',
  'steel': '#ABACBC',
  'fire': '#FF421C',
  'water': '#2F9AFF',
  'grass': '#78CD54',
  'electric': '#FFCD30',
  'psychic': '#FF549A',
  'ice': '#78DEFF',
  'dragon': '#7866EF',
  'dark': '#785442',
  'fairy': '#FFACFF',
  'shadow': '#0E2E4C'
};

/** Toggle between 'pokedex' and 'tcg' */
function setMode(mode) {
  currentMode = mode;

  // Button highlight
  document.getElementById('pokedex-mode-button').classList.remove('active-mode');
  document.getElementById('tcg-mode-button').classList.remove('active-mode');
  if (currentMode === 'pokedex') {
    document.getElementById('pokedex-mode-button').classList.add('active-mode');
  } else {
    document.getElementById('tcg-mode-button').classList.add('active-mode');
  }

  // Clear container
  document.getElementById('pokedex-list-render-container').innerHTML = '';

  if (currentMode === 'pokedex') {
    // Revert to Pokedex list
    currentList = pokemons;
    currentlyShowingAmount = 0;
    maxIndex = 0;
    increaseMaxIndex(30);
    updatePokemonList();
  } else {
    // TCG mode: wait for user to search
  }
}

/** POKEDEX RENDERING */
function updatePokemonList() {
  if (currentlyShowingAmount <= maxIndex) {
    renderPokemonListItem(currentlyShowingAmount);
  }
}

function renderPokemonListItem(index) {
  if (currentList[index]) {
    document
      .getElementById('pokedex-list-render-container')
      .insertAdjacentHTML(
        'beforeend',
        `<div 
          onclick="openInfo(${currentList[index].id})" 
          class="pokemon-render-result-container container center column"
        >
          <img 
            class="search-pokemon-image" 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
              currentList[index].id
            }.png"
          >
          <span class="bold font-size-12">N° ${currentList[index].id}</span>
          <h3>${dressUpPayloadValue(currentList[index].name)}</h3>
          ${getTypeContainers(currentList[index].types)}
        </div>`
      );

    currentlyShowingAmount += 1;
    updatePokemonList();
  }
}

function increaseMaxIndex(by) {
  if (maxIndex + by <= currentList.length) {
    maxIndex += by;
  } else {
    maxIndex = currentList.length - 1;
  }
}

function getTypeContainers(typesArray) {
  let htmlToReturn = '<div class="row">';
  for (let i = 0; i < typesArray.length; i++) {
    htmlToReturn += `
      <div 
        class="type-container" 
        style="background: ${typeColors[typesArray[i]] || '#ccc'};"
      >
        ${dressUpPayloadValue(typesArray[i])}
      </div>
    `;
  }
  return htmlToReturn + '</div>';
}

function dressUpPayloadValue(str) {
  let splitStr = str.toLowerCase().split('-');
  for (let i = 0; i < splitStr.length; i++) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(' ');
}

/** SEARCH across Pokedex or TCG */
function search() {
  setTimeout(function () {
    let searchTerm = document
      .getElementById('search-input')
      .value.toLowerCase()
      .trim();

    if (currentMode === 'pokedex') {
      // Local filter of 'pokemons'
      let searchResults = [];
      for (let i = 0; i < pokemons.length; i++) {
        if (
          pokemons[i].name &&
          pokemons[i].name.replaceAll('-', ' ').includes(searchTerm)
        ) {
          searchResults.push(pokemons[i]);
        }
      }
      document.getElementById('pokedex-list-render-container').innerHTML = '';
      currentList = searchResults;
      currentlyShowingAmount = 0;
      maxIndex = 0;
      increaseMaxIndex(30);
      updatePokemonList();
    } else {
      // TCG search
      fetchTCGCards(searchTerm);
    }
  }, 1);
}

/** TCG: wildcard partial search */
async function fetchTCGCards(query) {
  try {
    if (!query) query = 'p'; // default if empty
    const url = `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(query)}*`;
    const response = await fetch(url, {
      headers: { 'X-Api-Key': TCG_API_KEY }
    });
    const data = await response.json();

    const cards = data.data || [];
    document.getElementById('pokedex-list-render-container').innerHTML = '';
    renderTCGCards(cards);
  } catch (err) {
    console.error('Error fetching TCG cards:', err);
  }
}

/** 
 * Render TCG cards:
 * - We do NOT show the set name 
 * - The 'type container' now shows the actual card name
 */
function renderTCGCards(cardsArray) {
  for (let i = 0; i < cardsArray.length; i++) {
    const card = cardsArray[i];
    const cardName = card.name || 'Unknown Card';
    const smallImg = card.images?.small || 'src/no-pokemon-selected-image.png';

    document
      .getElementById('pokedex-list-render-container')
      .insertAdjacentHTML(
        'beforeend',
        `<div 
          class="pokemon-render-result-container container center column"
          onclick="openTCGCardInfo('${card.id}')"
        >
          <img 
            class="search-tcg-image"
            src="${smallImg}"
            alt="${cardName}"
          >
          <!-- remove the set name, as requested, so no <span> with set -->
          
          <!-- The main name is placed in type-container to match your request -->
          <div class="row center">
            <div 
              class="type-container" 
              style="background: #FFCD30;"
            >
              ${dressUpPayloadValue(cardName)}
            </div>
          </div>
        </div>`
      );
  }
}

/** SCROLL & BACK TO TOP for Pokedex */
window.addEventListener('scroll', function () {
  addNewScrollPokemon();
  updateBackToTopVisibility();
});

function addNewScrollPokemon() {
  if (currentMode === 'pokedex') {
    if (
      window.scrollY + 100 >=
      document.documentElement.scrollHeight - document.documentElement.clientHeight
    ) {
      increaseMaxIndex(30);
      updatePokemonList();
    }
  }
}

function updateBackToTopVisibility() {
  if (window.scrollY > window.innerHeight) {
    document.getElementById('back-to-top-button').classList.remove('hide');
  } else {
    document.getElementById('back-to-top-button').classList.add('hide');
  }
}
function backToTop() {
  window.scrollTo(0, 0);
}
