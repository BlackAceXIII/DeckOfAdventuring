let deckLists;
let selectedDeck = null; // Default deck selection
let cardData = null; // This will hold the data from deckLists.json
let cardName = null; // This will hold the name of the card
let deckName = null; // This will hold the name of the deck

const drawData = {
  "C.00": { cType: "" },
  "C.01": { cType: "" },
  "C.02": { cType: "" },
  "C.03": { cType: "" },
  "C.04": { cType: "" },
  "C.05": { cType: "" },
  "C.06": { cType: "" },
  "C.07": { cType: "" },
  "C.08": { cType: "" },
  "C.09": { cType: "" }
};

async function fetchData() {
  const responseDeckList = await fetch('../JSON_Folder/deckLists.json'); //delayed fetch
  //const aberration = await fetch('../JSON_Folder/CardsJsons/Aberrations2.json');//temporary to test a card
  //cardAberration =  await aberration.json(); //temporary to test a card
  console.log(responseDeckList);
  deckLists = await responseDeckList.json(); //This stores the info from the JSON so the generate function can use it and the button can reference it.
  populateDropdown(deckLists);
  return deckLists;// cardAberration;//temporary to test a card
}

async function fetchCardData(cardName) {
  const responseCard = await fetch(`../JSON_Folder/CardsJsons/${cardName}.json`); // Fetch the card data from the JSON file
  if (!responseCard.ok) { // Check if the response is OK
    throw new Error(`HTTP error! status: ${responseCard.status}`); // Throw an error if the fetch fails
  }
  const cardData = await responseCard.json(); // Parse the JSON data
  return cardData; // Return the card data
}

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

function redrawAll() {
  for (let i = 0; i <= 9; i++) {
    generateCard(`C.0${i}`, deckLists.deckName.cardName);
  }
  return;
}

document.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', function() {
    handleButtonClick(this.id);
  });
});

function handleButtonClick(id) {
  switch (id) {
    case 'generate-button-C.00':
      generateCard("C.00", cardAberration);
      break;
    case 'generate-button-C.01':
      generateCard("C.01", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.02':
      generateCard("C.02", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.03':
      generateCard("C.03", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.04':
      generateCard("C.04", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.05':
      generateCard("C.05", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.06':
      generateCard("C.06", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.07':
      generateCard("C.07", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.08':
      generateCard("C.08", deckLists.deckName.cardName);
      break;
    case 'generate-button-C.09':
      generateCard("C.09", deckLists.deckName.cardName);
      break;
  }
}
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
function generateCard(cardNum, deckName) {
  if (!deckLists || !selectedDeck || !deckLists[selectedDeck] || deckLists[selectedDeck].length === 0) {
    console.error("No data available or selected deck is empty.");
    return;
  }
  // Get the card data from the selected deck
  cardName = deckLists[selectedDeck][cardNum]; // Assuming deckLists[selectedDeck] is an array of card objects
  //const responseCard = fetch('../JSON_Folder/CardsJsons/${cardName}.json');//temporary to test a card
  cardData = fetchCardData(cardName);
  //cardData =  responseCard.json(); //temporary to test a card
  // Determines if the card is upright or reversed
  let cardOrientation = Math.floor(Math.random() * 2);

    // Update card name and description
  document.getElementById("card-name").textContent = cardData.name;
  document.getElementById("card-description-C.00").textContent = cardData.description;
  if (cardOrientation == 0) {
    document.getElementById("card-orientation-C.00").textContent = "Upright";
  }
  else {
    document.getElementById("card-orientation-C.00").textContent = "Reverse";
  }

  // Update meanings based on orientation (Upright or Reversed)
  if (cardOrientation == 0) {
    document.getElementById("meaning-person-C.00").textContent = cardData.meanings.person.upright;
  }
  else {
    document.getElementById("meaning-person-C.00").textContent = cardData.meanings.person.reverse;
  }
  document.getElementById("meaning-person-C.00").textContent = cardData.meanings.person[cardOrientation];
  document.getElementById("meaning-creature-C.00").textContent = cardData.meanings.creatureTrap[cardOrientation];
  document.getElementById("meaning-place-C.00").textContent = cardData.meanings.place[cardOrientation];
  document.getElementById("meaning-treasure-C.00").textContent = cardData.meanings.treasure[cardOrientation];
  document.getElementById("meaning-situation-C.00").textContent = cardData.meanings.situation[cardOrientation];


}

fetchData();

// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();
