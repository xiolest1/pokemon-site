// This file handles rendering the Pokemon list (and now TCG cards) plus search.

// -- GLOBALS --
let currentlyShowingAmount = 0;
let maxIndex = 29;
let currentList = [];

// 1) ADDED: track which mode is active
let currentMode = 'pokedex'; // can be 'pokedex' or 'tcg'

// The TCG API key (yours)
const TCG_API_KEY = 'e1288f81-a4d1-4383-845f-58f3f0f49970';

/**
 * Colors for Pokémon types (PokeAPI).
 * TCG doesn't necessarily use these, but we can re-use for styling if we want.
 */
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


// --------------------------------------------------------------------
// 2) ADDED: setMode function to switch modes
// --------------------------------------------------------------------
function setMode(mode) {
  currentMode = mode;

  // Toggling button styles (optional)
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
    // Go back to original Pokemon list
    currentList = pokemons;
    currentlyShowingAmount = 0;
    maxIndex = 0;
    increaseMaxIndex(30);
    updatePokemonList();
  } else {
    // TCG mode: we won't load anything until user searches, or load a default set
    // Optionally fetch a default (e.g. "Pikachu" or "Charizard")
    // fetchTCGCards('pikachu');
  }
}


// --------------------------------------------------------------------
// Existing POKÉDEX code
// --------------------------------------------------------------------
/**update pokemon list */
function updatePokemonList() {
  if (currentlyShowingAmount <= maxIndex) {
    renderPokemonListItem(currentlyShowingAmount);
  }
}

/**render one Pokemon at [index] */
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

/**get type containers for pokemon infos */
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

/**dress up payload value */
function dressUpPayloadValue(string) {
  let splitStr = string.toLowerCase().split('-');
  for (let i = 0; i < splitStr.length; i++) {
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(' ');
}


// --------------------------------------------------------------------
// 3) ADAPTED: search() now checks which mode is active
// --------------------------------------------------------------------
function search() {
  setTimeout(function () {
    let searchTerm = document
      .getElementById('search-input')
      .value.toLowerCase()
      .trim();

    if (currentMode === 'pokedex') {
      // Normal PokeDex search
      let searchResults = [];
      for (let i = 0; i < pokemons.length; i++) {
        if (
          pokemons[i].name &&
          pokemons[i].name
            .replaceAll('-', ' ')
            .includes(searchTerm)
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
      // TCG mode => fetch from TCG API
      fetchTCGCards(searchTerm);
    }
  }, 1);
}


// --------------------------------------------------------------------
// 4) ADDED: TCG-specific code
// --------------------------------------------------------------------
async function fetchTCGCards(query) {
  try {
    // If user typed nothing, we might skip or default to "pikachu"
    if (!query) query = 'pikachu';

    const url = `https://api.pokemontcg.io/v2/cards?q=name:${query}`;
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': TCG_API_KEY
      }
    });
    const data = await response.json();

    // "data.data" is typically where the array of cards is
    const cards = data.data || [];

    // Clear the container
    document.getElementById('pokedex-list-render-container').innerHTML = '';

    // Render TCG cards
    renderTCGCards(cards);

  } catch (err) {
    console.error('Error fetching TCG cards:', err);
  }
}

function renderTCGCards(cardsArray) {
    for (let i = 0; i < cardsArray.length; i++) {
      const card = cardsArray[i];
      const cardName = card.name || 'Unknown Card';
      const cardImg = card.images?.small || 'src/no-pokemon-selected-image.png';
      const setName = card.set?.name || 'Unknown Set';
      const cardSupertype = card.supertype || 'Card';
      
      // 1) The key part: onClick="openTCGCardInfo('xxxxx')"
      //    We'll pass the card.id to openTCGCardInfo for details.
      document
        .getElementById('pokedex-list-render-container')
        .insertAdjacentHTML(
          'beforeend',
          `<div 
            class="pokemon-render-result-container container center column"
            onclick="openTCGCardInfo('${card.id}')"
           >
              <img 
                class="search-pokemon-image" 
                src="${cardImg}" 
                alt="${cardName}"
              >
              <span class="bold font-size-12">${setName}</span>
              <h3>${dressUpPayloadValue(cardName)}</h3>
              <div class="row center">
                <div 
                  class="type-container" 
                  style="background:#FFCD30;"
                >
                  ${dressUpPayloadValue(cardSupertype)}
                </div>
              </div>
           </div>`
        );
    }
  }


// --------------------------------------------------------------------
// SCROLL & BACK TO TOP
// (same as before, mostly unchanged)
// --------------------------------------------------------------------
window.addEventListener('scroll', function () {
  addNewScrollPokemon();
  updateBackToTopVisibility();
});

/**add new scroll pokemon when bottom is reached (pokedex mode only) */
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
  // If in TCG mode, you can decide if you want infinite scroll or not
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
