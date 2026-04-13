// Ensure defaults are set immediately to prevent null errors
let selectedDecks = {
  adventure: 'Default',
  fiveCard: 'Default',
  threeCard: 'Default',
  journey: 'Default'
};

let isReplaceableEnabled = false; // Default to "No" to match common Tarot logic

let allDecks = {}; // Combined deck lists from all sources
let allCards = null; // Card data from AllCards.json
let cardName = null; // This will hold the name of the card
let deckName = null; // This will hold the name of the deck
let workingDecks = {
  adventure: [],    // C.00-C.08
  fiveCard: [],     // C.09-C.13
  threeCard: [],    // C.14-C.16
  journey: []       // C.17-C.30
};

const CARD_DIR = './CardsJsons';

const drawData = {
  "C.00": { cType: "" }, "C.01": { cType: "" }, "C.02": { cType: "" },
  "C.03": { cType: "" }, "C.04": { cType: "" }, "C.05": { cType: "" },
  "C.06": { cType: "" }, "C.07": { cType: "" }, "C.08": { cType: "" },
  "C.09": { cType: "" }, "C.10": { cType: "" }, "C.11": { cType: "" },
  "C.12": { cType: "" }, "C.13": { cType: "" }, "C.14": { cType: "" },
  "C.15": { cType: "" }, "C.16": { cType: "" }, "C.17": { cType: "" },
  "C.18": { cType: "" }, "C.19": { cType: "" }, "C.20": { cType: "" },
  "C.21": { cType: "" }, "C.22": { cType: "" }, "C.23": { cType: "" },
  "C.24": { cType: "" }, "C.25": { cType: "" }, "C.26": { cType: "" },
  "C.27": { cType: "" }, "C.28": { cType: "" }, "C.29": { cType: "" },
  "C.30": { cType: "" }
};

// Card ID Organization:
// All card slot IDs follow a unified naming convention:
// - Card detail panels: card-name-C.## and card-orientation-C.##
// - Spread tables: card-list-C.## and card-orientation-list-C.##
// This allows universal selectors that work across all spreads:
//   Adventure Spread: C.00-C.08
//   Five-Card Spread: C.09-C.13
//   Three-Card Spread: C.14-C.16
//   Journey Spread: C.17-C.30
// The unified naming eliminates the need for spread-specific prefixes
// and makes getElementById() lookups fast and efficient.

async function fetchData() {
  try {
    // STEP 1: Load card and deck data in parallel for performance
    // 1.1 Fetch AllCards.json and deckLists.json simultaneously
    const [cardsResponse, defaultDecksResponse] = await Promise.all([
      fetch(`${CARD_DIR}/AllCards.json`),
      fetch(`${CARD_DIR}/deckLists.json`)
    ]);

    // STEP 2: Validate that both primary resources loaded successfully
    // 2.1 Check AllCards.json response status
    if (!cardsResponse.ok) throw new Error('Failed to load AllCards.json');
    // 2.2 Check deckLists.json response status
    if (!defaultDecksResponse.ok) throw new Error('Failed to load deckLists.json');

    // STEP 3: Parse both JSON responses into global variables
    // 3.1 Parse and store all cards from AllCards.json
    allCards = await cardsResponse.json();
    // 3.2 Parse default deck lists
    const defaultDecks = await defaultDecksResponse.json();

    // STEP 4: Attempt to load optional custom decks (graceful failure)
    // 4.1 Initialize empty object for custom decks in case file doesn't exist
    let customDecks = {};
    try {
      // 4.2 Try to fetch custom decks if they exist
      const customResponse = await fetch(`${CARD_DIR}/customDecks.json`);
      if (customResponse.ok) {
        customDecks = await customResponse.json();
      }
    } catch (e) {
      // 4.3 Log that custom decks are missing (this is expected)
      console.log('No custom decks found (this is fine)');
    }

    // STEP 5: Merge all deck sources with custom decks taking priority
    // 5.1 Combine default and custom decks (custom overrides defaults)
    allDecks = { ...defaultDecks, ...customDecks };

    // STEP 6: Log initialization results for debugging
    // 6.1 Report total card count
    console.log(`Loaded ${Object.keys(allCards.cards).length} cards`);
    // 6.2 Report total deck type count
    console.log(`Loaded ${Object.keys(allDecks).length} deck types`);

    // STEP 7: Initialize UI with all loaded data
    // 7.1 Create array of all card names from the database
    const allExistingCards = Object.keys(allCards.cards);
    console.log('All existing cards:', allExistingCards);

    // 7.2 Populate the "All Cards" section with card buttons
    populateAllCardsSpread(allExistingCards);
    // 7.3 Populate the blank slate spread with card slots
    populateBlankSlateSpread();

    // 7.4 Create deck selection dropdowns for all spreads
    populateDropdown(allDecks);
    return allDecks;

  } catch (error) {
    // STEP 8: Handle any errors during data loading
    // 8.1 Log error to console
    console.error('Failed to load card data:', error);
    // 8.2 Re-throw error to be handled by caller
    throw error;
  }
}

// The card-fetch helper above was deprecated once we began loading
// the entire AllCards.json at startup.  We kept the old code here as
// a reference during development but later removed it since every card
// can be looked up directly from `allCards.cards`.
// (function fetchCardData was replaced by the preloaded `allCards` lookup.)

// Get the selected deck for a given spread
function getSelectedDeckForSpread(spreadKey) {
  return selectedDecks[spreadKey] || Object.keys(allDecks)[0];
}

// Determine which spread a card belongs to based on card number
function getSpreadKey(cardNum) {
  const cardNumber = parseInt(cardNum.replace('C.', ''));
  if (cardNumber >= 0 && cardNumber <= 8) return 'adventure';
  if (cardNumber >= 9 && cardNumber <= 13) return 'fiveCard';
  if (cardNumber >= 14 && cardNumber <= 16) return 'threeCard';
  if (cardNumber >= 17 && cardNumber <= 30) return 'journey';
  return 'adventure'; // default
}

// IMPROVED: Robust initialization of working decks
function initializeWorkingDecks() {
  // STEP 1: Define all spread types to initialize
  const spreads = ['adventure', 'fiveCard', 'threeCard', 'journey'];
  
  // STEP 2: Initialize a working copy of the deck for each spread
  spreads.forEach(spread => {
    // 2.1 Get the selected deck name for this spread
    const deckName = selectedDecks[spread];
    
    // 2.2 If the selected deck exists, create a copy for the working deck
    if (allDecks && allDecks[deckName]) {
      // 2.2.1 Spread operator [...] creates a shallow copy to avoid mutating original
      workingDecks[spread] = [...allDecks[deckName]];
    } else if (allDecks) {
      // 2.3 Fallback: if selected deck missing, use first available deck
      // 2.3.1 Get the first deck from all available decks
      const firstDeck = Object.keys(allDecks)[0];
      // 2.3.2 Create a working copy of the fallback deck
      workingDecks[spread] = [...allDecks[firstDeck]];
    }
  });
}

// Helper function to reset a specific spread's working deck
function resetWorkingDeck(spreadKey) {
  const deckName = getSelectedDeckForSpread(spreadKey);
  if (allDecks && allDecks[deckName]) {
    workingDecks[spreadKey] = [...allDecks[deckName]];
    console.log(`Fresh deck shuffled for ${spreadKey} spread.`);
  }
}

function populateDropdown(deckLists) {
  // STEP 1: Set all spreads to use the first available deck as default
  // 1.1 Get the name of the first deck in the available decks
  const defaultDeck = Object.keys(deckLists)[0];
  // 1.2 Set all spread selections to the default deck
  selectedDecks.adventure = defaultDeck;
  selectedDecks.fiveCard = defaultDeck;
  selectedDecks.threeCard = defaultDeck;
  selectedDecks.journey = defaultDeck;
  // 1.3 Initialize the working decks (copies for card drawing)
  initializeWorkingDecks();

  // STEP 2: Define metadata for each spread's deck selector
  // 2.1 Create configuration objects with spread info and HTML IDs
  const spreads = [
    { key: 'adventure', id: 'deck-select-adventure', label: 'Adventure Spread' },
    { key: 'fiveCard', id: 'deck-select-fiveCard', label: 'Five-Card Spread' },
    { key: 'threeCard', id: 'deck-select-threeCard', label: 'Three-Card Spread' },
    { key: 'journey', id: 'deck-select-journey', label: 'Journey Spread' }
  ];

  // STEP 3: Create dropdown selectors for each spread
  // 3.1 Iterate through each spread and create its deck selector
  spreads.forEach(spread => {
    createSpreadDeckSelector(spread.key, spread.id, spread.label, deckLists);
  });
}

// Create a deck selector for a specific spread
function createSpreadDeckSelector(spreadKey, selectId, label, deckLists) {
  // STEP 1: Build the HTML select element and options
  // 1.1 Create the select element with label and class
  let dropdown = `<label>${label} Deck:</label><select id="${selectId}" class="deck-select-spread">`;
  // 1.2 Iterate through all available decks and create option elements
  for (let deckName in deckLists) {
    dropdown += `<option value="${deckName}">${deckName}</option>`;
  }
  // 1.3 Close the select element
  dropdown += "</select>";
  
  // STEP 2: Find the container element and inject the dropdown
  // 2.1 Get the container div for this spread's selector
  const container = document.getElementById(`${spreadKey}-deck-selector`);
  if (container) {
    // 2.2 Insert the HTML into the container
    container.innerHTML = dropdown;
    // 2.3 Get reference to the newly created select element
    const sel = document.getElementById(selectId);
    // 2.4 Set the current selected value from selectedDecks
    sel.value = selectedDecks[spreadKey];
    
    // STEP 3: Attach change event listener to select element
    // 3.1 Listen for deck selection changes
    sel.addEventListener("change", function() {
      // 3.2 Update the selectedDecks object with new choice
      selectedDecks[spreadKey] = this.value;
      // 3.3 Reinitialize working decks with the new deck
      initializeWorkingDecks();
      // 3.4 Log the change for debugging
      console.log(`${spreadKey} spread now using deck: ${this.value}`);
    });
  }
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
    button.onclick = function(event) { openCard(event, cardNum, this); };
    grid.appendChild(button);
  }
}

function openAllCard(cardName) {
  // STEP 1: Generate unique ID for this card's tab
  // 1.1 Create ID from card name, replacing spaces with hyphens
  const cardId = `all-${cardName.replace(/\s+/g, '-')}`;
  // 1.2 Check if tab already exists on the page
  let cardDiv = document.getElementById(cardId);
  
  // STEP 2: Create card tab if it doesn't already exist
  if (!cardDiv) {
    // 2.1 Create a new div element for the card tab
    cardDiv = document.createElement('div');
    // 2.2 Set the tab's ID
    cardDiv.id = cardId;
    // 2.3 Set CSS class for styling
    cardDiv.className = 'tabcontent';
    // 2.4 Populate with HTML structure for card display
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
    // 2.5 Add the new tab to the document body
    document.body.appendChild(cardDiv);
  }

  // STEP 3: Populate card details from AllCards database
  // 3.1 Look up the card data in the global allCards object
  const cardData = allCards.cards[cardName];
  if (cardData) {
    // 3.2 Set card description text
    setText(`card-description-${cardId}`, cardData.description || '');
    // 3.3 Set card credit/source text
    setText(`card-credit-${cardId}`, cardData.credit || 'Unknown');
    
    // STEP 4: Helper to extract meanings (handles different data formats)
    // 4.1 Define helper to safely extract meaning values
    const getMeaning = (meaningArray) => {
      if (!meaningArray) return '';
      if (Array.isArray(meaningArray)) return meaningArray[0] || '';
      return meaningArray.upright || '';
    };
    
    // STEP 5: Populate all meaning categories
    // 5.1 Set person meaning
    setText(`meaning-person-${cardId}`, getMeaning(cardData.meanings?.person));
    // 5.2 Set creature/trap meaning
    setText(`meaning-creature-${cardId}`, getMeaning(cardData.meanings?.creatureTrap));
    // 5.3 Set place meaning
    setText(`meaning-place-${cardId}`, getMeaning(cardData.meanings?.place));
    // 5.4 Set treasure meaning
    setText(`meaning-treasure-${cardId}`, getMeaning(cardData.meanings?.treasure));
    // 5.5 Set situation meaning
    setText(`meaning-situation-${cardId}`, getMeaning(cardData.meanings?.situation));
  }

  // STEP 6: Display the card tab
  // 6.1 Make the card tab visible
  cardDiv.style.display = 'block';
}

function openCard(evt, cardNum, buttonElement) {
  var i, tabcontent, tablinks;
  
  // STEP 1: Hide all existing tab content
  // 1.1 Get all tab content elements
  tabcontent = document.getElementsByClassName("tabcontent");
  // 1.2 Iterate through and hide each tab
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  
  // STEP 2: Remove active state from all tab buttons
  // 2.1 Get all tab link buttons
  tablinks = document.getElementsByClassName("tablinks");
  // 2.2 Iterate through and remove active class from each
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  
  // STEP 3: Display the selected card's tab
  // 3.1 Get the card element by card number
  const cardElement = document.getElementById(cardNum);
  if (cardElement) {
    // 3.2 Make the card tab visible
    cardElement.style.display = "block";
  } else {
    // 3.3 Log error if card element not found
    console.error(`Card element ${cardNum} not found`);
  }
  
  // STEP 4: Mark the clicked button as active
  // 4.1 Determine which button was clicked (explicit parameter or event target)
  let activeButton = buttonElement || (evt && (evt.target || evt.currentTarget));
  // 4.2 Add active class to the clicked button (handle both classList and className)
  if (activeButton && activeButton.classList) {
    activeButton.classList.add("active");
  } else if (activeButton) {
    activeButton.className += " active";
  }
}

// FIXED: Tab switching logic to ensure content is visible
function openSpread(evt, spreadName) {
  // STEP 1: Hide all spread tabs
  // 1.1 Get all spread tab content elements
  const spreadTabcontent = document.getElementsByClassName("spread-tabcontent");
  // 1.2 Iterate through and hide each spread tab
  for (let i = 0; i < spreadTabcontent.length; i++) {
    spreadTabcontent[i].style.display = "none";
  }
  
  // STEP 2: Remove active state from all spread tab links
  // 2.1 Get all spread tab buttons
  const spreadTablinks = document.getElementsByClassName("spread-tablinks");
  // 2.2 Iterate through and remove active class from each button
  for (let i = 0; i < spreadTablinks.length; i++) {
    spreadTablinks[i].classList.remove("active");
  }

  // STEP 3: Display the selected spread tab
  // 3.1 Get the spread element by name
  const target = document.getElementById(spreadName);
  if (target) {
    // 3.2 Make the spread tab visible
    target.style.display = "block";
    // 3.3 Mark the clicked button as active
    evt.currentTarget.classList.add("active");
  }
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
  redrawJourneySpread();
}

function redrawAdventureSpread() {
  resetWorkingDeck('adventure');
  for (let i = 0; i <= 8; i++) {
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    generateCard(cardNum);
  }
}

function redrawFiveCardSpread() {
  resetWorkingDeck('fiveCard');
  for (let i = 9; i <= 13; i++) {
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    generateCard(cardNum);
  }
}

function redrawThreeCardSpread() {
  resetWorkingDeck('threeCard');
  for (let i = 14; i <= 16; i++) {
    const cardNum = `C.${i}`;
    generateCard(cardNum);
  }
}

function redrawJourneySpread() {
  resetWorkingDeck('journey');
  for (let i = 17; i <= 30; i++) {
    const cardNum = `C.${i}`;
    generateCard(cardNum);
  }
}

// handleButtonClick and the early querySelectorAll wiring were removed.
// Buttons are now handled by the event delegation listener below,
// which correctly fires after data is loaded and covers all card slots.
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
// Shared helper – must be module-level so openAllCard and generateCard can both use it
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// FIXED: generateCard now dynamically finds table cells
function generateCard(cardNum) {
  // STEP 1: Determine the spread and deck to use
  // 1.1 Get the spread type based on card number
  const spreadKey = getSpreadKey(cardNum);
  // 1.2 Get the selected deck name for this spread
  const deckName = selectedDecks[spreadKey];
  // 1.3 Verify that card data and deck definitions are loaded
  if (!allCards || !allDecks) return;

  // STEP 2: Select which deck to draw from (replaceable or working)
  // 2.1 Choose replaceable deck if enabled, otherwise use working deck
  let deckToUse = isReplaceableEnabled ? allDecks[deckName] : workingDecks[spreadKey];
  
  // 2.2 If using non-replaceable mode and deck is empty, silently refill it
  if (!isReplaceableEnabled && (!deckToUse || deckToUse.length === 0)) {
    workingDecks[spreadKey] = [...allDecks[deckName]];
    deckToUse = workingDecks[spreadKey];
  }

  // 2.3 Verify the deck has cards available to draw
  if (deckToUse.length === 0) {
    console.error(`No cards available in deck ${deckName}`);
    return;
  }

  // STEP 3: Draw a random card from the selected deck
  // 3.1 Generate random index into the deck array
  const randomIndex = Math.floor(Math.random() * deckToUse.length);
  // 3.2 Retrieve the card name at that index
  const cardName = deckToUse[randomIndex];
  
  // STEP 4: Remove card from working deck if replaceable mode is disabled
  // 4.1 Splice out the drawn card so it cannot be drawn again
  if (!isReplaceableEnabled) {
    deckToUse.splice(randomIndex, 1);
  }

  // STEP 5: Prepare card data and orientation
  // 5.1 Look up the full card data from AllCards
  const cardData = allCards.cards[cardName];
  // 5.2 Randomly determine orientation (0=Upright, 1=Reverse)
  const cardOrientation = Math.floor(Math.random() * 2);
  // 5.3 Create human-readable orientation text
  const orientationText = cardOrientation === 0 ? "Upright" : "Reverse";

  // STEP 6: Update detail panel with card information
  // 6.1 Set the card name in the detail panel
  setText(`card-name-${cardNum}`, cardData.name);
  // 6.2 Set the orientation in the detail panel
  setText(`card-orientation-${cardNum}`, orientationText);
  
  // STEP 7: Update table cells for this card slot
  // 7.1 Get references to the table cells using unified card ID system
  const cardNameText = cardData.name || cardName;
  const nameCell = document.getElementById(`card-list-${cardNum}`);
  const orientCell = document.getElementById(`card-orientation-list-${cardNum}`);
  
  // 7.2 Update name cell in the spread table
  if (nameCell) nameCell.textContent = cardNameText;
  // 7.3 Update orientation cell in the spread table
  if (orientCell) orientCell.textContent = orientationText;

  // STEP 8: Resolve and display card meanings based on orientation
  // 8.1 Get the meanings object from card data
  const meanings = cardData.meanings;
  // 8.2 Define the meaning categories to process
  const categories = ['person', 'creatureTrap', 'place', 'treasure', 'situation'];
  
  // 8.3 Iterate through each category and update UI
  categories.forEach(cat => {
    // 8.3.1 Map creatureTrap to the HTML ID 'creature'
    const htmlId = cat === 'creatureTrap' ? 'creature' : cat;
    // 8.3.2 Get the appropriate meaning based on orientation
    const val = cardOrientation === 0 ? meanings[cat].upright : meanings[cat].reverse;
    // 8.3.3 Update the meaning text in the UI
    setText(`meaning-${htmlId}-${cardNum}`, val);
  });
}

/*
 * Wipes the UI clean and resets the internal decks
 */
function clearAllSpreads() {
  // 1. Reset all 31 card UI slots
  for (let i = 0; i <= 30; i++) {
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    
    // 1.1 Reset Spread Tables
    const nameCell = document.getElementById(`card-list-${cardNum}`);
    const orientCell = document.getElementById(`card-orientation-list-${cardNum}`);
    if (nameCell) nameCell.textContent = '—';
    if (orientCell) orientCell.textContent = '—';
    
    // 1.2 Reset Detail Panels
    setText(`card-name-${cardNum}`, 'Card Name');
    setText(`card-orientation-${cardNum}`, 'Upright or Reversed');
    setText(`card-description-${cardNum}`, '{@i Description of the card.}');
    setText(`card-credit-${cardNum}`, 'Credit Name');
    
    const imgEl = document.getElementById(`card-image-${cardNum}`);
    if (imgEl) imgEl.src = '../JSON_Folder/Generic Soldier 4.png';
    
    const categories = ['person', 'creature', 'place', 'treasure', 'situation'];
    categories.forEach(cat => setText(`meaning-${cat}-${cardNum}`, 'Meaning for orientation'));
  }

  // 2. Refill the internal javascript decks to full capacity
  initializeWorkingDecks();
}

/*
 * Wrapper for the UI button so users don't accidentally wipe their reading
 */
function confirmAndClearBoard() {
  if (confirm("Are you sure you want to clear the board? This will remove all drawn cards.")) {
    clearAllSpreads();
  }
}

// Initialize data and set up defaults after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  fetchData().then(() => {
    // After data is loaded, open default spread and card
    const defaultSpreadBtn = document.getElementById("defaultSpreadOpen");
    if (defaultSpreadBtn) {
      defaultSpreadBtn.click();
    }
    
    const defaultCardBtn = document.getElementById("defaultOpen");
    if (defaultCardBtn) {
      defaultCardBtn.click();
    }
  }).catch(error => {
    console.error('Failed to initialize:', error);
  });
});

// Wire all generate buttons via event delegation.
// This handles C.00-C.30, works after async data load, and avoids
// the C.9 vs C.09 formatting bug that direct getElementById wiring had.
document.addEventListener('click', function(e) {
  if (!e.target || !e.target.id) return;
  const match = e.target.id.match(/^generate-button-(C\.\d+)$/);
  if (match) {
    const cardNum = match[1];
    generateCard(cardNum);
    // Open the card detail tab to display the drawn card information
    const cardTab = document.getElementById(cardNum);
    if (cardTab) {
      cardTab.style.display = 'block';
      // Also highlight the card slot button as active if it exists
      const tablinks = document.getElementsByClassName("tablinks");
      for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
      const tabcontent = document.getElementsByClassName("tabcontent");
      for (let i = 0; i < tabcontent.length; i++) {
        if (tabcontent[i].id !== cardNum) {
          tabcontent[i].style.display = "none";
        }
      }
    }
  }
});

// ========== IMPORT/EXPORT FUNCTIONS ==========
//
// OVERVIEW: These functions allow you to save and load card readings.
//
// EXPORT: Takes all the cards currently displayed on screen (C.00-C.30),
// grabs their names and orientations, packages everything into a JSON object
// with a timestamp, and downloads it as a file. Only cards that have been
// actually drawn are saved (skips empty slots with default text).
//
// IMPORT: Reads a previously exported JSON file, validates it has the right
// format, then restores all the cards, orientations, deck selections, and
// settings back onto the screen. If a card in the file no longer exists in
// the current card database, it's skipped with a warning.
//
// The JSON structure: { version, timestamp, settings, cards }
// Settings include: isReplaceableEnabled flag and selectedDecks for each spread
// Cards are keyed by slot (C.00, C.01, etc.) with name and orientation info

/*
 * Export the current reading to a JSON file
 * Captures all drawn cards, orientations, deck selections, and settings
 */
function exportReading() {
  // STEP 1: Create the reading data structure with metadata
  // 1.1 Initialize reading data object with version and timestamp
  const readingData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    // 1.2 Store current settings (replacement mode and deck selections)
    settings: {
      isReplaceableEnabled: isReplaceableEnabled,
      selectedDecks: { ...selectedDecks }
    },
    // 1.3 Initialize empty cards object for collected card data
    cards: {}
  };

  // STEP 2: Collect all drawn cards from C.00 to C.30
  // 2.1 Iterate through all 31 card slots
  for (let i = 0; i <= 30; i++) {
    // 2.2 Format card number with leading zero (C.00-C.30)
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    
    // 2.3 Get references to card name and orientation elements
    const nameEl = document.getElementById(`card-name-${cardNum}`);
    const orientEl = document.getElementById(`card-orientation-${cardNum}`);
    
    // 2.4 Only process if both elements exist
    if (nameEl && orientEl) {
      // 2.5 Extract card name and orientation text content
      const cardName = nameEl.textContent;
      const orientation = orientEl.textContent;
      
      // 2.6 Only save if a card has been drawn (skip default placeholder text)
      if (cardName && cardName !== "Card Name" && orientation !== "Upright or Reversed") {
        // 2.7 Add the drawn card to the export data
        readingData.cards[cardNum] = {
          name: cardName,
          orientation: orientation
        };
      }
    }
  }

  // STEP 3: Generate filename with ISO timestamp
  // 3.1 Create timestamp and remove colons/periods for filename compatibility
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  // 3.2 Build filename: card-reading-YYYY-MM-DDTHH-MM-SS.json
  const filename = `card-reading-${timestamp}.json`;

  // STEP 4: Create downloadable blob from reading data
  // 4.1 Convert reading data object to formatted JSON string
  // 4.2 Create blob with application/json MIME type for proper file handling
  const blob = new Blob([JSON.stringify(readingData, null, 2)], { type: 'application/json' });
  
  // STEP 5: Trigger file download to user's device
  // 5.1 Create a URL pointing to the blob data
  const url = URL.createObjectURL(blob);
  // 5.2 Create a temporary anchor element for the download
  const a = document.createElement('a');
  // 5.3 Set the download link to the blob URL
  a.href = url;
  // 5.4 Set the filename for the downloaded file
  a.download = filename;
  // 5.5 Add anchor to DOM (required for some browsers)
  document.body.appendChild(a);
  // 5.6 Simulate a click to trigger the download
  a.click();
  // 5.7 Remove the temporary anchor from DOM
  document.body.removeChild(a);
  // 5.8 Revoke the blob URL to free memory resources
  URL.revokeObjectURL(url);

  // STEP 6: Provide feedback to the user
  // 6.1 Log export details to browser console
  console.log(`Exported reading with ${Object.keys(readingData.cards).length} cards to ${filename}`);
  // 6.2 Show success alert with card count
  alert(`Reading exported successfully!\n${Object.keys(readingData.cards).length} cards saved.`);
}

/*
 * Import a reading from a JSON file
 * Restores all cards, orientations, deck selections, and settings
 */
function importReading(event) {
  // STEP 1: Get the selected file from the input element
  // 1.1 Extract file from the change event
  const file = event.target.files[0];
  // 1.2 Return early if no file selected
  if (!file) return;

  // STEP 2: Read the file contents using FileReader API
  // 2.1 Create a new FileReader instance
  const reader = new FileReader();
  // 2.2 Define callback for when file reading completes
  reader.onload = function(e) {
    try {
      // STEP 3: Parse the JSON file contents
      // 3.1 Parse the file text to JSON object
      const readingData = JSON.parse(e.target.result);
      
      // STEP 4: Validate the imported file format
      // 4.1 Check that version exists and cards object exists
      if (!readingData.version || !readingData.cards) {
        throw new Error('Invalid reading file format');
      }

      // STEP 5: Restore application settings from the import file
      // 5.1 Check if settings exist in the import file
      if (readingData.settings) {
        // 5.2 Restore the replaceable mode setting
        // 5.2.1 Check if replacement setting is defined
        if (typeof readingData.settings.isReplaceableEnabled !== 'undefined') {
          // 5.2.2 Update the global replaceable flag
          isReplaceableEnabled = readingData.settings.isReplaceableEnabled;
          // 5.2.3 Update the UI toggle checkbox
          const toggle = document.getElementById('replaceableToggle');
          if (toggle) {
            toggle.checked = isReplaceableEnabled;
          }
        }

        // 5.3 Restore deck selections from the import file
        // 5.3.1 Check if selectedDecks exist in the file
        if (readingData.settings.selectedDecks) {
          // 5.3.2 Copy all deck selections from file to current state
          Object.assign(selectedDecks, readingData.settings.selectedDecks);
          
          // 5.3.3 Update all deck selector dropdowns in UI
          // 5.3.3.1 Define all spread keys
          const spreads = ['adventure', 'fiveCard', 'threeCard', 'journey'];
          // 5.3.3.2 Update each spread's deck selector
          spreads.forEach(spread => {
            const selectEl = document.getElementById(`deck-select-${spread}`);
            if (selectEl && selectedDecks[spread]) {
              selectEl.value = selectedDecks[spread];
            }
          });
        }
      }
      // STEP 6: Clear the current board before restoring
      // 6.1 Clear all existing cards from the display
      clearAllSpreads(); // Clear current reading before restoring
      // 6.2 Initialize counters for import reporting
      let cardsRestored = 0;
      let cardsMissing = 0;

      // STEP 7: Restore each card from the import file
      // 7.1 Iterate through all cards in the import data
      for (const [cardNum, cardInfo] of Object.entries(readingData.cards)) {
        // 7.2 Verify the card still exists in current AllCards database
        // 7.2.1 Check if card name exists in database
        if (!allCards.cards[cardInfo.name]) {
          // 7.2.2 Log and skip cards that no longer exist
          console.warn(`Card "${cardInfo.name}" not found in current card database`);
          cardsMissing++;
          continue;
        }

        // 7.3 Prepare card data for restoration
        // 7.3.1 Get full card data from database
        const cardData = allCards.cards[cardInfo.name];
        // 7.3.2 Get orientation from import file
        const orientation = cardInfo.orientation;
        // 7.3.3 Convert orientation text to numeric code (0=Upright, 1=Reverse)
        const cardOrientation = orientation === "Upright" ? 0 : 1;

        // 7.4 Update detail panel with restored card
        // 7.4.1 Set card name in detail panel
        setText(`card-name-${cardNum}`, cardData.name);
        // 7.4.2 Set orientation in detail panel
        setText(`card-orientation-${cardNum}`, orientation);

        // 7.5 Update table cells with restored card
        // 7.5.1 Get table cell elements
        const nameCell = document.getElementById(`card-list-${cardNum}`);
        const orientCell = document.getElementById(`card-orientation-list-${cardNum}`);
        // 7.5.2 Update table name cell
        if (nameCell) nameCell.textContent = cardData.name;
        // 7.5.3 Update table orientation cell
        if (orientCell) orientCell.textContent = orientation;

        // 7.6 Restore card meanings based on orientation
        // 7.6.1 Get all meanings for the card
        const meanings = cardData.meanings;
        // 7.6.2 Define meaning categories
        const categories = ['person', 'creatureTrap', 'place', 'treasure', 'situation'];
        
        // 7.6.3 Iterate through each meaning category
        categories.forEach(cat => {
          // 7.6.3.1 Map creatureTrap to HTML ID 'creature'
          const htmlId = cat === 'creatureTrap' ? 'creature' : cat;
          // 7.6.3.2 Get appropriate meaning based on orientation
          const val = cardOrientation === 0 ? meanings[cat].upright : meanings[cat].reverse;
          // 7.6.3.3 Update the meaning in the UI
          setText(`meaning-${htmlId}-${cardNum}`, val);
        });
        // 7.7 Remove the imported card from the working deck so it can't be drawn again
        if (!isReplaceableEnabled) {
          const spreadKey = getSpreadKey(cardNum);
          const index = workingDecks[spreadKey].indexOf(cardInfo.name);
          if (index > -1) {
            workingDecks[spreadKey].splice(index, 1);
          }
        }

        // 7.8 Increment counter of successfully restored cards
        cardsRestored++;
      }

      // STEP 8: Provide feedback to user about import results
      // 8.1 Log import summary to console
      console.log(`Import complete: ${cardsRestored} cards restored, ${cardsMissing} cards missing`);
      
      // 8.2 Build user-friendly message
      let message = `Reading imported successfully!\n${cardsRestored} cards restored.`;
      // 8.3 Add warning if any cards were missing
      if (cardsMissing > 0) {
        message += `\n\n⚠️ ${cardsMissing} cards were not found in the current deck and were skipped.`;
      }
      // 8.4 Alert user with import results
      alert(message);

      // STEP 9: Reset file input for future imports
      // 9.1 Clear the file input value so same file can be imported again if needed
      event.target.value = '';

    } catch (error) {
      // STEP 10: Handle any errors during import process
      // 10.1 Log error to console
      console.error('Failed to import reading:', error);
      // 10.2 Alert user of the error with details
      alert(`Failed to import reading:\n${error.message}`);
      // 10.3 Reset file input value
      event.target.value = '';
    }
  };

  // STEP 11: Start reading the file
  // 11.1 Trigger file reading as text
  reader.readAsText(file);
}

/*
 * Toggle whether cards can be drawn with replacement
 * When enabled, cards can appear multiple times in the same spread
 * When disabled, cards are removed from the deck after being drawn
 */
function toggleReplaceable() {
  // STEP 1: Get the current toggle state
  // 1.1 Get reference to the replaceable toggle checkbox
  const toggle = document.getElementById("replaceableToggle");
  // 1.2 Update global flag based on checkbox state
  isReplaceableEnabled = toggle.checked;
  
  // STEP 2: Provide user feedback
  // 2.1 Log the change to console showing enabled or disabled state
  console.log(`Card replacement is now ${isReplaceableEnabled ? 'enabled' : 'disabled'}`);
}