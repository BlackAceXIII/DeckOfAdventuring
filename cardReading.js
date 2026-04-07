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
  const spreads = ['adventure', 'fiveCard', 'threeCard', 'journey'];
  spreads.forEach(spread => {
    const deckName = selectedDecks[spread];
    if (allDecks && allDecks[deckName]) {
      workingDecks[spread] = [...allDecks[deckName]];
    } else if (allDecks) {
      // Fallback to first deck if selection is invalid
      const firstDeck = Object.keys(allDecks)[0];
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
  // Initialize all spreads with the first available deck
  const defaultDeck = Object.keys(deckLists)[0];
  selectedDecks.adventure = defaultDeck;
  selectedDecks.fiveCard = defaultDeck;
  selectedDecks.threeCard = defaultDeck;
  selectedDecks.journey = defaultDeck;
  initializeWorkingDecks();

  // Create dropdown for each spread
  const spreads = [
    { key: 'adventure', id: 'deck-select-adventure', label: 'Adventure Spread' },
    { key: 'fiveCard', id: 'deck-select-fiveCard', label: 'Five-Card Spread' },
    { key: 'threeCard', id: 'deck-select-threeCard', label: 'Three-Card Spread' },
    { key: 'journey', id: 'deck-select-journey', label: 'Journey Spread' }
  ];

  spreads.forEach(spread => {
    createSpreadDeckSelector(spread.key, spread.id, spread.label, deckLists);
  });
}

// Create a deck selector for a specific spread
function createSpreadDeckSelector(spreadKey, selectId, label, deckLists) {
  let dropdown = `<label>${label} Deck:</label><select id="${selectId}" class="deck-select-spread">`;
  for (let deckName in deckLists) {
    dropdown += `<option value="${deckName}">${deckName}</option>`;
  }
  dropdown += "</select>";
  
  const container = document.getElementById(`${spreadKey}-deck-selector`);
  if (container) {
    container.innerHTML = dropdown;
    const sel = document.getElementById(selectId);
    sel.value = selectedDecks[spreadKey];
    sel.addEventListener("change", function() {
      selectedDecks[spreadKey] = this.value;
      initializeWorkingDecks();
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

function openCard(evt, cardNum, buttonElement) {
  var i, tabcontent, tablinks;
  
  // Hide all tab content
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  
  // Remove active class from all tab links
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  
  // Show the selected card's tab
  const cardElement = document.getElementById(cardNum);
  if (cardElement) {
    cardElement.style.display = "block";
  } else {
    console.error(`Card element ${cardNum} not found`);
  }
  
  // Add active class to the clicked button
  // Prefer the explicitly passed buttonElement, fall back to event.target or currentTarget
  let activeButton = buttonElement || (evt && (evt.target || evt.currentTarget));
  if (activeButton && activeButton.classList) {
    activeButton.classList.add("active");
  } else if (activeButton) {
    activeButton.className += " active";
  }
}

// FIXED: Tab switching logic to ensure content is visible
function openSpread(evt, spreadName) {
  const spreadTabcontent = document.getElementsByClassName("spread-tabcontent");
  for (let i = 0; i < spreadTabcontent.length; i++) {
    spreadTabcontent[i].style.display = "none";
  }
  
  const spreadTablinks = document.getElementsByClassName("spread-tablinks");
  for (let i = 0; i < spreadTablinks.length; i++) {
    spreadTablinks[i].classList.remove("active");
  }

  const target = document.getElementById(spreadName);
  if (target) {
    target.style.display = "block";
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
  const spreadKey = getSpreadKey(cardNum);
  const deckName = selectedDecks[spreadKey];
  
  if (!allCards || !allDecks) return;

  let deckToUse = isReplaceableEnabled ? allDecks[deckName] : workingDecks[spreadKey];
  
  if (!isReplaceableEnabled && (!deckToUse || deckToUse.length === 0)) {
    // Silently refill the deck if empty
    workingDecks[spreadKey] = [...allDecks[deckName]];
    deckToUse = workingDecks[spreadKey];
  }

  if (deckToUse.length === 0) {
    console.error(`No cards available in deck ${deckName}`);
    return;
  }

  const randomIndex = Math.floor(Math.random() * deckToUse.length);
  const cardName = deckToUse[randomIndex];
  
  if (!isReplaceableEnabled) {
    deckToUse.splice(randomIndex, 1);
  }

  const cardData = allCards.cards[cardName];
  const cardOrientation = Math.floor(Math.random() * 2);
  const orientationText = cardOrientation === 0 ? "Upright" : "Reverse";

  // Update Detail Panel
  setText(`card-name-${cardNum}`, cardData.name);
  setText(`card-orientation-${cardNum}`, orientationText);
  
  // Dynamic Table Update: This will instantly find and update ANY table in the app perfectly
  // Uses unified card IDs (card-list-C.##) that work across all spreads
  const cardNameText = cardData.name || cardName;
  const nameCell = document.getElementById(`card-list-${cardNum}`);
  const orientCell = document.getElementById(`card-orientation-list-${cardNum}`);
  
  if (nameCell) nameCell.textContent = cardNameText;
  if (orientCell) orientCell.textContent = orientationText;

  // Resolve meanings based on the object structure in AllCards.json
  const meanings = cardData.meanings;
  const categories = ['person', 'creatureTrap', 'place', 'treasure', 'situation'];
  
  categories.forEach(cat => {
    // Map creatureTrap to the ID 'creature' used in your HTML
    const htmlId = cat === 'creatureTrap' ? 'creature' : cat;
    const val = cardOrientation === 0 ? meanings[cat].upright : meanings[cat].reverse;
    setText(`meaning-${htmlId}-${cardNum}`, val);
  });
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

/**
 * Export the current reading to a JSON file
 * Captures all drawn cards, orientations, deck selections, and settings
 */
function exportReading() {
  const readingData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    settings: {
      isReplaceableEnabled: isReplaceableEnabled,
      selectedDecks: { ...selectedDecks }
    },
    cards: {}
  };

  // Collect all card data from C.00 to C.30
  for (let i = 0; i <= 30; i++) {
    const cardNum = i < 10 ? `C.0${i}` : `C.${i}`;
    
    // Get card name from the detail panel
    const nameEl = document.getElementById(`card-name-${cardNum}`);
    const orientEl = document.getElementById(`card-orientation-${cardNum}`);
    
    if (nameEl && orientEl) {
      const cardName = nameEl.textContent;
      const orientation = orientEl.textContent;
      
      // Only save if a card has been drawn (not the default "Card Name" text)
      if (cardName && cardName !== "Card Name" && orientation !== "Upright or Reversed") {
        readingData.cards[cardNum] = {
          name: cardName,
          orientation: orientation
        };
      }
    }
  }

  // Create filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `card-reading-${timestamp}.json`;

  // Create and download the file
  const blob = new Blob([JSON.stringify(readingData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`Exported reading with ${Object.keys(readingData.cards).length} cards to ${filename}`);
  alert(`Reading exported successfully!\n${Object.keys(readingData.cards).length} cards saved.`);
}

/**
 * Import a reading from a JSON file
 * Restores all cards, orientations, deck selections, and settings
 */
function importReading(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const readingData = JSON.parse(e.target.result);
      
      // Validate the file format
      if (!readingData.version || !readingData.cards) {
        throw new Error('Invalid reading file format');
      }

      // Restore settings
      if (readingData.settings) {
        // Restore replacement toggle
        if (typeof readingData.settings.isReplaceableEnabled !== 'undefined') {
          isReplaceableEnabled = readingData.settings.isReplaceableEnabled;
          const toggle = document.getElementById('replaceableToggle');
          if (toggle) {
            toggle.checked = isReplaceableEnabled;
          }
        }

        // Restore deck selections
        if (readingData.settings.selectedDecks) {
          Object.assign(selectedDecks, readingData.settings.selectedDecks);
          
          // Update all deck selector dropdowns
          const spreads = ['adventure', 'fiveCard', 'threeCard', 'journey'];
          spreads.forEach(spread => {
            const selectEl = document.getElementById(`deck-select-${spread}`);
            if (selectEl && selectedDecks[spread]) {
              selectEl.value = selectedDecks[spread];
            }
          });
        }
      }

      let cardsRestored = 0;
      let cardsMissing = 0;

      // Restore each card
      for (const [cardNum, cardInfo] of Object.entries(readingData.cards)) {
        // Verify the card still exists in AllCards.json
        if (!allCards.cards[cardInfo.name]) {
          console.warn(`Card "${cardInfo.name}" not found in current card database`);
          cardsMissing++;
          continue;
        }

        // Restore the card data
        const cardData = allCards.cards[cardInfo.name];
        const orientation = cardInfo.orientation;
        const cardOrientation = orientation === "Upright" ? 0 : 1;

        // Update detail panel
        setText(`card-name-${cardNum}`, cardData.name);
        setText(`card-orientation-${cardNum}`, orientation);

        // Update table cells
        const nameCell = document.getElementById(`card-list-${cardNum}`);
        const orientCell = document.getElementById(`card-orientation-list-${cardNum}`);
        if (nameCell) nameCell.textContent = cardData.name;
        if (orientCell) orientCell.textContent = orientation;

        // Restore meanings
        const meanings = cardData.meanings;
        const categories = ['person', 'creatureTrap', 'place', 'treasure', 'situation'];
        
        categories.forEach(cat => {
          const htmlId = cat === 'creatureTrap' ? 'creature' : cat;
          const val = cardOrientation === 0 ? meanings[cat].upright : meanings[cat].reverse;
          setText(`meaning-${htmlId}-${cardNum}`, val);
        });

        cardsRestored++;
      }

      console.log(`Import complete: ${cardsRestored} cards restored, ${cardsMissing} cards missing`);
      
      let message = `Reading imported successfully!\n${cardsRestored} cards restored.`;
      if (cardsMissing > 0) {
        message += `\n\n⚠️ ${cardsMissing} cards were not found in the current deck and were skipped.`;
      }
      alert(message);

      // Reset the file input so the same file can be imported again if needed
      event.target.value = '';

    } catch (error) {
      console.error('Failed to import reading:', error);
      alert(`Failed to import reading:\n${error.message}`);
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}

function toggleReplaceable() {
  const toggle = document.getElementById("replaceableToggle");
  isReplaceableEnabled = toggle.checked;
  // Update the global setting for whether cards can be replaced
  // This will affect how generateCard selects cards from the deck
  // If isReplaceableEnabled is true, cards can appear multiple times
  // If false, they are removed from the deck after being drawn
  console.log(`Card replacement is now ${isReplaceableEnabled ? 'enabled' : 'disabled'}`);
}