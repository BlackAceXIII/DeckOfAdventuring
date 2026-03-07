let allDecks = {}; // Combined deck lists from all sources
let allCards = null; // Card data from AllCards.json
let selectedDeck = null; // Default deck selection
let cardName = null; // This will hold the name of the card
let deckName = null; // This will hold the name of the deck

const CARD_DIR = './CardsJsons';

const drawData = {
  "C.00": { cType: "" }, "C.01": { cType: "" }, "C.02": { cType: "" },
  "C.03": { cType: "" }, "C.04": { cType: "" }, "C.05": { cType: "" },
  "C.06": { cType: "" }, "C.07": { cType: "" }, "C.08": { cType: "" },
  "C.09": { cType: "" }, "C.10": { cType: "" }, "C.11": { cType: "" },
  "C.12": { cType: "" }, "C.13": { cType: "" }, "C.14": { cType: "" },
  "C.15": { cType: "" }, "C.16": { cType: "" }
};

async function fetchData() {
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

    // Combine all deck sources (custom decks override defaults)
    allDecks = { ...defaultDecks, ...customDecks };

    console.log(`Loaded ${Object.keys(allCards.cards).length} cards`);
    console.log(`Loaded ${Object.keys(allDecks).length} deck types`);

    // Create an array of all existing cards
    const allExistingCards = Object.keys(allCards.cards);
    console.log('All existing cards:', allExistingCards);

    populateAllCardsSpread(allExistingCards);
    populateBlankSlateSpread();

    populateDropdown(allDecks);
    return allDecks;

  } catch (error) {
    console.error('Failed to load card data:', error);
    throw error;
  }
}

// The card-fetch helper above was deprecated once we began loading
// the entire AllCards.json at startup.  We kept the old code here as
// a reference during development but later removed it since every card
// can be looked up directly from `allCards.cards`.
// (function fetchCardData was replaced by the preloaded `allCards` lookup.)

function populateDropdown(deckLists) {
  let dropdown = "<select id='deck-select' onchange='redrawAll()'>"; // Create a dropdown menu
  for (let deckName in deckLists) {
    dropdown += `<option value="${deckName}">${deckName}</option>`; // Add each deck name as an option
  }
  dropdown += "</select>";
  document.getElementById("dropdown").innerHTML = dropdown; // Insert the dropdown into the page

  document.getElementById("deck-select").value = selectedDeck; // Set the default selected deck
  document.getElementById("deck-select").addEventListener("change", function() {
    selectedDeck = this.value; // Update the selected deck when the dropdown changes
    //redrawAll(); // Redraw all cards with the new deck
  });
  // Initialize the first card with the selected deck
  selectedDeck = Object.keys(deckLists)[0]; // Set the first deck as default
}

function populateAllCardsSpread(allCardsArray) {
  const grid = document.getElementById('all-cards-grid');
  grid.innerHTML = ''; // Clear any existing content

  allCardsArray.forEach(cardName => {
    const button = document.createElement('button');
    button.className = 'card-button';
    button.textContent = cardName;
    button.onclick = () => openAllCard(cardName);
    grid.appendChild(button);
  });
}

function populateBlankSlateSpread() {
  const grid = document.getElementById('blank-slate-grid');
  grid.innerHTML = ''; // Clear any existing content

  for (let i = 0; i <= 16; i++) {
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    const button = document.createElement('button');
    button.className = 'slot-button';
    button.textContent = cardNum;
    button.onclick = (event) => openCard(event, cardNum);
    grid.appendChild(button);
  }
}

function openAllCard(cardName) {
  // Create a temporary card tab for the selected card
  const cardId = `all-${cardName.replace(/\s+/g, '-')}`;
  let cardDiv = document.getElementById(cardId);
  if (!cardDiv) {
    cardDiv = document.createElement('div');
    cardDiv.id = cardId;
    cardDiv.className = 'tabcontent';
    cardDiv.innerHTML = `
      <span onclick="this.parentElement.style.display='none'" class="topright">&times;</span>
      <h3>Card: ${cardName}</h3>
      <div>
        <img id="card-image-${cardId}" src="../JSON_Folder/Generic Soldier 4.png" alt="Card Image" width="100" height="100" style="margin-top: 10px;">
        <p style="font-size: 0.9em; margin: 5px 0;">Credit: <span id="card-credit-${cardId}">Credit Name</span></p>
      </div>
      <h4>Description: <span id="card-description-${cardId}">{@i Description of the card.}</span></h4>
      <h4>Meanings</h4>
      <div id="meanings-${cardId}">
        <h5>Person: <span id="meaning-person-${cardId}">Meaning</span></h5>
        <h5>Creature or Trap: <span id="meaning-creature-${cardId}">Meaning</span></h5>
        <h5>Place: <span id="meaning-place-${cardId}">Meaning</span></h5>
        <h5>Treasure: <span id="meaning-treasure-${cardId}">Meaning</span></h5>
        <h5>Situation: <span id="meaning-situation-${cardId}">Meaning</span></h5>
      </div>
    `;
    document.body.appendChild(cardDiv);
  }

  // Populate the card details
  const cardData = allCards.cards[cardName];
  if (cardData) {
    setText(`card-description-${cardId}`, cardData.description || '');
    setText(`card-credit-${cardId}`, cardData.credit || 'Unknown');
    // For meanings, since no orientation, use upright or first
    const getMeaning = (meaningArray) => {
      if (!meaningArray) return '';
      if (Array.isArray(meaningArray)) return meaningArray[0] || '';
      return meaningArray.upright || '';
    };
    setText(`meaning-person-${cardId}`, getMeaning(cardData.meanings?.person));
    setText(`meaning-creature-${cardId}`, getMeaning(cardData.meanings?.creatureTrap));
    setText(`meaning-place-${cardId}`, getMeaning(cardData.meanings?.place));
    setText(`meaning-treasure-${cardId}`, getMeaning(cardData.meanings?.treasure));
    setText(`meaning-situation-${cardId}`, getMeaning(cardData.meanings?.situation));
  }

  cardDiv.style.display = 'block';
}

function openCard(evt, cardNum) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(cardNum).style.display = "block";
  evt.currentTarget.className += " active";
}

function openSpread(evt, spreadName) {
  var i, spreadTabcontent, spreadTablinks;
  spreadTabcontent = document.getElementsByClassName("spread-tabcontent");
  for (i = 0; i < spreadTabcontent.length; i++) {
    spreadTabcontent[i].style.display = "none";
  }
  spreadTablinks = document.getElementsByClassName("spread-tablinks");
  for (i = 0; i < spreadTablinks.length; i++) {
    spreadTablinks[i].className = spreadTablinks[i].className.replace(" active", "");
  }
  document.getElementById(spreadName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Helper function to get the currently active spread
function getActiveSpread() {
  const spreadTabcontent = document.getElementsByClassName("spread-tabcontent");
  for (let i = 0; i < spreadTabcontent.length; i++) {
    if (spreadTabcontent[i].style.display === "block") {
      return spreadTabcontent[i].id;
    }
  }
  return "adventure-spread"; // default
}

// Helper function to get table ID prefix based on active spread
function getTablePrefix() {
  const activeSpread = getActiveSpread();
  switch(activeSpread) {
    case "five-card-spread":
      return "card-list-five-";
    case "three-card-spread":
      return "card-list-three-";
    default:
      return "card-list-";
  }
}

// Helper function to get orientation table ID prefix based on active spread
function getOrientationTablePrefix() {
  const activeSpread = getActiveSpread();
  switch(activeSpread) {
    case "five-card-spread":
      return "card-orientation-list-five-";
    case "three-card-spread":
      return "card-orientation-list-three-";
    default:
      return "card-orientation-list-";
  }
}

function redrawAll() {
  // Legacy function - calls all spread functions
  redrawAdventureSpread();
  redrawFiveCardSpread();
  redrawThreeCardSpread();
}

function redrawAdventureSpread() {
  for (let i = 0; i <= 8; i++) {
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    generateCard(cardNum);
  }
}

function redrawFiveCardSpread() {
  for (let i = 9; i <= 13; i++) {
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    generateCard(cardNum);
  }
}

function redrawThreeCardSpread() {
  for (let i = 14; i <= 16; i++) {
    const cardNum = `C.${i}`;
    generateCard(cardNum);
  }
}

document.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', function() {
    handleButtonClick(this.id);
  });
});

function handleButtonClick(id) {
  const match = id.match(/^generate-button-(C\.\d{2})$/);
  if (match) {
    generateCard(match[1]);
  }
}
/*
  Early prototype of generateCard used hardcoded deckLists structure
  and updated some legacy `random-element` DOM nodes.  That approach was
  abandoned when the system was redesigned to read from `allDecks`/`allCards`
  and populate the spread tables.  The current `generateCard(cardNum)`
  function above handles all spreads and orientations.
*/

/*
  Example code from when the page was being tested with a single
  `Aberration.json` card object.  It demonstrated populating a single
  card slot based on a provided JSON object.  The final implementation
  generalizes this logic in the `generateCard(cardNum)` function, which
  now works for every card in any deck, so the specific example is no
  longer needed.
*/
function generateCard(cardNum) {
  if (!allCards || !allDecks || !selectedDeck || !allDecks[selectedDeck]) {
    console.error("No data available or selected deck is empty.");
    return;
  }

  // Get the deck array for the selected deck
  const deck = allDecks[selectedDeck];
  
  // Get random card from the deck
  const randomIndex = Math.floor(Math.random() * deck.length);
  const cardName = deck[randomIndex];
  
  if (!cardName) {
    console.error(`No card found at index ${randomIndex} in deck ${selectedDeck}`);
    return;
  }

  // Get the card data from allCards
  const cardData = allCards.cards[cardName];
  
  if (!cardData) {
    console.error(`Card data for "${cardName}" not found in AllCards.json`);
    return;
  }

  // Determines if the card is upright or reversed
  let cardOrientation = Math.floor(Math.random() * 2);
  const orientationText = cardOrientation === 0 ? "Upright" : "Reverse";
  
  // Update card detail fields for this card slot (per-card IDs)
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  setText(`card-name-${cardNum}`, cardData.name || cardName);
  setText(`card-description-${cardNum}`, cardData.description || '');
  setText(`card-orientation-${cardNum}`, orientationText);

  // Helper to resolve meanings which may be arrays or {upright,reverse}
  const getMeaning = (meaningArray) => {
    if (!meaningArray) return '';
    if (Array.isArray(meaningArray)) return meaningArray[cardOrientation] || meaningArray[0] || '';
    return cardOrientation === 0 ? (meaningArray.upright || '') : (meaningArray.reverse || '');
  };

  setText(`meaning-person-${cardNum}`, getMeaning(cardData.meanings?.person));
  setText(`meaning-creature-${cardNum}`, getMeaning(cardData.meanings?.creatureTrap));
  setText(`meaning-place-${cardNum}`, getMeaning(cardData.meanings?.place));
  setText(`meaning-treasure-${cardNum}`, getMeaning(cardData.meanings?.treasure));
  setText(`meaning-situation-${cardNum}`, getMeaning(cardData.meanings?.situation));

  // Update appropriate spread tables based on card number range
  const cardNameText = cardData.name || cardName;
  
  // Determine which spread this card belongs to and update its table
  const cardNumber = parseInt(cardNum.replace('C.', ''));
  
  if (cardNumber >= 0 && cardNumber <= 8) {
    // Adventure Spread (C.00-C.08)
    const adventureNameEl = document.getElementById(`card-list-${cardNum}`);
    const adventureOrientEl = document.getElementById(`card-orientation-list-${cardNum}`);
    if (adventureNameEl) adventureNameEl.textContent = cardNameText;
    if (adventureOrientEl) adventureOrientEl.textContent = orientationText;
  } else if (cardNumber >= 9 && cardNumber <= 13) {
    // Five-Card Spread (C.09-C.13)
    const fiveNameEl = document.getElementById(`card-list-five-${cardNum}`);
    const fiveOrientEl = document.getElementById(`card-orientation-list-five-${cardNum}`);
    if (fiveNameEl) fiveNameEl.textContent = cardNameText;
    if (fiveOrientEl) fiveOrientEl.textContent = orientationText;
  } else if (cardNumber >= 14 && cardNumber <= 16) {
    // Three-Card Spread (C.14-C.16)
    const threeNameEl = document.getElementById(`card-list-three-${cardNum}`);
    const threeOrientEl = document.getElementById(`card-orientation-list-three-${cardNum}`);
    if (threeNameEl) threeNameEl.textContent = cardNameText;
    if (threeOrientEl) threeOrientEl.textContent = orientationText;
  }

  console.log(`Generated card: ${cardData.name} (${orientationText}) for slot ${cardNum}`);
}



// Get the element with id="defaultSpreadOpen" and click on it to show default spread
if (document.getElementById("defaultSpreadOpen")) {
  document.getElementById("defaultSpreadOpen").click();
}

// Get the element with id="defaultOpen" and click on it
if (document.getElementById("defaultOpen")) {
  document.getElementById("defaultOpen").click();
}

// Wire per-card Random buttons for all card slots (C.00..C.16)
for (let i = 0; i <= 8; i++) {
  const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
  const btn = document.getElementById(`generate-button-${cardNum}`);
  if (btn) btn.addEventListener('click', () => generateCard(cardNum));
}

for (let i = 9; i <= 16; i++) {
  const cardNum = `C.${i}`;
  const btn = document.getElementById(`generate-button-${cardNum}`);
  if (btn) btn.addEventListener('click', () => generateCard(cardNum));
}

function toggleReplaceable() {
  const toggle = document.getElementById("replaceableToggle");
  const isReplaceable = toggle.checked;
  // Update the global setting for whether cards can be replaced
  // This will affect how generateCard selects cards from the deck
  // If isReplaceable is true, cards can appear multiple times; if false, they are removed from the deck after being drawn
  console.log(`Card replacement is now ${isReplaceable ? 'enabled' : 'disabled'}`);
  // You would implement the logic in generateCard to respect this setting when selecting cards
}

// Initialize data
fetchData();