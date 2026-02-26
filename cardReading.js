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

    populateDropdown(allDecks);
    return allDecks;

  } catch (error) {
    console.error('Failed to load card data:', error);
    throw error;
  }
}

// No longer needed - cards are preloaded in allCards
// async function fetchCardData(cardName) {
//   const responseCard = await fetch(`${CARD_DIR}/${cardName}.json`);
//   if (!responseCard.ok) {
//     throw new Error(`HTTP error! status: ${responseCard.status}`);
//   }
//   const cardData = await responseCard.json();
//   return cardData;
// }

function populateDropdown(deckLists) {
  // Set selectedDeck FIRST so it's valid before any event fires
  selectedDeck = Object.keys(deckLists)[0];

  let dropdown = "<select id='deck-select'>"; // No inline onchange — we use addEventListener below
  for (let deckName in deckLists) {
    dropdown += `<option value="${deckName}">${deckName}</option>`;
  }
  dropdown += "</select>";
  document.getElementById("dropdown").innerHTML = dropdown;

  const sel = document.getElementById("deck-select");
  sel.value = selectedDeck; // Now this will actually match an option

  sel.addEventListener("change", function() {
    selectedDeck = this.value;
    // Notify the deck-theme script if present
    sel.dispatchEvent(new Event('deck-theme-change', { bubbles: true }));
  });
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

// Removed early querySelectorAll - buttons are wired at bottom of script after DOM is ready
/*
function generateCard(cardNum, cardName) {
  let randomElement = Math.floor(Math.random() * deckLists.deckName.cardName.length);
  let cardOrientation = Math.floor(Math.random() * 2);
  let elementType = Math.floor(Math.random() * deckLists.deckName[randomElement].cardName.length);

  // Display the result in the relevant sector element
  document.getElementById(`random-element-${cardNum}`).innerText = deckLists.deckName.cardName[randomElement].type + ' (' + randomElement + ')';

  // Display the result in the relevant sector subtype
  document.getElementById(`random-subtype-${cardNum}`).innerText = deckLists.deckName.cardName[randomElement].planetSubType[elementType];


  let creatureType = deckLists.deckName.cardName[randomElement].creatureType.join('\n\n'); //A simpler way to do it but less formatting options 
  // Display the result in the relevant sector creatures
  document.getElementById(`random-creature-${cardNum}`).innerText = creatureType;
}*/

/* Assuming `cardAberration` is the JSON object from Aberration.json
function generateCard(cardNum, cardAberration) {
  
  let cardOrientation = Math.floor(Math.random() * 2)
  //const orientation = document.getElementById("card-orientation-C.00").textContent.trim();
  
  // Update card name and description
  document.getElementById("card-name").textContent = cardAberration.name;
  document.getElementById("card-description-C.00").textContent = cardAberration.description;
  if (cardOrientation == 0) {
    document.getElementById("card-orientation-C.00").textContent = "Upright";
  }
  else {
    document.getElementById("card-orientation-C.00").textContent = "Reverse";
  }

  // Update meanings based on orientation (Upright or Reversed)
  if (cardOrientation == 0) {
    document.getElementById("meaning-person-C.00").textContent = cardAberration.meanings.person.upright;
  }
  else {
    document.getElementById("meaning-person-C.00").textContent = cardAberration.meanings.person.reverse;
  }
  document.getElementById("meaning-person-C.00").textContent = cardAberration.meanings.person[cardOrientation];
  document.getElementById("meaning-creature-C.00").textContent = cardAberration.meanings.creatureTrap[cardOrientation];
  document.getElementById("meaning-place-C.00").textContent = cardAberration.meanings.place[cardOrientation];
  document.getElementById("meaning-treasure-C.00").textContent = cardAberration.meanings.treasure[cardOrientation];
  document.getElementById("meaning-situation-C.00").textContent = cardAberration.meanings.situation[cardOrientation];
}
*/
function generateCard(cardNum) {
  if (!allCards || !allDecks) {
    console.error("Card data not yet loaded. Please wait for data to finish loading.");
    return;
  }
  if (!selectedDeck || !allDecks[selectedDeck]) {
    console.error(`No valid deck selected. selectedDeck="${selectedDeck}", available:`, Object.keys(allDecks));
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

// Initialize data
fetchData();

// Get the element with id="defaultSpreadOpen" and click on it to show default spread
if (document.getElementById("defaultSpreadOpen")) {
  document.getElementById("defaultSpreadOpen").click();
}

// Get the element with id="defaultOpen" and click on it
if (document.getElementById("defaultOpen")) {
  document.getElementById("defaultOpen").click();
}

// Wire generate buttons via event delegation — works regardless of load timing
// and handles both zero-padded (C.09) and non-padded (C.9) formats
document.addEventListener('click', function(e) {
  if (!e.target || !e.target.id) return;
  const match = e.target.id.match(/^generate-button-(C\.\d+)$/);
  if (match) {
    generateCard(match[1]);
  }
});
