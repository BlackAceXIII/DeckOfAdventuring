# Card Reading Tool
### Based on WotC's Deck of Many Things Card Reference Guide

---

## What the Project Does

This is a browser-based card reading tool for tabletop RPG game masters. It draws cards from configurable decks and displays their meanings across several spread layouts, replacing the need to physically shuffle and deal cards at the table.

### Data Architecture

The browser application reads a small set of JSON files from `CardsJsons/` when it starts. The bulk of the data is pre‑compiled so that no additional network requests are needed once loading finishes.

- **`AllCards.json`** — A consolidated master list of every card. Each entry contains name, description, image credit, and upright/reverse meanings for the five categories (Person, Creature/Trap, Place, Treasure, Situation).
- **`deckLists.json`** — Named deck definitions. Each deck is just an array of card names that must exist in `AllCards.json`.
- **`customDecks.json`** *(optional, not shipped by default)* — A user‑editable file whose contents are merged over `deckLists.json`. If a custom deck has the same name as a built‑in one, it replaces it.

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
| Blank Slate Spread | 17 | C.00–C.16 | Free-form grid reusing all slots from the three structured spreads above. No positional meaning. |
| All Cards Spread | All | — | Dynamically populated grid of every card in `AllCards.json`. Clicking any card opens a read-only detail panel showing its upright meanings. No orientation is drawn. |

### Deck Selection

A dropdown above the spread tabs lists all available decks from `deckLists.json` plus any loaded `customDecks.json` entries. The selected deck applies to all spreads simultaneously. Changing the selection does not automatically redraw existing cards.

### Replacement Toggle

A toggle at the top of the page controls whether the same card can appear multiple times in a single spread draw (**with replacement**) or not (**without replacement**).

> **Note:** The without-replacement logic currently logs the toggle state but does not yet modify draw behaviour. Full implementation is item #1 on the to-do list below.

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

- Card images currently point to a placeholder path (`../JSON_Folder/Generic Soldier 4.png`). Real card images are not yet wired to individual cards.
- The `input type="switch"` on the replacement toggle is not a valid HTML type — browsers fall back to `type="text"`. Should be `type="checkbox"`.
- The All Cards spread shows only upright meanings since no orientation is drawn.

---

## To-Do List

Features are ordered from least to most complex to implement. Dependencies are noted where one feature enables or complicates another.

---

### 1. ✅ Replacement Toggle — Complete Implementation
**Complexity: Lowest**

The UI toggle already exists. The underlying draw logic needs to be connected to it.

**What needs doing:**
- When **with replacement** is on (current default behaviour): each slot picks randomly from the full deck independently, as it does now.
- When **without replacement** is on: shuffle a copy of the deck once before a full spread redraw, then deal sequentially so no card repeats. Individual per-slot redraws should draw from the remaining undealt pool.
- If the selected deck has fewer cards than the spread requires and without-replacement is active, disable the toggle and show a visible explanation rather than silently failing or producing `undefined`.

**Dependencies:**
- Aids the **Free-Form Spread** — coordinating a shared card pool across individual slot draws in a free-form context is the same problem, already solved here.

---

### 2. ❌ Import / Export
**Complexity: Low**

All data needed for a save is already in the DOM and in the JS draw state. No architectural changes required.

**What needs doing:**
- **Export:** Collect the current card name, orientation, and slot ID for every drawn slot into a plain JS object and serialize it to JSON. Trigger a file download via a `Blob` and a temporary `<a>` tag. Store the active deck selection and spread alongside the card data.
- **Import:** Read the JSON file back, validate that card names still exist in the current `AllCards.json`, and call the existing `setText` helpers to repopulate all slots. Handle gracefully the case where a saved card name no longer exists in the loaded data.
- The selected deck at time of save should be stored and restored.

**Format note:** File download is preferable to URL encoding for this project since card names of arbitrary length could exceed URL limits.

**Dependencies:**
- Aids **Custom Deck Building** — custom decks can piggyback on the same save format, giving persistence for free.
- Aids **Multi-Deck Adventure Spread** — sessions for that spread are the most complex to reconstruct manually; import/export makes it practical.
- Gets slightly more complex if delayed until after per-spread deck selection and the multi-deck spread are added, since there is more state to capture.

---

### 3. ✅ Per-Spread Deck Selection
**Complexity: Low–Moderate**

Replaces one global string with a small object. The spread-detection logic already exists in `generateCard` and just needs extending.

**What needs doing:**
- Replace `selectedDeck` (single string) with `selectedDecks` (object keyed by spread ID, e.g. `{ 'adventure-spread': 'Default', 'five-card-spread': 'Default', ... }`).
- The dropdown either moves into each spread panel or stays as a single control that updates only the currently active spread's entry in `selectedDecks` when changed.
- `generateCard` already has card-number range branches for each spread. Extend those branches to look up `selectedDecks[spreadId]` instead of the global `selectedDeck`.
- Initialize all spreads to the first available deck as a default on load.

**Dependencies:**
- Directly enables **Custom Deck Building** to be meaningful per-spread rather than global.
- Is a stepping stone toward the **Multi-Deck Adventure Spread** — per-slot deck assignment in that spread is a small extension of per-spread assignment. Doing this first makes that feature significantly less disruptive.
- Makes the **Free-Form Spread** automatically inherit its own deck choice.
- Skipping this and attempting the multi-deck spread directly requires a larger one-time architectural jump.

---

### 4. ❌ Custom Deck Building
**Complexity: Moderate**

Lets users construct their own named decks from the cards available in `AllCards.json`. Writes into the same `allDecks` object the rest of the code already reads from.

**What needs doing:**
- UI: a searchable or filterable checklist of all cards from `allDecks`, with a name field and a save button.
- On save: push the new deck into `allDecks` and repopulate the deck dropdown(s).
- Persistence: without a backend, custom decks only survive the session unless saved via `localStorage` or the import/export system. Import/export being built first makes persistence essentially free.
- If the deck list grows very large, the checklist UI needs filtering or search to stay usable.

**Specification note:** The `customDecks.json` file mechanism already exists — custom decks loaded from that file override defaults of the same name. In-browser custom deck building would write to `allDecks` in memory rather than to disk, unless paired with export.

**Dependencies:**
- Easier with **Import/Export** done first (persistence is free).
- Easier with **Per-Spread Deck Selection** done first (custom decks become immediately more useful when each spread can select independently).
- Directly enables the **Multi-Deck Adventure Spread**, which requires specifically named decks (story deck, locations deck, features deck) to exist before the spread can function.

---

### 5. ❌ Manual Card Selection
**Complexity: Moderate–High**

Adds a mode where the user chooses a specific card to assign to a slot rather than drawing randomly.

**What needs doing:**
- An intermediate card-picker UI: when in manual mode, clicking a slot position button opens a searchable list of cards from the relevant deck rather than immediately drawing.
- The user selects a card and optionally sets orientation (or orientation remains random).
- Manual and random-draw modes must coexist — some slots in a spread may be manually set while others remain randomly drawn.
- The picker UI can share component logic with the **Custom Deck Building** checklist.

**Design decision required:** Does manual selection respect the currently selected deck (showing only that deck's cards) or the full `AllCards.json`? Does it reset when the deck is changed?

**Dependencies:**
- Easier with **Per-Spread Deck Selection** done first — knowing which deck to browse per slot is already solved.
- Harder if the **Multi-Deck Adventure Spread** is added first without manual selection in mind — slots in that spread draw from different deck types and manual selection would need to respect per-slot deck assignment.
- The Free-Form Spread is the most natural home for manual selection; tackling both simultaneously conflates two separate problems and is not recommended.

---

### 6. ⚠️ Free-Form / Blank Slate Spread — Full Implementation
**Complexity: Moderate**

The Blank Slate spread tab already exists and populates slot buttons for C.00–C.16. Full implementation means clarifying its behaviour and connecting it to the replacement toggle and per-spread deck selection.

**What needs doing:**
- Decide and implement label behaviour: the current slot buttons show IDs (`C.00` etc.) which are meaningless without positional roles. Options are neutral numeric labels, user-renameable labels, or no labels.
- Optionally: a number input to control how many slots are active, rather than always showing all 17.
- Connect to the replacement toggle so without-replacement coordinates across individual slot draws within this spread (the same shared-pool problem solved in item #1).
- Ensure per-spread deck selection (item #3) applies here automatically once built.

**Note on design:** The free-form spread is intentionally roleless — it is most useful for improvisational draws mid-session. Keeping it simple and not over-structuring it is preferable.

**Dependencies:**
- Easier with the **Replacement Toggle** fully implemented first.
- Easier with **Per-Spread Deck Selection** done first (inherits its own deck choice automatically).
- Manual card selection fits naturally here but should be built separately first and then connected, not tackled simultaneously.

---

### 7. ❌ Multi-Deck Adventure Spread
**Complexity: Highest**

A modified Adventure Spread where different slot types draw from different named decks simultaneously, some slots require two cards (a location and a feature paired together), the number of challenge slots is variable (1–3), and some slots are optional.

**Full specification:**

| Slot | Label | Deck(s) | Optional? |
|---|---|---|---|
| 1 | Party Gathers | Story deck | Yes |
| 2 | Adventure Begins | Story deck | Yes |
| 3 | Journey | Story deck | Yes |
| 4 | Entrance | Locations deck + Features deck (paired) | No |
| 5 | Challenge 1 | Locations deck + Features deck (paired) | Configurable (1–3 challenges total) |
| 6 | Challenge 2 | Locations deck + Features deck (paired) | Configurable |
| 7 | Challenge 3 | Locations deck + Features deck (paired) | Configurable |
| 8 | Treasure | Features deck | No |
| 9 | Guardian | Features deck + Locations deck (paired) | No |

**What needs doing:**
- The current one-card-per-slot data model must be extended to support paired cards (two cards drawn from different decks displayed together in one slot).
- A variable challenge count control (1–3) must dynamically show/hide challenge slots.
- Optional slots (1–3) need a distinct UI state: intentionally empty vs not yet drawn.
- The story deck, locations deck, and features deck must exist as named decks — either as built-in entries in `deckLists.json` or as custom decks built by the user.
- `generateCard` must be extended or a new parallel function created to handle per-slot deck assignment rather than a single deck for the whole spread.

**Dependencies:**
- Significantly easier if **Per-Spread Deck Selection** is done first (per-slot deck assignment is a direct extension).
- Significantly easier if **Custom Deck Building** is done first (the required named decks need to exist).
- Easier if **Import/Export** is done first (sessions for this spread are the most complex state to reconstruct manually).
- Harder if **Manual Card Selection** is attempted at the same time — the paired slot mechanic and manual selection interact in non-trivial ways and are better solved separately.

---

## Recommended Implementation Order

```
1. Replacement Toggle (complete)
        │
        ▼
2. Import / Export
        │
        ▼
3. Per-Spread Deck Selection
        │
        ▼
4. Custom Deck Building
        │
        ├──▶ 5. Manual Card Selection
        │
        ├──▶ 6. Free-Form Spread (full)
        │
        ▼
7. Multi-Deck Adventure Spread
```

Each step either directly enables the next or reduces its implementation cost. No feature in this order requires reworking something that was just built.