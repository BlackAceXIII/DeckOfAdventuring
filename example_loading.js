// Example of how to load the separated structure
// This demonstrates the recommended loading pattern for the new structure

const CARD_DIR = './CardsJsons';
let allCards = null;     // { cards: { "Aberration": {...}, ... } }
let allDecks = {};       // Combined deck lists from multiple sources

async function loadAllData() {
  try {
    // Load cards and default decks in parallel
    const [cardsResponse, defaultDecksResponse] = await Promise.all([
      fetch(`${CARD_DIR}/AllCards.json`),
      fetch(`${CARD_DIR}/deckLists.json`)
    ]);

    if (!cardsResponse.ok) throw new Error('Failed to load AllCards.json');
    if (!defaultDecksResponse.ok) throw new Error('Failed to load deckLists.json');

    allCards = await cardsResponse.json();
    const defaultDecks = await defaultDecksResponse.json();

    // Try to load custom decks (optional - may not exist)
    let customDecks = {};
    try {
      const customResponse = await fetch(`${CARD_DIR}/customDecks.json`);
      if (customResponse.ok) {
        customDecks = await customResponse.json();
      }
    } catch (e) {
      console.log('No custom decks found (this is fine)');
    }

    // Try to load seasonal decks (optional - may not exist)
    let seasonalDecks = {};
    try {
      const seasonalResponse = await fetch(`${CARD_DIR}/seasonalDecks.json`);
      if (seasonalResponse.ok) {
        seasonalDecks = await seasonalResponse.json();
      }
    } catch (e) {
      console.log('No seasonal decks found (this is fine)');
    }

    // Combine all deck sources (custom decks override defaults)
    allDecks = { ...defaultDecks, ...seasonalDecks, ...customDecks };

    console.log(`Loaded ${Object.keys(allCards.cards).length} cards`);
    console.log(`Loaded ${Object.keys(allDecks).length} deck types`);

    return { allCards, allDecks };

  } catch (error) {
    console.error('Failed to load card data:', error);
    throw error;
  }
}

// Example usage functions
function generateCard(cardNum, deckName) {
  if (!allCards || !allDecks) {
    console.error('Data not loaded yet');
    return;
  }

  const deck = allDecks[deckName];
  if (!deck) {
    console.error(`Deck "${deckName}" not found`);
    return;
  }

  const cardName = deck[cardNum];
  if (!cardName) {
    console.error(`Card ${cardNum} not found in deck ${deckName}`);
    return;
  }

  const cardData = allCards.cards[cardName];
  if (!cardData) {
    console.error(`Card data for "${cardName}" not found`);
    return;
  }

  // Your existing card generation logic here
  console.log(`Generated card: ${cardData.name}`);
  return cardData;
}

async function saveCustomDeck(deckName, cardList) {
  // Example of how to save custom decks
  // This would typically be handled by your backend or localStorage
  
  // Load current custom decks
  let customDecks = {};
  try {
    const response = await fetch(`${CARD_DIR}/customDecks.json`);
    if (response.ok) {
      customDecks = await response.json();
    }
  } catch (e) {
    // File doesn't exist yet, that's fine
  }

  // Add the new deck
  customDecks[deckName] = cardList;

  // In a real app, you'd save this to your backend or localStorage
  console.log('Would save custom decks:', customDecks);
  
  // Update the in-memory deck list
  allDecks[deckName] = cardList;
}

// Initialize the app
async function init() {
  try {
    await loadAllData();
    // Set up your UI, populate dropdowns, etc.
    populateDropdown(allDecks);
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// Example of how to populate dropdown with the new structure
function populateDropdown(decks) {
  let dropdown = "<select id='deck-select' onchange='onDeckChange()'>"; 
  for (let deckName in decks) {
    dropdown += `<option value="${deckName}">${deckName}</option>`;
  }
  dropdown += "</select>";
  document.getElementById("dropdown").innerHTML = dropdown;
}

// Call init when the page loads
// init();
