// node - filename: list_missing_cards.js
const path = require('path');
const a = require(path.resolve("c:/Users/sbawaney/Documents/VSCode Files/DeckOfAdventuring/5etools_DoMMT.json"));
const b = require(path.resolve("c:/Users/sbawaney/Documents/VSCode Files/DeckOfAdventuring/CardsJsons/AllCards.json"));

const namesA = new Set(a.cards.map(c => c.name).filter(Boolean));
const namesB = new Set(Object.keys(b.cards || {}));

const missing = [...namesA].filter(n => !namesB.has(n)).sort();
console.log(missing.length ? missing.join("\n") : "None - all cards present in AllCards.json");