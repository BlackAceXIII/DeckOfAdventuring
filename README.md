# Card Reading Tool
### Based on WotC's Deck of Many Things Card Reference Guide

---

## What the Project Does

This is a browser-based card reading tool for tabletop RPG game masters. It draws cards from configurable decks and displays their meanings across several spread layouts, replacing the need to physically shuffle and deal cards at the table.

### Data Architecture

The browser application reads a small set of JSON files from `CardsJsons/` when it starts. The bulk of the data is pre‑compiled so that no additional network requests are needed once loading finishes.

- **`AllCards.json`** — A consolidated master list of every card. Each entry contains name, description, image credit, and upright/reverse meanings for the five categories (Person, Creature/Trap, Place, Treasure, Situation).
- **`deckLists.json`** — Named deck definitions. Each deck is just an array of card names that must exist in `AllCards.json`.
- **`customDecks.json`** *(optional, not shipped by default)* — A user‑editable file whose contents are merged over `deckLists.json`. If a custom deck has the same name as a built‑in one, it replaces it. Users can also build and share custom decks through the JSON import/export feature.

(There are also dozens of individual card JSONs and helper data files such as `CardFormat.json` in the same folder; these are used by the Python/shell scripts in the repository to build `AllCards.json` and are not loaded by the page.)

All three primary JSON files are fetched in parallel at page start. After the initial load, every card lookup is performed from the in‑memory `allCards` object – the UI never fetches another file per card.

### Spreads

Each spread has its own tab. Clicking a spread tab displays its card position grid and summary table. Clicking a card position button opens its detail panel. The detail panel shows the drawn card's name, image, orientation, description, and all five meaning categories. Each panel has an individual **Draw a Card** button to redraw that slot alone, and each spread has a **Redraw All Cards** button to redraw every slot in the spread simultaneously.

The summary table at the left of each spread updates alongside the detail panels, showing the card name and orientation for every slot at a glance.

| Spread | Slots | Card Range | Notes |
|---|---|---|---|
| Adventure Spread | 9 | C.00–C.08 | Asymmetric grid layout: Party Gathers, Adventure Begins, Journey, Entrance, Challenges ×3, Guardian, Treasure |
| Five-Card Spread | 5 | C.09–C.13 | Cross pattern: The Quest (centre), The Outcome, The Challenge, That Which is Hidden, That Which is Needed |
| Three-Card Spread | 3 | C.14–C.16 | Linear: Past, Present, Future |
| Journey Spread | 14 | C.17–C.30 | Two rows: Stage 1–7 Challenges (C.17–C.23) and Stage 1–7 Rewards (C.24–C.30) |
| Blank Slate Spread | 15 | C.31–C.45 | Free-form 5×3 grid of unlabelled slots. Each button shows its slot number and current card name (or "blank"). No positional meaning. |
| Dungeon Spread | 9 buttons / 14 cards | C.46–C.59 | Fixed deck assignments per slot. Single-deck slots draw one card; two-deck slots open a dual-card panel (Location + Feature side by side). |
| Deck Forge | All | — | Repurposed from the "All Cards" spread. Serves as a library reference and an interactive shopping-cart-style deck builder. |

### Deck Selection

A dropdown above the spread tabs lists all available decks from `deckLists.json` plus any loaded `customDecks.json` entries, as well as locally built Custom Decks. The selected deck applies to all spreads simultaneously. Changing the selection does not automatically redraw existing cards.

### Replacement Toggle

A toggle at the top of the page controls whether the same card can appear multiple times in a single spread draw (**with replacement**) or not (**without replacement**).

---

## File Structure

```
/                         — repository root; most auxiliary tooling lives here
├── cardReading.html      — Main browser UI containing spread tabs and card panels
├── cardReading.css       — Styling, CSS variables, spread and component layout
├── cardReading.js        — All logic: data loading, spread rendering, card generation
├── build_all_cards.py    — Python script that stitches individual card JSONs into
│                          |  the `AllCards.json` file used by the page
├── check_decklist_vs_allcards.py  — utility for verifying deckLists.json
├── convert_card_format.py          — helper for converting source card formats
├── example_loading.js              — small demo used during development
├── 5etools_DoMMT.json              — external data dump used to bootstrap cards
├── tarotCards5e.json               — additional card data used by build scripts
└── CardsJsons/             — data folder consumed by the page and build tools
    ├── AllCards.json      — Compiled master card data (loaded by cardReading.js)
    ├── deckLists.json     — Built‑in deck definitions (loaded by cardReading.js)
    ├── customDecks.json   — Optional user‑editable decks (also loaded if present)
    ├── CardFormat.json    — format template used by build scripts
    ├── Aberration.json    — individual card objects (and dozens more)
    └── …                  — many per-card JSON files used only by tooling
```

Notes:
- The HTML/CSS/JS trio is the only part required to run the web tool.
- Everything else in the repo supports data generation, verification, or conversion.

---

## Known Limitations

- Card images are not currently displayed. The card detail panels contain no image elements; if images are added in the future, the HTML, JS, and JSON data will all need to be updated.

---

## To-Do List

Features are ordered from least to most complex to implement. Dependencies are noted where one feature enables or complicates another.

---

### 1. ✅ Replacement Toggle — Complete Implementation
**Complexity: Lowest**

The UI toggle already exists. The underlying draw logic needs to be connected to it.

**Dependencies:**
- Aids the **Free-Form Spread** — coordinating a shared card pool across individual slot draws in a free-form context is the same problem, already solved here.

---

### 2. ✅ Import / Export — Complete Implementation
**Complexity: Low**

Full import/export functionality has been implemented. Users can now save card readings to JSON files and restore them later.

**JSON Format Example:**
```json
{
  "version": "1.0",
  "timestamp": "2026-04-07T14:30:45.123Z",
  "settings": {
    "isReplaceableEnabled": false,
    "selectedDecks": {
      "adventure": "Default",
      "fiveCard": "Default",
      "threeCard": "Default",
      "journey": "Default",
      "blankSlate": "Default"
    }
  },
  "cards": {
    "C.00": { "name": "Aberration", "orientation": "Upright" },
    "C.01": { "name": "Balance", "orientation": "Reverse" }
  },
  "customDecks": {
    "Custom: Boss Loot": ["Beast", "Beast", "Skull"]
  }
}
```

**Dependencies:**
- Aids **Custom Deck Building** — custom decks inherit persistence automatically via import/export.
- Aids **Dungeon Spread** — sessions for that spread are easiest to manage via save/restore.
- Works seamlessly with **Per-Spread Deck Selection** (also completed).

---

### 3. ✅ Per-Spread Deck Selection — Complete Implementation
**Complexity: Low–Moderate**

Replaced one global string with a small object tracking selection per spread.

**Dependencies:**
- Directly enables **Custom Deck Building** to be meaningful per-spread rather than global.
- Established the per-spread working-deck pattern that the **Dungeon Spread** extends to three simultaneous hardcoded keys.
- Makes the **Free-Form Spread** automatically inherit its own deck choice.

---

### 4. ✅ Custom Deck Building — Complete Implementation
**Complexity: Moderate**

Lets users construct their own named decks from the cards available in `AllCards.json`. Writes into the same `allDecks` object the rest of the code already reads from.

**What was implemented:**
- Replaced the "All Cards" static glossary with the interactive "Deck Forge".
- Built a split-panel UI containing a searchable card library and a shopping-cart-style deck builder.
- Implemented `+`/`-` quantity controls to support multiple copies of the same card (required for cascading spreads).
- Replaced dynamic tab generation with a unified, static Preview Panel displaying both Upright and Reversed meanings simultaneously.
- Integrated `localStorage` for automatic cross-session persistence.
- Hooked directly into the JSON Import/Export system so custom decks are bundled in reading save files.

**Dependencies:**
- **Import/Export** already complete — persistence and sharing via JSON files is fully functional.
- Easier with **Per-Spread Deck Selection** done first.
- Enables the **Cascading Deck Spread**, which will require custom decks as cascade targets.

---

### 5. ✅ Manual Card Selection — Complete Implementation
**Complexity: Moderate–High**

Allows the GM to assign specific cards to specific slots rather than drawing randomly.

**What was implemented:**
- The **Quick Fill** panel serves as the manual card selection UI — it opens an overlay listing every slot in the active spread, each with a card name input and an Upright/Reverse toggle button.
- Card name inputs use a `<datalist>` for browser-native autocomplete, scoped to the cards in the currently selected deck for that spread. Suggestions update each time Quick Fill opens.
- Individual slot **Draw a Card** buttons coexist with Quick Fill — random and manual assignment can be mixed freely within the same spread.
- Orientation is set per slot via the toggle button; leaving a slot's input blank skips it without disturbing already-placed cards.

**Dependencies:**
- ✅ Per-Spread Deck Selection — autocomplete is scoped per spread automatically.
- ✅ Custom Deck Building — custom deck cards appear as autocomplete suggestions immediately.

---

### 6. ✅ Free-Form / Blank Slate Spread — Complete Implementation
**Complexity: Moderate**

A dedicated free-form spread with 15 card slots (C.31–C.45) arranged in a 5×3 grid. Slots have no positional labels — the GM assigns meaning as needed.

**What was implemented:**
- Dedicated card slots C.31–C.45, isolated from all structured spreads. No cross-contamination between Blank Slate draws and Adventure / Five-Card / Three-Card / Journey slots.
- 5×3 grid of slot buttons. Each button displays the slot number on the first line and the current card name (or "blank") on the second line, updated after every draw.
- Summary table listing all 15 slots (Slot 1–15) with card name and orientation columns.
- Full per-spread deck selection (`blankSlate` key added to `selectedDecks` and `workingDecks`).
- Replacement toggle connected: without-replacement mode coordinates correctly across individual slot draws within the spread.
- Redraw All button (`redrawBlankSlateSpread`) resets the working deck and redraws all 15 slots.
- Quick Fill support: all 15 slots appear in Quick Fill with "Slot N" labels.
- Export and Import include Blank Slate slots (C.31–C.45) and the `selectedDecks.blankSlate` value.

**Dependencies:**
- ✅ Replacement Toggle — fully implemented.
- ✅ Per-Spread Deck Selection — fully implemented.

---

### 7. ❌ Cascading Deck Spread
**Complexity: Moderate–High**

A specialized spread that uses a cascading deck system exclusively designed for that tab. Cards drawn from earlier positions determine which custom deck subsequent positions draw from, creating dynamic, interconnected outcomes.

**What needs doing:**
- Design the cascade logic: define how drawn cards map to subsequent deck selections.
- Build a new spread tab with cascading positions.
- Extend `generateCard()` or create a new function to support deck selection that depends on the result of a previous draw.
- Each position in the cascade must visually show which deck it is drawing from.
- The cascade should work seamlessly with the existing custom deck system.
- Define a configuration object or UI controls to set up cascade rules.

**Dependencies:**
- Requires **Custom Deck Building** to be completed first.
- Works well with **Import/Export**.

---

### 8. ❌ Dungeon Spread
**Complexity: Moderate–High**

A new spread tab based on the Dungeon Spread from the WotC source book. Nine slot buttons draw from pre-determined, hardcoded decks — no deck selector. Single-deck slots draw one card; two-deck slots draw one card from each deck and show them in a side-by-side dual-card detail panel.

**Slot–deck assignments (locked):**

| Slot | Name | Deck(s) | Card ID(s) |
|---|---|---|---|
| 0 | Party Gathers | Story Deck | C.46 |
| 1 | Adventure Begins | Story Deck | C.47 |
| 2 | Journey | Story Deck | C.48 |
| 3 | Entrance | Locations + Features | C.49, C.50 |
| 4 | Challenge 1 | Locations + Features | C.51, C.52 |
| 5 | Challenge 2 | Locations + Features | C.53, C.54 |
| 6 | Challenge 3 | Locations + Features | C.55, C.56 |
| 7 | Guardian | Features Deck | C.57 |
| 8 | Treasure | Features + Locations | C.58, C.59 |

**Key design decisions:**
- **14 card IDs** (C.46–C.59) across 9 slot buttons. Sequential IDs only — no lettered sub-IDs.
- **Dual-card detail panel** for the 5 two-deck slots: one slot button opens a panel with a Location card and a Feature card side by side, each with its own individual Redraw button.
- **Three working decks**: `dungeonStory`, `dungeonLocations`, `dungeonFeatures` — depleted independently in non-replaceable mode. Sidebar shows 3 rows when this spread is active.
- **Deck selector greyed out** on this tab; deck assignments are fixed at the code level, not user-configurable.

**What needs doing:**
- `getSpreadKey()` extended with a per-card lookup for C.46–C.59 (returns one of three working-deck keys, not a single spread key)
- `initializeWorkingDecks()` adds 3 hardcoded entries populated directly from `deckLists.json` deck names
- New `dungeon-spread` tab in HTML with 9 slot buttons
- New dual-card detail panel HTML structure alongside the existing single-card template
- `generateCard()` draws once or twice depending on whether the card ID belongs to a two-card slot
- `updateDeckSidebar()` shows 3 rows when dungeon spread is active
- `clearAllSpreads()` resets the 3 new working decks and the 14 dungeon slot DOM elements
- `SPREAD_SLOTS` updated for Quick Fill support (new fields: `deck`, `secondId`, `secondDeck`)

**Dependencies:**
- ✅ All prerequisites are complete.

---

### Cascading Deck vs. Dungeon Spread — Complexity Comparison

| | Item 7: Cascading Deck | Item 8: Dungeon Spread |
|---|---|---|
| Design status | **Incomplete** — cascade rules not yet defined | **Complete** — all decisions locked |
| Implementation blocker | Must define cascade rules before any code | None |
| Changes to existing code | Additive only | `getSpreadKey`, `initializeWorkingDecks`, `generateCard`, `updateDeckSidebar`, `clearAllSpreads` |
| New HTML structures | Standard single-card panels (no new template) | Dual-card detail panel (new template) |
| Working decks affected | 1 new entry | 3 new entries |
| Deck selector | User-configurable cascade targets | Greyed out (fixed decks) |
| **Overall complexity** | Low–Moderate (architecture) + design cost | **Moderate–High** |

**Bottom line:** The Dungeon Spread is more complex to code but can begin immediately. The Cascading Deck Spread is architecturally lighter but cannot start until cascade rules are defined — what a drawn card maps to, how cascade levels are configured, and what the UI shows per slot.

---

### 9. ❌ CSS and Visual Improvements
**Complexity: Low–Moderate (iterative)**

A final polish pass covering responsive layout, sizing, and visual consistency across the full application. Treated as the last task so that all features are in their final form before UI decisions are locked in.

**What needs doing:**
- Finalize the responsive CSS for mobile and tablet screen sizes, replacing all temporary in-progress rules with clean, settled values. Current breakpoints (≤768px mobile, 769–1024px tablet) need validation across real device sizes and orientations.
- Audit fixed pixel values remaining in the stylesheet and convert any that should scale (font sizes, spacing, component dimensions) to `clamp()`, `rem`, or percentage-based units.
- Card slot buttons (`.tab-grid .tablinks`) need confirmed final dimensions that work across all four spread layouts at both mobile and desktop widths.
- Review all spread tab layouts for visual consistency — padding, gap, and font size should feel uniform across Adventure, Five-Card, Three-Card, Journey, Blank Slate, and Deck Forge tabs.
- Evaluate and resolve any remaining visual inconsistencies introduced when new features (Free-Form Spread, Cascading Deck, Dungeon Spread) were added.
- If card images are sourced in the future, add `<img>` elements to the card detail panels, add a `credit` display if attribution is required, and map each `AllCards.json` entry to its image path.

**Dependencies:**
- Should be done **last** — all feature work must be in its final form before visual decisions are finalized.
- Card image wiring requires agreement on the image asset format and file naming convention.

---

## Completed Features Summary

✅ **Replacement Toggle** — Draw behavior fully connected to toggle state.
✅ **Import / Export** — Full session persistence and sharing support.
✅ **Per-Spread Deck Selection** — Each spread independently selects its deck.
✅ **Custom Deck Building** — In-browser Deck Forge with quantity controls, local storage persistence, and JSON export integration.
✅ **Manual Card Selection** — Fulfilled by the Quick Fill panel with per-deck autocomplete; random and manual assignment coexist freely.
✅ **Quick Fill Autocomplete** — Card name inputs suggest only cards from the active spread's selected deck; datalist refreshes on every open.
✅ **Blank Slate Spread** — 15-slot free-form 5×3 grid (C.31–C.45) with per-slot card labels, dedicated working deck, full replacement-toggle integration, Quick Fill support, and export/import coverage.

## Recommended Implementation Order for Remaining Features

```
        ├──▶ 6. Free-Form Spread (full)
        │
        ├──▶ 7. Cascading Deck Spread
        │
        ├──▶ 8. Dungeon Spread
        │
        ▼
9. CSS and Visual Improvements (final pass)
```
