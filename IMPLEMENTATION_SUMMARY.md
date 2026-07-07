# Technical Context Document: Card Reading Tool

This document establishes the precise state of the application architecture, active data structures, completed integrations, and scrapped design patterns for use in bootstrapping new development sessions.

---

## 1. Core Architecture & Stack
- **Engine:** Client-side only; vanilla HTML5, CSS3 (using CSS custom properties), and ES6+ JavaScript.
- **Hosting Context:** Runs locally via `file://` protocol or a simple local web server. No build step (Webpack/Vite) or external runtime is used. Note: `fetch()` fails on `file://` in most mobile browsers — a local web server is required for mobile testing.
- **I/O Mechanics:** Asynchronous initialization. All data is fetched once at load time via parallel `fetch()` calls. No sequential server requests are executed during active card draws.

### Primary Data Dependencies (Fetched in Parallel)
1. **`CardsJsons/AllCards.json`:** Master glossary containing all 66 cards.
   - *Schema:* Each card has `name`, `description`, `credit` (sometimes empty — use `cardData.credit || 'WotC Card Guide'` as a safe fallback), and a `meanings` object.
   - *Schema:* The `meanings` object uses five camelCase category keys: `person`, `creatureTrap`, `place`, `treasure`, `situation`. Each category contains `upright` and `reverse` string properties. Example: `meanings.creatureTrap.upright`.
   - *Schema:* The HTML element IDs for meaning panels use a shortened form: `creatureTrap` maps to `creature` via `const htmlId = cat === 'creatureTrap' ? 'creature' : cat`. All 31 meaning panel IDs follow the pattern `meaning-{htmlId}-C.##`.
2. **`CardsJsons/deckLists.json`:** Immutable built-in deck recipes containing arrays of card name strings.
3. **`CardsJsons/customDecks.json`** *(optional, not shipped by default):* User-editable deck definitions merged over `deckLists.json` on load. If a custom deck has the same name as a built-in one, it replaces it.

---

## 2. Global State Schema
The application's runtime is managed via the following globally scoped variables inside `cardReading.js`:

```javascript
let allCards = null;                 // Raw JSON object from AllCards.json
let allDecks = {};                   // Combined map of default, localStorage, and imported decks
let customDeckCart = {};             // Deck Forge staging state: { "CardName": quantity }
let isReplaceableEnabled = false;    // Controls whether the same card can appear multiple times
let isManualSelectionEnabled = false;// Controls whether slot clicks target for sidebar placement
let targetedSlot = null;             // Tracks the card slot ID targeted for manual placement
let workingDecks = {                 // Per-spread card pools, spliced on each draw (non-replaceable)
  adventure: [], fiveCard: [], threeCard: [], journey: []
};
let selectedDecks = {                // Active deck name per spread; falls back to first deck in allDecks
  adventure: 'Default', fiveCard: 'Default', threeCard: 'Default', journey: 'Default'
};
```

### Slot ID System
| Spread | Slots | Card ID Range |
|---|---|---|
| Adventure | 9 | C.00–C.08 |
| Five-Card | 5 | C.09–C.13 |
| Three-Card | 3 | C.14–C.16 |
| Journey | 14 | C.17–C.30 |

`getSpreadKey(cardNum)` maps a card ID to its spread key (`'adventure'`, `'fiveCard'`, `'threeCard'`, `'journey'`).

---

## 3. Implemented Features & Integrations

### ✅ Save State Engine (JSON Import/Export)
- **Mechanism:** Single-file standard `.json` saves.
- **Payload structure:** Encapsulates active session `settings`, drawn `cards` mapped to positions with orientation, and copies of any user `customDecks`.
- **Portability:** Importing a session instantly merges foreign custom decks into the user's live memory and persists them automatically to `localStorage`.

### ✅ The Deck Forge (Custom Deck Builder)
- **UI:** Repurposed from the legacy static "All Cards Spread". Features a split UI containing a card glossary list and an interactive quantity assembly cart.
- **Counters:** Supports weighted decks (`+`/`-` counters per card, hard-capped at 99 copies per entry).
- **Saves:** Merges built arrays into `allDecks` under the namespace `"Custom: [Deck Name]"` and writes them directly to `localStorage` under the key `userCustomDecks`.
- **Dynamic Preview Panel (`#deck-forge-preview`):** Fully static in the HTML. Displays both Upright and Reversed meanings of a highlighted card simultaneously. Completely replaced legacy dynamic DOM tab creation.

### ✅ Unified High-Performance Sidebar
- **Complexity:** Runs in O(N) time. Generates a real-time availability count (`[Remaining / Total]`) of the active deck.
- **Rendering:** Built completely in memory as an HTML string buffer and updated via a single DOM write to eliminate browser layout thrashing.
- **Availability indicators:** Color-coded class markers (`available`, `exhausted`) and warning badges (`over-quota`).
- **Collapse behavior:** Desktop: toggles `.collapsed` class to shrink to a 60px icon strip. Mobile (≤768px): toggles `.mobile-open` class as a drawer overlay instead — the collapsed state has no visual effect on mobile.

### ✅ Manual Card Selection (Quick Fill)
- **Primary mechanism:** The **Quick Fill** panel (`openQuickFill()`) opens a modal overlay listing every slot in the active spread, each with a card name input and an Upright/Reverse orientation toggle.
- **Autocomplete:** Each input uses `<datalist id="card-names-list">`. On every open, `openQuickFill()` refreshes the datalist with only the cards from the spread's currently selected deck (alphabetically sorted). The initial seed at page load contains all 66 cards as a fallback; it is overwritten each time the panel opens.
- **Coexistence:** Individual per-slot **Draw a Card** buttons still perform random draws. Manual (Quick Fill) and random assignment can be mixed freely within the same spread.
- **Validation:** `applyQuickFill()` checks each entered name against `allCards.cards`. Unrecognized names are skipped and reported in a summary alert after apply.

### ✅ Direct Sidebar Placement (Manual Draw Mode)
An alternative manual placement flow using the sidebar:
1. User enables the **Manual Selection** toggle (`isManualSelectionEnabled = true`).
2. User clicks **Draw a Card** on a board slot.
3. That slot highlights with a pulsing gold animation (`.targeted-slot-active`) and its ID is stored in `targetedSlot`.
4. User clicks a card item in the sidebar list.
5. `assignCardFromSidebar(cardName)` populates the board slot, removes the card from the working array (non-replaceable mode), updates the sidebar counters, and clears the targeting highlight.

### ✅ Responsive Layout (Mobile / Tablet)
- **Breakpoints:** ≤768px (mobile), 769–1024px (tablet).
- **Sidebar:** On mobile, converts from a fixed 280px panel to an off-screen drawer (`transform: translateX(-100%)`). A fixed-position hamburger button (`#mobile-sidebar-toggle`) opens it; a backdrop overlay (`#sidebar-backdrop`) closes it on outside tap. `toggleSidebar()` branches on `window.innerWidth` to switch between drawer and collapse behavior.
- **Main content:** `margin-left: 0` on mobile (full viewport width); 56px top padding clears the fixed hamburger button.
- **Action buttons:** Switch from flex row to `display: grid; grid-template-columns: 1fr 1fr` on mobile. The grid avoids the box-sizing issue that causes `flex: 1 1 calc(50%)` to overflow when elements lack `box-sizing: border-box`.
- **Spread tabs:** `overflow-x: auto` with `flex-wrap: nowrap` so tabs scroll horizontally on small screens.
- **Card slot buttons:** `clamp(44px, 12vw, 80px)` width / `clamp(88px, 24vw, 160px)` height / `clamp(11px, 3vw, 17px)` font size.
- **Status:** In progress — temporary values are in place. Final values are locked in as the last task (item 9 in the README).

---

## 4. Scrapped & Deprecated Paradigms
To prevent regressions, avoid reverting to these previous strategies:

| Deprecated Feature | Replaced By | Why It Was Scrapped |
|:---|:---|:---|
| **URL Parameter Decks** | **JSON-Only Local Decks** | The 2,000-character safe URL limit prevented sharing multiple custom decks. Run-length encoding logic (`Name:Count`) introduced high string parsing fragility. |
| **Separate Sidebar Lists** | **Unified Inventory Map** | Maintaining separate "Full Deck" and "Remaining Deck" DOM columns doubled rendering times and introduced severe visual redundancy. |
| **Dynamic Tab Generation** | **Static Preview Panel** | Spawning new nodes at the bottom of the DOM for card details led to memory leaks, scroll bugs, and stacking layout issues. |
| **Dead global functions** | *(removed entirely)* | `getTablePrefix`, `getOrientationTablePrefix`, `redrawAll`, `handleGlobalRedraw`, and `handleGlobalDraw` were replaced by four explicit per-spread redraw functions. Removing them eliminated ambiguity about which function was the live entry point. |

**Note on modal/dropdown card picker:** A per-slot card-selection modal and table-with-dropdown-menus approach were both evaluated during design review and rejected before implementation — they were never built. The rejected reason: Quick Fill already covers the use case more efficiently, and dropdown menus have `box-sizing` issues on mobile. Do not implement either pattern.

---

## 5. Key Invariants & Common Pitfalls

- **`creatureTrap` is camelCase throughout.** AllCards.json uses `creatureTrap`, JS uses `creatureTrap`, HTML element IDs use `creature` (mapped via `htmlId`). Never use `creature_trap` (snake_case) — it was a temporary naming experiment, fully reverted.
- **Null-guard `cardData` before accessing properties.** `generateCard()` returns early if the card name from the deck is absent from `allCards.cards`. Without this guard, `cardData.name` throws and halts the `for` loop in the redraw functions, leaving the spread partially drawn.
- **Null-guard meaning categories inside `forEach`.** Use `if (!meanings || !meanings[cat]) return;` before accessing `meanings[cat].upright`. A missing category throws a `TypeError` that propagates out of the callback and stops iteration — the root cause of the "Redraw All Cards stops after first card" regression.
- **`deckSize` before the size-check alert.** Compute `const deckSize = allDecks[deckName] ? allDecks[deckName].length : 0` before using it in a string — accessing `.length` on an undefined deck throws if the deck doesn't exist.
- **Callback overrides:** Declare button callbacks as direct assignment (`btn.onclick = function() {...}`) rather than `addEventListener` to prevent event-stacking memory leaks when the same element is reused across multiple panel opens.

---

## 6. Immediate Next Steps / Uncompleted Roadmap

Ordered by the README to-do list:

1. **Free-Form / Blank Slate Spread (item 6):** The tab exists and slot buttons render. Remaining work: decide slot label behavior (currently shows raw IDs like `C.00`), optionally add an active-slot count control, and wire without-replacement coordination across slots within this spread.
2. **Cascading Deck Spread (item 7):** Not started. Requires design decisions on cascade logic before implementation.
3. **Multi-Deck Adventure Spread (item 8):** Not started. Highest complexity; depends on items 6 and 7 being settled first.
4. **CSS and Visual Improvements (item 9 — final pass):** Finalize all responsive CSS temporary values, audit remaining fixed pixel sizes, wire real card images to replace the placeholder path (`../JSON_Folder/Generic Soldier 4.png`), and do a cross-spread visual consistency pass once all features are in final form.
