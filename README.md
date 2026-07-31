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
- Enables the **Random Encounter Table**, which will require custom decks as cascade targets.

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

### 7. ❌ Random Encounter Table
**Complexity: Moderate**

A new spread tab with three columns: **Graveyard**, **Current Area**, and **Next Area**. Cards cascade on each draw: the drawn card moves from Current to Graveyard, and a random card from Next simultaneously moves into Current. Every card displays its **source deck label** regardless of which column it currently occupies.

**Design decisions (locked):**
- **Three columns**: Graveyard (starts empty, accumulates drawn cards), Current Area (user-selectable deck), Next Area (user-selectable deck).
- **On draw**: one random card spliced from Current → pushed to Graveyard; one random card spliced from Next → pushed to Current. Both transfers are atomic on a single draw action.
- **Source deck tracking**: each card is stamped with a `sourceDeck` label at initialization time — Current cards with the Current deck name, Next cards with the Next deck name. The label persists as cards move between columns.
- **Refresh**: Current and Next can each be independently refilled from their selected deck without clearing the Graveyard.
- **Graveyard**: never refilled. Only cleared by the global Clear All Spreads action.
- **Three-column layout**: Graveyard column shows a scrollable list of drawn cards (name + orientation + source deck label). Current column shows deck selector + remaining count + Draw button + drawn card panel. Next column shows deck selector + remaining count + Refresh button.
- **No fixed positional slots**: no C.## card IDs. A new `cascadeDraw()` function handles all draw logic; `generateCard()` is not used.

**What needs doing:**

*Globals & state*
- [ ] Add `cascadeCurrent` and `cascadeNext` to `selectedDecks`
- [ ] Add `cascadeCurrent` and `cascadeNext` to `workingDecks` as `{ name, sourceDeck }[]` (not plain strings)
- [ ] Add `graveyardCards = []` global accumulator (`{ name, orientation, sourceDeck }[]`)

*Core logic*
- [ ] Update `initializeWorkingDecks()` to populate `cascadeCurrent` and `cascadeNext`, stamping each card object with `sourceDeck` at init time
- [ ] Write `cascadeDraw()`: splice random card from `cascadeCurrent` → push to `graveyardCards` with orientation; splice random card from `cascadeNext` → push to `cascadeCurrent`

*HTML (new tab)*
- [ ] Add `cascade-spread` tab button to the nav
- [ ] Build three-column tab layout: Graveyard column, Current column, Next column
- [ ] Current column: deck selector dropdown, remaining count, Draw button, drawn card detail panel (inline, not overlay)
- [ ] Next column: deck selector dropdown, remaining count, Refresh button
- [ ] Graveyard column: scrollable list container (each entry shows card name, orientation, source deck label)

*Deck selectors*
- [ ] Add `cascade-current-deck-selector` and `cascade-next-deck-selector`; hook into `populateDropdown()`

*Updates to existing functions*
- [ ] `updateDeckSidebar()` — add 3-row cascade state (Graveyard count, Current remaining, Next remaining) when cascade spread is active
- [ ] `clearAllSpreads()` — reset `graveyardCards = []`, reinitialize cascade working decks, clear Graveyard column DOM
- [ ] `exportReading()` / `importReading()` — serialize and restore `graveyardCards`, `selectedDecks.cascadeCurrent/Next`, and cascade working deck states

**Dependencies:**
- ✅ All prerequisites are complete.

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

*Core logic*
- [ ] Add `DUNGEON_CARD_DECKS` lookup object mapping C.46–C.59 to `'dungeonStory'`, `'dungeonLocations'`, or `'dungeonFeatures'`
- [ ] Extend `getSpreadKey()` to use the lookup for C.46–C.59
- [ ] Update `initializeWorkingDecks()` to populate `dungeonStory`, `dungeonLocations`, `dungeonFeatures` from hardcoded deck names (bypasses `selectedDecks`)
- [ ] Extend `generateCard()` to detect two-card dungeon slots and draw from each of the two deck keys for that slot
- [ ] Write `redrawDungeonSpread()`: validate all 3 deck sizes, reset 3 working decks, call `generateCard` for all 14 card IDs

*HTML (new tab)*
- [ ] Add `dungeon-spread` tab button to the nav
- [ ] Build dungeon slot grid (9 buttons, same asymmetric layout as Adventure Spread)
- [ ] Add static single-card detail panels for C.46, C.47, C.48, C.57
- [ ] Add dual-card detail panels for the 5 two-card slots (C.49/C.50, C.51/C.52, C.53/C.54, C.55/C.56, C.58/C.59) — Location and Feature side by side, each with its own Redraw button
- [ ] Add dungeon summary table (9 rows; two-card rows show both Location and Feature name/orientation)

*Updates to existing functions*
- [ ] `updateDeckSidebar()` — show 3 rows (Story, Locations, Features remaining) when dungeon spread is active; grey out deck selector dropdown
- [ ] `openQuickFill()` — handle dungeon two-card slots (two input rows per slot, autocomplete scoped per deck)
- [ ] `clearAllSpreads()` — reset C.46–C.59 DOM, reinitialize 3 dungeon working decks
- [ ] `exportReading()` / `importReading()` — verify C.46–C.59 coverage; confirm dual-card slot restore works correctly

**Dependencies:**
- ✅ All prerequisites are complete.

---

### Random Encounter Table vs. Dungeon Spread — Complexity Comparison

| | Item 7: Random Encounter Table | Item 8: Dungeon Spread |
|---|---|---|
| Design status | **Complete** — all decisions locked | **Complete** — all decisions locked |
| New card IDs | None — no positional slots | C.46–C.59 (14 new IDs) |
| Changes to existing code | Additive only | `getSpreadKey`, `initializeWorkingDecks`, `generateCard`, `updateDeckSidebar`, `clearAllSpreads` |
| New HTML structures | Three-column layout (no slot buttons) | Three-column layout + dual-card detail panel |
| Working decks affected | 2 new entries (`{ name, sourceDeck }[]` type) | 3 new entries (`string[]` type) |
| New globals | `graveyardCards = []` accumulator | None beyond working decks |
| Deck selector | Two selectors (Current + Next) | Greyed out (fixed decks) |
| **Overall complexity** | **Moderate** | **Moderate–High** |

**Bottom line:** Random Encounter Table is the simpler of the two. It is fully additive, requires no new card ID range, and modifies no existing functions. The Dungeon Spread modifies five existing functions and introduces a new dual-card panel template.

---

### 9. ❌ CSS and Visual Improvements
**Complexity: Low–Moderate (iterative)**

A final polish pass covering responsive layout, sizing, and visual consistency across the full application. Treated as the last task so that all features are in their final form before UI decisions are locked in.

**What needs doing:**
- Finalize the responsive CSS for mobile and tablet screen sizes, replacing all temporary in-progress rules with clean, settled values. Current breakpoints (≤768px mobile, 769–1024px tablet) need validation across real device sizes and orientations.
- Audit fixed pixel values remaining in the stylesheet and convert any that should scale (font sizes, spacing, component dimensions) to `clamp()`, `rem`, or percentage-based units.
- Card slot buttons (`.tab-grid .tablinks`) need confirmed final dimensions that work across all four spread layouts at both mobile and desktop widths.
- Review all spread tab layouts for visual consistency — padding, gap, and font size should feel uniform across Adventure, Five-Card, Three-Card, Journey, Blank Slate, and Deck Forge tabs.
- Evaluate and resolve any remaining visual inconsistencies introduced when new features (Free-Form Spread, Random Encounter Table, Dungeon Spread) were added.
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
        ├──▶ 7. Random Encounter Table
        │
        ├──▶ 8. Dungeon Spread
        │
        ▼
9. CSS and Visual Improvements (final pass)
```
