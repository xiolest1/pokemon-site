let pokemons = [' '];
let retryCount = 0;
const MAX_RETRIES = 3;

/**fetch pokemon name and id */
async function getAllNames() {
    try {
        let url = 'https://pokeapi.co/api/v2/pokemon/?limit=898';
        let response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let responseAsJson = await response.json();

        for (let i = 0; i < responseAsJson.results.length; i++) {
            pokemons.push({
                id: i + 1,
                name: responseAsJson.results[i].name,
                types: []
            });
        };

        await getAllTypes();
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount} of ${MAX_RETRIES}`);
            setTimeout(getAllNames, 1000); // Retry after 1 second
        } else {
            console.error('Failed to load Pokémon data after multiple attempts');
            document.getElementById('loading-div').innerHTML = '<span>Failed to load Pokémon data. Please refresh the page.</span>';
        }
    }
}

/**fetch pokemon types */
async function getAllTypes() {
    try {
        for (let i = 0; i < 18; i++) {
            let url = 'https://pokeapi.co/api/v2/type/' + (i + 1);
            let response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let responseAsJson = await response.json();

            const pokemonInType = responseAsJson.pokemon;
            
            for(let j = 0; j < pokemonInType.length; j++) {
                const pokemonId = pokemonInType[j].pokemon.url.replace('https://pokeapi.co/api/v2/pokemon/', '').replace('/', '');

                if(pokemonId <= pokemons.length && pokemons[pokemonId]) {
                    pokemons[pokemonId].types.push(responseAsJson.name);
                }
            }
        }

        loadingCompletion();
    } catch (error) {
        console.error('Error fetching Pokémon types:', error);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount} of ${MAX_RETRIES}`);
            setTimeout(getAllTypes, 1000); // Retry after 1 second
        } else {
            console.error('Failed to load Pokémon types after multiple attempts');
            document.getElementById('loading-div').innerHTML = '<span>Failed to load Pokémon types. Please refresh the page.</span>';
        }
    }
}

/**hide loading div after completion */
function loadingCompletion() {
    const loadingDiv = document.getElementById('loading-div');
    loadingDiv.classList.add('hideLoading');

    setTimeout(function() {
        loadingDiv.classList.replace('hideLoading', 'hide');
        document.body.style.overflow = 'unset';
    }, 500);

    pokemons.splice(0, 1);
    currentList = pokemons;

    updatePokemonList();
}