# Technical Context Document: Card Reading Tool
*AI bootstrap reference — prefer this document over reading source files for architectural decisions.*

---

## 1. Core Architecture & Stack

- **Engine:** Client-side only. Vanilla HTML5, CSS3 (CSS custom properties throughout), ES6+ JavaScript. No framework, no build step.
- **Entry point:** `cardReading.html` loads `cardReading.css` and `cardReading.js`. All logic is in the single JS file (~1800 lines).
- **Hosting:** `file://` or local web server. `fetch()` fails on `file://` in most mobile browsers — a local server is required for mobile testing.
- **Data load:** `fetchData()` fires on page load, fetches all three JSON files in parallel, populates globals, then initializes UI. No further fetches occur at runtime.

### Data Files (all in `./CardsJsons/`)
| File | Required | Purpose |
|---|---|---|
| `AllCards.json` | Yes | Master card glossary — 66 cards |
| `deckLists.json` | Yes | Built-in named deck definitions |
| `customDecks.json` | No | Optional user-editable decks, merged over built-ins on load |

### localStorage Keys
| Key | Value type | Purpose |
|---|---|---|
| `userCustomDecks` | JSON stringified `{ [deckName]: string[] }` | Persists Deck Forge custom decks across sessions |

*No other localStorage keys are used. Do not add new keys without documenting them here.*

---

## 2. Global State Schema

```javascript
// Declared at top of cardReading.js
let selectedDecks = {
  adventure: 'Default', fiveCard: 'Default',
  threeCard: 'Default', journey: 'Default'
};                              // Active deck name per spread; falls back to Object.keys(allDecks)[0]
let isReplaceableEnabled = false;       // Replacement toggle state
let allDecks = {};             // Combined deck map: { [deckName]: string[] }
let customDeckCart = {};       // Deck Forge staging: { [cardName]: quantity }
let allCards = null;           // Parsed AllCards.json — access cards via allCards.cards[name]
let workingDecks = {           // Per-spread draw pools; spliced on each non-replaceable draw
  adventure: [], fiveCard: [], threeCard: [], journey: []
};
const CARD_DIR = './CardsJsons';        // Base path for all JSON fetches
```

### Slot ID System & SPREAD_SLOTS Constant

```javascript
const SPREAD_SLOTS = {
  'adventure-spread': [
    { id: 'C.00', label: 'Party Gathers' },   { id: 'C.01', label: 'Adventure Begins' },
    { id: 'C.02', label: 'Journey' },          { id: 'C.03', label: 'Entrance' },
    { id: 'C.04', label: 'Challenge 1' },      { id: 'C.05', label: 'Challenge 2' },
    { id: 'C.06', label: 'Challenge 3' },      { id: 'C.07', label: 'Guardian' },
    { id: 'C.08', label: 'Treasure' }
  ],
  'five-card-spread': [
    { id: 'C.09', label: 'The Quest' },        { id: 'C.10', label: 'The Outcome' },
    { id: 'C.11', label: 'The Challenge' },    { id: 'C.12', label: 'That Which is Hidden' },
    { id: 'C.13', label: 'That Which is Needed' }
  ],
  'three-card-spread': [
    { id: 'C.14', label: 'Past' }, { id: 'C.15', label: 'Present' }, { id: 'C.16', label: 'Future' }
  ],
  'journey-spread': [
    { id: 'C.17', label: 'Stage 1 Challenge' }, { id: 'C.18', label: 'Stage 2 Challenge' },
    { id: 'C.19', label: 'Stage 3 Challenge' }, { id: 'C.20', label: 'Stage 4 Challenge' },
    { id: 'C.21', label: 'Stage 5 Challenge' }, { id: 'C.22', label: 'Stage 6 Challenge' },
    { id: 'C.23', label: 'Stage 7 Challenge' }, { id: 'C.24', label: 'Stage 1 Reward' },
    { id: 'C.25', label: 'Stage 2 Reward' },    { id: 'C.26', label: 'Stage 3 Reward' },
    { id: 'C.27', label: 'Stage 4 Reward' },    { id: 'C.28', label: 'Stage 5 Reward' },
    { id: 'C.29', label: 'Stage 6 Reward' },    { id: 'C.30', label: 'Stage 7 Reward' }
  ]
  // Blank Slate reuses C.00–C.16 in a free-form context; no SPREAD_SLOTS entry.
  // Deck Forge is not a spread; it has no SPREAD_SLOTS entry.
};
```

### Spread Key Forms — Two Distinct Namespaces
Functions use one of two forms. Do not mix them.

| Human label | Element ID (from `getActiveSpread()`) | Spread key (for globals) |
|---|---|---|
| Adventure Spread | `'adventure-spread'` | `'adventure'` |
| Five-Card Spread | `'five-card-spread'` | `'fiveCard'` |
| Three-Card Spread | `'three-card-spread'` | `'threeCard'` |
| Journey Spread | `'journey-spread'` | `'journey'` |
| Blank Slate Spread | `'blank-slate-spread'` | *(no workingDeck entry)* |
| Deck Forge | `'deck-forge-spread'` | *(not a spread)* |

`getActiveSpread()` returns the **element ID form**. `getSpreadKey(cardNum)` returns the **spread key form**. Many functions contain a local mapping object between the two.

---

## 3. HTML Element ID Taxonomy

### Per-Card IDs (31 slots: C.00–C.30)
Every card slot has this fixed set of IDs. All are written by `generateCard()` and `placeCard()`, reset by `clearAllSpreads()`.

| Pattern | Contains | Written by |
|---|---|---|
| `card-name-C.##` | Card name string | `generateCard`, `placeCard`, `importReading` |
| `card-orientation-C.##` | `'Upright'` or `'Reverse'` (string) | `generateCard`, `placeCard`, `importReading` |
| `card-description-C.##` | Flavour description text | `generateCard`, `placeCard` |
| `card-credit-C.##` | Attribution string | `generateCard`, `placeCard` |
| `card-list-C.##` | Card name in summary table | `generateCard`, `placeCard`, `clearAllSpreads` |
| `card-orientation-list-C.##` | Orientation in summary table | `generateCard`, `placeCard`, `clearAllSpreads` |
| `meaning-person-C.##` | Person meaning text | `generateCard`, `placeCard`, `importReading`, `clearAllSpreads` |
| `meaning-creature-C.##` | Creature/Trap meaning text | same as above |
| `meaning-place-C.##` | Place meaning text | same as above |
| `meaning-treasure-C.##` | Treasure meaning text | same as above |
| `meaning-situation-C.##` | Situation meaning text | same as above |
| `meanings-C.##` | Container `<div>` for all five meaning panels | HTML only; not written by JS |
| `generate-button-C.##` | The "Draw a Card" button for this slot | HTML only |

### Spread Tab Content IDs
```
adventure-spread        five-card-spread        three-card-spread
journey-spread          blank-slate-spread      deck-forge-spread
```

### Deck Selector IDs (injected by `createSpreadDeckSelector`)
```
adventure-deck-selector     five-card-deck-selector
three-card-deck-selector    journey-deck-selector
```

### Sidebar IDs
| ID | Purpose |
|---|---|
| `deck-sidebar` | Sidebar root element; classes `collapsed` (desktop) / `mobile-open` (mobile) |
| `sidebar-deck-name` | Active deck name label |
| `sidebar-card-count` | "N cards left" counter |
| `sidebar-card-list` | Card availability list container |
| `sidebar-backdrop` | Mobile full-screen tap-to-close overlay |
| `mobile-sidebar-toggle` | Fixed hamburger button; visible only at ≤768px |

### Quick Fill IDs
| ID | Purpose |
|---|---|
| `quick-fill-overlay` | Full-screen modal overlay; `display: flex` when open |
| `qf-spread-name` | Panel title span |
| `qf-rows` | Container for all `.qf-row` elements |
| `card-names-list` | `<datalist>` providing autocomplete options; refreshed on every `openQuickFill()` |

### Deck Forge Preview Panel IDs
```
preview-name        preview-credit      preview-description
preview-up-person   preview-rev-person
preview-up-creature preview-rev-creature
preview-up-place    preview-rev-place
preview-up-treasure preview-rev-treasure
preview-up-situation preview-rev-situation
```

### Toggle IDs
```
replaceableToggle       manualSelectionToggle
```

---

## 4. Orientation Encoding

Two encodings coexist. **Do not mix them.**

| Context | Encoding | Values |
|---|---|---|
| Internal computation inside `generateCard()` | **Numeric** | `0` = Upright, `1` = Reverse |
| DOM writes, `placeCard()` argument, `importReading()` | **String** | `'Upright'` or `'Reverse'` |

`placeCard(cardNum, cardName, orientationText)` converts at its entry point:
```javascript
const cardOrientation = orientationText === 'Upright' ? 0 : 1;
```
`generateCard()` generates numeric orientation and converts for DOM writes:
```javascript
const cardOrientation = Math.floor(Math.random() * 2);   // 0 or 1
const orientationText = cardOrientation === 0 ? 'Upright' : 'Reverse';
```

---

## 5. Card Draw Call Chain

### Random draw (user clicks "Draw a Card")
```
openCard(evt, cardNum, buttonElement)
  └─ generateCard(cardNum)
       ├─ getSpreadKey(cardNum)          → spreadKey
       ├─ getSelectedDeckForSpread(key)  → deckName
       ├─ splice from workingDecks[key]  (non-replaceable mode)
       ├─ updateDeckSidebar()            (non-replaceable only, after splice)
       ├─ writes to card-name-*, card-orientation-*, card-description-*, card-credit-*
       ├─ writes to card-list-*, card-orientation-list-*
       └─ writes to meaning-{htmlId}-*  (all five categories)
```

### Manual placement (Quick Fill)
```
openQuickFill()
  ├─ refreshes <datalist id="card-names-list"> with active deck cards
  └─ builds .qf-row elements with inputs + orient toggles

applyQuickFill()
  └─ for each row: placeCard(cardNum, cardName, orientationText)
       ├─ writes to card-name-*, card-orientation-*, card-description-*, card-credit-*
       ├─ writes to card-list-*, card-orientation-list-*
       └─ writes to meaning-{htmlId}-*
  └─ closeQuickFill() → updateDeckSidebar()
```

### Redraw all (per spread)
```
redrawAdventureSpread()             redrawFiveCardSpread()
redrawThreeCardSpread()             redrawJourneySpread()
  ├─ validateDeckSize(spreadKey)    (alerts and returns if deck too small)
  ├─ resetWorkingDeck(spreadKey)    (refills workingDecks[key] from allDecks[deckName])
  └─ for each slot: generateCard(cardNum)
```

---

## 6. Key Function Registry

| Function | Signature | What it does |
|---|---|---|
| `fetchData()` | `async ()` | Loads AllCards + deckLists + customDecks in parallel; populates all globals; initializes UI |
| `getActiveSpread()` | `() → string` | Returns element ID of the visible spread tab (e.g. `'adventure-spread'`); defaults to `'adventure-spread'` |
| `getSpreadKey(cardNum)` | `(string) → string` | Maps `'C.00'`–`'C.30'` to spread key (`'adventure'`, `'fiveCard'`, etc.) |
| `getSelectedDeckForSpread(key)` | `(string) → string` | Returns `selectedDecks[key]` or first deck in `allDecks` |
| `generateCard(cardNum)` | `(string) → void` | Randomly draws a card into a slot; writes all DOM IDs for that slot |
| `placeCard(cardNum, cardName, orientationText)` | `(string, string, string) → bool` | Places a specific card into a slot; does NOT touch `workingDecks`; returns `false` if card not in AllCards |
| `setText(id, value)` | `(string, string) → void` | Safe `getElementById` + `textContent` setter; silently no-ops if element not found |
| `resetWorkingDeck(key)` | `(string) → void` | Refills `workingDecks[key]` from a fresh copy of `allDecks[selectedDecks[key]]` |
| `initializeWorkingDecks()` | `() → void` | Calls `resetWorkingDeck` for all four spreads; called once at load |
| `updateDeckSidebar()` | `() → void` | Rebuilds sidebar card list HTML string in memory; single DOM write |
| `getPlacedCounts(key)` | `(string) → {[cardName]: count}` | Reads current DOM state for a spread's slots; used by sidebar to detect over-quota |
| `openQuickFill()` | `() → void` | Validates spread, refreshes datalist, builds QF rows, shows overlay, focuses first empty input |
| `applyQuickFill()` | `() → void` | Reads all QF rows; calls `placeCard` per row; reports invalid names |
| `closeQuickFill()` | `() → void` | Hides overlay; does not clear row data |
| `clearAllSpreads()` | `() → void` | Resets all 31 slots in DOM to placeholder text; reinitializes working decks |
| `exportReading()` | `() → void` | Reads DOM state → JSON blob → browser download |
| `importReading(event)` | `(Event) → void` | Reads uploaded file → validates → restores settings, decks, and all card slots |
| `toggleSidebar()` | `() → void` | Mobile (≤768px): toggles `.mobile-open` + backdrop. Desktop: toggles `.collapsed` |
| `closeMobileSidebar()` | `() → void` | Removes `.mobile-open` and backdrop `.active`; called by backdrop click |
| `toggleReplaceable()` | `() → void` | Syncs `isReplaceableEnabled` from checkbox; reinitializes working decks |
| `populateBlankSlateSpread()` | `() → void` | Builds slot buttons C.00–C.16 in `#blank-slate-grid`; labels are raw IDs (`'C.00'` etc.) |
| `populateAllCardsSpread()` | `(string[]) → void` | Builds Deck Forge card library buttons |
| `openAllCardPreview(name)` | `(string) → void` | Populates `#deck-forge-preview` panel with a card's full data |
| `openSpread(evt, name)` | `(Event, string) → void` | Shows the named spread tab; hides all others |
| `openCard(evt, cardNum, btn)` | `(Event, string, HTMLElement) → void` | Opens card detail panel; if manual mode active, calls `setTargetedSlot` instead of `generateCard` |
| `validateDeckSize(key)` | `(string) → bool` | Alerts and returns `false` if deck too small for the spread; used before redraw-all |
| `saveCustomDeck()` | `() → void` | Validates cart → names deck → merges into `allDecks` → persists to `localStorage` |

---

## 7. Code Style Convention

All functions in `cardReading.js` use a numbered comment system. Match it exactly when adding code.

```javascript
function exampleFunction() {
  // STEP 1: Top-level phase description
  // 1.1 Sub-step description
  doThing();
  // 1.2 Another sub-step
  doOtherThing();

  // STEP 2: Next phase
  // 2.1 Sub-step
}
```

- Top-level phases use `// STEP N:` (all caps)
- Sub-steps use `// N.M` with no word before the number
- Comments explain **why**, not what — `// Guard: prevents TypeError propagating through for-loop`
- One blank line between STEP blocks; no blank lines between sub-steps within a block
- Multi-step block comments (`/* */`) are used only for function-level doc comments above the `function` keyword

---

## 8. Data Schemas

### AllCards.json — Full Card Object Example
```json
{
  "cards": {
    "Aberration": {
      "name": "Aberration",
      "description": "A beholder hovers in a cluttered laboratory...",
      "credit": "",
      "meanings": {
        "person": {
          "upright": "Someone with a distorted view of reality...",
          "reverse": "A person dedicated to preserving nature..."
        },
        "creatureTrap": {
          "upright": "A creature corrupted by the influence of the Far Realm...",
          "reverse": "A creature that has resisted corruption..."
        },
        "place": {
          "upright": "A place where the laws of physics are distorted.",
          "reverse": "A place where nature has overgrown corrupting influence."
        },
        "treasure": {
          "upright": "An art object reflecting a warped view of reality...",
          "reverse": "An art object depicting nature's triumph..."
        },
        "situation": {
          "upright": "An incursion from the Far Realm...",
          "reverse": "People fighting against the influence of Aberrations."
        }
      }
    }
  }
}
```

**Schema constraints:**
- `credit` key exists but is often an empty string — always use `cardData.credit || 'WotC Card Guide'` as fallback
- Meaning category keys are always camelCase: `creatureTrap` (not `creature_trap`)
- Meaning value keys are always lowercase: `upright`, `reverse`
- Access cards via `allCards.cards[cardName]`, not `allCards[cardName]`

### deckLists.json — Structure
```json
{
  "Deck of Many More Things": ["Aberration", "Balance", "Beast", "..."],
  "Standard 22": ["Balance", "Beast", "..."]
}
```
Each value is a flat array of card name strings. Duplicates are allowed (weighted decks).

---

## 9. Implemented Features & Integrations

### ✅ Save State Engine (JSON Import/Export)
- Single-file `.json` saves encapsulating `settings`, `cards` (slot → name + orientation), and `customDecks`.
- Import merges foreign custom decks into live memory and persists to `localStorage`.

### ✅ The Deck Forge (Custom Deck Builder)
- Split UI: card library + shopping cart. `+`/`-` quantity controls, hard-capped at 99 per card.
- Saves to `allDecks` under `"Custom: [name]"` namespace; persists under `localStorage` key `userCustomDecks`.
- Static preview panel `#deck-forge-preview` replaces legacy dynamic tab creation.

### ✅ Unified Sidebar (O(N) rendering)
- Built as a single HTML string buffer; one DOM write per update.
- Classes: `available`, `exhausted`, `over-quota`. Desktop collapses to 60px icon strip; mobile converts to a drawer overlay.

### ✅ Manual Card Selection
- **Quick Fill:** overlay panel, one input row per slot, `<datalist>` autocomplete scoped to active deck, orientation toggle per row.
- Quick Fill and random per-slot draws coexist — mixing them within a spread is supported.

### ✅ Responsive Layout
- Breakpoints: ≤768px (mobile), 769–1024px (tablet).
- Mobile sidebar: off-screen drawer with hamburger toggle and backdrop overlay.
- Action buttons: `display: grid; grid-template-columns: 1fr 1fr` on mobile (not flex — avoids box-sizing overflow with `.button1`).
- Card slot buttons scale via `clamp(44px, 12vw, 80px)` / `clamp(88px, 24vw, 160px)` / `clamp(11px, 3vw, 17px)`.
- **Status: in progress.** All current values are temporary; final pass is item 9 in README.

---

## 10. Scrapped & Deprecated Paradigms

| Deprecated | Replaced By | Reason |
|:---|:---|:---|
| URL parameter decks | JSON-only local decks | 2000-char URL limit; run-length encoding was fragile |
| Separate sidebar lists | Unified inventory map | Double rendering cost; visual redundancy |
| Dynamic tab generation | Static preview panel | Memory leaks, scroll bugs, stacking layout issues |
| `getTablePrefix`, `getOrientationTablePrefix`, `redrawAll`, `handleGlobalRedraw`, `handleGlobalDraw` | Four explicit per-spread redraw functions | Dead code; ambiguous entry points |
| Sidebar manual placement (`toggleManualSelection`, `setTargetedSlot`, `clearTargetedSlot`, `selectSidebarCard`, `performManualAssign`, `assignCardFromSidebar`, `.targeted-slot-active`, `.manual-selection-toggle`) | Quick Fill panel | Two-global intermediate state machine; HTML elements (sidebar-placement-container, assign-btn, manualSelectionToggle) were never added, so all functions silently no-oped. Quick Fill covers the same need without a slot-targeting step. |

**Never implement:** A per-slot card-selection modal or table-with-dropdown-menus. Both were evaluated in design review and rejected before implementation — Quick Fill already covers the use case. Dropdown menus also have `box-sizing` overflow issues on mobile.

---

## 11. Key Invariants & Common Pitfalls

- **`creatureTrap` is always camelCase.** AllCards.json uses `creatureTrap`; JS uses `creatureTrap`; HTML element IDs use `creature` (mapped via `const htmlId = cat === 'creatureTrap' ? 'creature' : cat`). Never use `creature_trap`.
- **Null-guard `cardData` before any property access.** `generateCard` returns early if `allCards.cards[cardName]` is undefined. Without this, `cardData.name` throws and stops the redraw `for` loop mid-spread.
- **Null-guard each meaning category.** Use `if (!meanings || !meanings[cat]) return;` inside the `forEach`. A missing category throws `TypeError` that propagates out of `generateCard` and halts the loop — the root cause of the "Redraw All stops after first card" regression.
- **Compute `deckSize` before the alert string.** `allDecks[deckName]?.length` — if the deck is undefined, accessing `.length` throws. Always guard: `const deckSize = allDecks[deckName] ? allDecks[deckName].length : 0`.
- **`placeCard` does not touch `workingDecks`.** It only writes to the DOM. Callers that need to consume a card from the working pool must splice it themselves (see `assignCardFromSidebar`).
- **`setText` is always safe.** It silently no-ops if the element doesn't exist. Prefer it over `getElementById(...).textContent =` to avoid null-dereference crashes.
- **Use `onclick =` assignment, not `addEventListener`.** Reused elements (QF rows, sidebar items) get rebuilt on each open. `addEventListener` stacks handlers across rebuilds; assignment replaces them.
- **`getActiveSpread()` returns the element ID form, not the spread key form.** Any function that needs the spread key must map it locally.

---

## 12. Roadmap & Function Touch Points

### Item 6 — Free-Form / Blank Slate Spread
**What's left:** Slot label behavior (currently raw IDs), optional active-slot count input, without-replacement coordination.

| Function | Change needed |
|---|---|
| `populateBlankSlateSpread()` | Replace raw `cardNum` label with user-friendly text or input field |
| *(new)* `redrawBlankSlateSpread()` | Create — parallel to `redrawAdventureSpread` but for active slots only |
| `clearAllSpreads()` | Already resets C.00–C.16; no change needed |
| `workingDecks` | Add a `'blankSlate'` key if without-replacement should be isolated from Adventure/Three-Card |

**Already done:** Per-spread deck selection applies automatically. Replacement toggle global applies but without cross-slot coordination within the spread.

### Item 7 — Cascading Deck Spread
New spread tab. No existing code to modify — additive only. Needs: new `SPREAD_SLOTS` entry, new tab in HTML, cascade logic that reads a drawn card's result to select the next slot's deck, visual indicator per slot of which deck it draws from.

### Item 8 — Multi-Deck Adventure Spread
Modifies the adventure spread heavily. Touch points: `redrawAdventureSpread()`, `generateCard()` (or a new variant), `SPREAD_SLOTS` (variable challenge slot count), `selectedDecks` schema extension (per-slot rather than per-spread).

### Item 9 — CSS and Visual Improvements (final pass)
- Finalize all `clamp()` values in the mobile media query
- Audit remaining fixed `px` values in desktop styles
- Wire card images — replace `../JSON_Folder/Generic Soldier 4.png` placeholder; establish image naming convention in `AllCards.json`
- Cross-spread visual consistency pass after all features are complete
