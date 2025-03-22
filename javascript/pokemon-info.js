/*******************************************
 * TCG Card Detail View
 ********************************************/
async function openTCGCardInfo(cardId) {
  document.getElementById('current-pokemon-empty').classList.add('hide');

  // If wide screen, animate panel out first
  if (window.innerWidth > 1100) {
    slideOutPokemonInfo();
    setTimeout(function() {
      fetchTCGCardInfo(cardId);
    }, 350);
  } else {
    fetchTCGCardInfo(cardId);
  }
}

async function fetchTCGCardInfo(cardId) {
  try {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
      headers: { 'X-Api-Key': 'e1288f81-a4d1-4383-845f-58f3f0f49970' }
    });
    const data = await response.json();

    if (data && data.data) {
      setupTCGCardUI(data.data);
    }

    slideInPokemonInfo();
    if (window.innerWidth < 1100) {
      openPokemonResponsiveInfo();
    }
  } catch (error) {
    console.error('Error fetching TCG card:', error);
  }
}

function setupTCGCardUI(card) {
  // Hide Poke info, show TCG info
  document.getElementById('current-pokemon-info').classList.add('hide');
  document.getElementById('current-tcg-info').classList.remove('hide');

  // Use large image if available, else small
  const imageEl = document.getElementById('current-pokemon-image');
  const tcgImage = card.images?.large || card.images?.small || 'src/no-pokemon-selected-image.png';
  imageEl.src = tcgImage;
  imageEl.style.height = 'auto';

  // 1) Name & HP
  document.getElementById('current-tcg-name').innerText = card.name || 'Unknown';
  document.getElementById('current-tcg-hp').innerText = card.hp ? card.hp : '—';

  // 2) Types
  if (card.types && card.types.length > 0) {
    document.getElementById('current-tcg-types').innerText = card.types.join(', ');
  } else {
    document.getElementById('current-tcg-types').innerText = card.supertype || '—';
  }

  // 3) EvolvesFrom
  document.getElementById('current-tcg-evolves').innerText = card.evolvesFrom || '—';

  // 4) Attacks
  const attacksContainer = document.getElementById('current-tcg-attacks');
  attacksContainer.innerHTML = ''; // clear previous
  if (card.attacks && card.attacks.length > 0) {
    card.attacks.forEach((atk) => {
      // We'll add each attack as a "row" with name, cost, damage, effect
      const cost = atk.cost ? atk.cost.join(', ') : '—';
      const dmg = atk.damage || '—';
      const eff = atk.effect || '';

      attacksContainer.insertAdjacentHTML('beforeend', `
        <div class="pokemon-info-variable-container" style="margin:5px;">
          <strong>${atk.name}</strong><br>
          Cost: ${cost}<br>
          Damage: ${dmg}<br>
          Effect: ${eff}
        </div>
      `);
    });
  } else {
    attacksContainer.insertAdjacentHTML('beforeend', `
      <div class="pokemon-info-variable-container" style="margin:5px;">No attacks</div>
    `);
  }

  // 5) Weaknesses
  if (card.weaknesses && card.weaknesses.length > 0) {
    const weaknessStr = card.weaknesses.map(w => `${w.type} ${w.value}`).join(', ');
    document.getElementById('current-tcg-weaknesses').innerText = weaknessStr;
  } else {
    document.getElementById('current-tcg-weaknesses').innerText = 'None';
  }

  // 6) Set info
  if (card.set) {
    document.getElementById('current-tcg-setname').innerText = card.set.name || '—';
    document.getElementById('current-tcg-released').innerText = card.set.releaseDate || '—';
  } else {
    document.getElementById('current-tcg-setname').innerText = '—';
    document.getElementById('current-tcg-released').innerText = '—';
  }
}

/*******************************************
 * Pokémon Info (Original)
 ********************************************/
function openInfo(id) {
  document.getElementById('current-pokemon-empty').classList.add('hide');

  // Hide TCG container
  document.getElementById('current-tcg-info').classList.add('hide');
  // Show Pokemon container
  document.getElementById('current-pokemon-info').classList.remove('hide');

  if(window.innerWidth > 1100){
    slideOutPokemonInfo();
    setTimeout(function(){
      fetchPokemonInfo(id);
      updateCurrentPokemonImage(id);
    }, 350);
  } else {
    fetchPokemonInfo(id);
    updateCurrentPokemonImage(id);
  }
}

/**fetch Pokemon details from PokeAPI */
async function fetchPokemonInfo(id) {
  const urlPokemon = 'https://pokeapi.co/api/v2/pokemon/' + id;
  const urlSpecies = 'https://pokeapi.co/api/v2/pokemon-species/' + id;
  const responsePokemon = await fetch(urlPokemon);
  const responseSpecies = await fetch(urlSpecies);
  const pokemon = await responsePokemon.json();
  const species = await responseSpecies.json();

  const reponseEvolutions = await fetch(species.evolution_chain.url);
  const evolution_chain = await reponseEvolutions.json();

  setupPokemonAbout(pokemon, id, species);
  setupPokemonStats(pokemon);
  setupPokemonAbilities(pokemon);
  setupEvolutionChain(evolution_chain);
  setupResponsiveBackground(pokemon);

  slideInPokemonInfo();
  if(window.innerWidth < 1100){
      openPokemonResponsiveInfo();
  }
}

/** Show the correct sprite for old/new */
function updateCurrentPokemonImage(id) {
  const currentPokemonImage = document.getElementById('current-pokemon-image');
  const img = new Image();

  img.onload = function() {
    currentPokemonImage.src = this.src;
    currentPokemonImage.style.height = this.height * 3 + 'px';
  };

  if(id >= 650) {
    img.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/' + id + '.png';
  } else {
    img.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/' + id + '.gif';
  }
}

/** Setup Poke info fields */
function setupPokemonAbout(pokemon, id, species) {
  document.getElementById('current-pokemon-info').classList.remove('hide');
  document.getElementById('current-pokemon-id').innerHTML = 'N° ' + pokemon.id;
  document.getElementById('current-pokemon-name').innerHTML = dressUpPayloadValue(pokemon.name);
  document.getElementById('current-pokemon-types').innerHTML = getTypeContainers(pokemons[id - 1].types);
  document.getElementById('current-pokemon-height').innerHTML = pokemon.height / 10 + 'm';
  document.getElementById('current-pokemon-weight').innerHTML = pokemon.weight / 10 + 'kg';

  for(let i = 0; i < species.flavor_text_entries.length; i++) {
    if(species.flavor_text_entries[i].language.name == 'en'){
      document.getElementById('current-pokemon-description').innerHTML = dressUpPayloadValue(
        species.flavor_text_entries[i].flavor_text.replace('', ' ')
      );
      break;
    }
  }
}

function setupPokemonStats(pokemon) {
  document.getElementById('current-pokemon-stats-atk').innerHTML = pokemon.stats[0].base_stat;
  document.getElementById('current-pokemon-stats-hp').innerHTML = pokemon.stats[1].base_stat;
  document.getElementById('current-pokemon-stats-def').innerHTML = pokemon.stats[2].base_stat;
  document.getElementById('current-pokemon-stats-spa').innerHTML = pokemon.stats[3].base_stat;
  document.getElementById('current-pokemon-stats-spd').innerHTML = pokemon.stats[4].base_stat;
  document.getElementById('current-pokemon-stats-speed').innerHTML = pokemon.stats[5].base_stat;
  document.getElementById('current-pokemon-stats-total').innerHTML =
    pokemon.stats[0].base_stat +
    pokemon.stats[1].base_stat +
    pokemon.stats[2].base_stat +
    pokemon.stats[3].base_stat +
    pokemon.stats[4].base_stat +
    pokemon.stats[5].base_stat;
}

function setupPokemonAbilities(pokemon) {
  document.getElementById('current-pokemon-abilitiy-0').innerHTML = dressUpPayloadValue(pokemon.abilities[0].ability.name);
  if(pokemon.abilities[1]){
    document.getElementById('current-pokemon-abilitiy-1').classList.remove('hide');
    document.getElementById('current-pokemon-abilitiy-1').innerHTML = dressUpPayloadValue(pokemon.abilities[1].ability.name);
  } else {
    document.getElementById('current-pokemon-abilitiy-1').classList.add('hide');
  }
}

/** Evolution chain */
function setupEvolutionChain(evolutionChain) {
  const chain = evolutionChain.chain;
  const chainContainer = document.getElementById('current-pokemon-evolution-chain-container');
  const chainImages = [
    document.getElementById('current-pokemon-evolution-0'),
    document.getElementById('current-pokemon-evolution-1'),
    document.getElementById('current-pokemon-evolution-2')
  ];
  const chainLevels = [
    document.getElementById('current-pokemon-evolution-level-0'),
    document.getElementById('current-pokemon-evolution-level-1')
  ];

  if(chain.evolves_to.length !== 0) {
    chainContainer.classList.remove('hide');
    setupEvolution(chain, 0);

    if(chain.evolves_to[0].evolves_to.length !== 0) {
      setupEvolution(chain.evolves_to[0], 1);
      chainImages[2].classList.remove('hide');
      chainLevels[1].classList.remove('hide');
    } else {
      chainImages[2].classList.add('hide');
      chainLevels[1].classList.add('hide');
    }
  } else {
    chainContainer.classList.add('hide');
  }
}

function setupEvolution(chain, no) {
  const chainImages = [
    document.getElementById('current-pokemon-evolution-0'),
    document.getElementById('current-pokemon-evolution-1'),
    document.getElementById('current-pokemon-evolution-2')
  ];
  const chainLevels = [
    document.getElementById('current-pokemon-evolution-level-0'),
    document.getElementById('current-pokemon-evolution-level-1')
  ];
    
  chainImages[no].src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + filterIdFromSpeciesURL(chain.species.url) + '.png';
  chainImages[no].setAttribute('onClick', 'javascript: ' + 'openInfo(' + filterIdFromSpeciesURL(chain.species.url) + ')');
  chainImages[no + 1].src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + filterIdFromSpeciesURL(chain.evolves_to[0].species.url) + '.png';
  chainImages[no + 1].setAttribute('onClick', 'javascript: ' + 'openInfo(' + filterIdFromSpeciesURL(chain.evolves_to[0].species.url) + ')');

  if(chain.evolves_to[0].evolution_details[0].min_level) {
    chainLevels[no].innerHTML = 'Lv. ' + chain.evolves_to[0].evolution_details[0].min_level;
  } else {
    chainLevels[no].innerHTML = '?';
  }
}

function filterIdFromSpeciesURL(url){
  return url
    .replace('https://pokeapi.co/api/v2/pokemon-species/', '')
    .replace('/', '');
}

/** Responsive + Animations */
function setupResponsiveBackground(pokemon) {
  document.getElementById('current-pokemon-responsive-background').style.background = typeColors[pokemon.types[0].type.name];
}

function openPokemonResponsiveInfo(){
  document.getElementById('current-pokemon-container').classList.remove('hide');
  document.getElementById('current-pokemon-container').style.display = 'flex';
  document.getElementById('current-pokemon-responsive-close').classList.remove('hide');
  
  document.getElementById('current-pokemon-responsive-background').classList.remove('hide');
  document.getElementById('current-pokemon-responsive-background').style.opacity = 0;

  setTimeout(function(){
    document.getElementById('current-pokemon-responsive-background').style.opacity = 1;
  }, 20);

  document.getElementsByTagName('html')[0].style.overflow = 'hidden';
}

function closePokemonInfo(){
  setTimeout(function(){
    document.getElementById('current-pokemon-container').classList.add('hide');
    document.getElementById('current-pokemon-responsive-close').classList.add('hide');
    document.getElementById('current-pokemon-responsive-background').classList.add('hide');
  },350);

  document.getElementById('current-pokemon-responsive-background').style.opacity = 1;
  setTimeout(function(){
    document.getElementById('current-pokemon-responsive-background').style.opacity = 0;
  }, 10);
  
  document.getElementsByTagName('html')[0].style.overflow = 'unset';
  slideOutPokemonInfo();
}

window.addEventListener('resize', function(){
  if(document.getElementById('current-pokemon-container').classList.contains('slide-out')){
    document.getElementById('current-pokemon-container').classList.replace('slide-out', 'slide-in');
  }
  if(window.innerWidth > 1100) {
    document.getElementsByTagName('html')[0].style.overflow = 'unset';
  }
});

function slideOutPokemonInfo(){
  document.getElementById('current-pokemon-container').classList.remove('slide-in');
  document.getElementById('current-pokemon-container').classList.add('slide-out');
}

function slideInPokemonInfo(){
  document.getElementById('current-pokemon-container').classList.add('slide-in');
  document.getElementById('current-pokemon-container').classList.remove('slide-out');
}
