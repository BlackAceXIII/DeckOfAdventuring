#!/usr/bin/env node
/**
 * updateAllCards.js
 *
 * Reads individual card JSON files from a source directory and merges
 * them into AllCards.json. Existing cards are updated in place; new
 * cards are added; cards present in AllCards.json with no matching
 * file are left untouched and reported as warnings.
 *
 * deckLists.json is treated as the authoritative list of all valid card
 * names. Any individual file whose "name" field does not appear in any
 * deck list is rejected.
 *
 * Usage:
 *   node updateAllCards.js [options]
 *
 * Options:
 *   --cards-dir <path>   Directory containing individual card JSON files.
 *                        Defaults to ./CardsJsons
 *   --all-cards <path>   Path to AllCards.json to update.
 *                        Defaults to ./CardsJsons/AllCards.json
 *   --deck-lists <path>  Path to deckLists.json (authoritative card name list).
 *                        Defaults to ./CardsJsons/deckLists.json
 *   --dry-run            Print what would change without writing anything.
 *   --strict             Exit with code 1 if any card file fails validation
 *                        instead of skipping it and continuing.
 *   --help               Show this help text.
 *
 * Expected individual card file format (e.g. Donjon.json):
 * {
 *   "name": "Donjon",
 *   "description": "...",
 *   "meanings": {
 *     "person":       { "upright": "...", "reverse": "..." },
 *     "creatureTrap": { "upright": "...", "reverse": "..." },
 *     "place":        { "upright": "...", "reverse": "..." },
 *     "treasure":     { "upright": "...", "reverse": "..." },
 *     "situation":    { "upright": "...", "reverse": "..." }
 *   }
 * }
 *
 * AllCards.json structure (created fresh if it does not exist):
 * {
 *   "cards": {
 *     "Donjon": { "name": "Donjon", "description": "...", "meanings": { ... } },
 *     ...
 *   }
 * }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── ANSI colour helpers (disabled when stdout is not a TTY) ───────────────────

const isTTY = Boolean(process.stdout.isTTY);
const c = {
  reset:  isTTY ? '\x1b[0m'  : '',
  bold:   isTTY ? '\x1b[1m'  : '',
  green:  isTTY ? '\x1b[32m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  red:    isTTY ? '\x1b[31m' : '',
  cyan:   isTTY ? '\x1b[36m' : '',
  dim:    isTTY ? '\x1b[2m'  : '',
};

const log = {
  info:    (msg) => console.log(`${c.cyan}   info${c.reset}  ${msg}`),
  ok:      (msg) => console.log(`${c.green}     ok${c.reset}  ${msg}`),
  warn:    (msg) => console.log(`${c.yellow}   warn${c.reset}  ${msg}`),
  error:   (msg) => console.log(`${c.red}  error${c.reset}  ${msg}`),
  section: (msg) => console.log(`\n${c.bold}── ${msg}${c.reset}`),
  dim:     (msg) => console.log(`${c.dim}         ${msg}${c.reset}`),
};

// ── CLI argument parsing ──────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help')) {
  const src   = fs.readFileSync(__filename, 'utf8');
  const lines = src.split('\n');
  const start = lines.findIndex(l => l.startsWith(' *'));
  const end   = lines.findIndex((l, i) => i > start && !l.startsWith(' *'));
  console.log(lines.slice(start, end).map(l => l.replace(/^ \* ?/, '')).join('\n'));
  process.exit(0);
}

function getArg(flag, defaultValue) {
  const i = args.indexOf(flag);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) {
    return path.resolve(args[i + 1]);
  }
  return path.resolve(defaultValue);
}

const CARDS_DIR  = getArg('--cards-dir',  './CardsJsons');
const ALL_CARDS  = getArg('--all-cards',  './CardsJsons/AllCards.json');
const DECK_LISTS = getArg('--deck-lists', './CardsJsons/deckLists.json');
const DRY_RUN    = args.includes('--dry-run');
const STRICT     = args.includes('--strict');

// ── Schema constants ──────────────────────────────────────────────────────────

const MEANING_KEYS = ['person', 'creatureTrap', 'place', 'treasure', 'situation'];

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates one parsed card object against the schema defined in CardFormat.json.
 * Returns { errors: string[], warnings: string[] }.
 *
 * Rules:
 *  - "name" must be a non-empty string present in deckLists.json.
 *  - "description" must be a non-empty string that is not placeholder text.
 *  - "meanings" must be an object containing exactly the five required keys.
 *  - Each meaning must be an object with non-empty "upright" and "reverse" strings
 *    that are not placeholder text.
 *  - Extra top-level fields or extra meaning keys produce warnings, not errors,
 *    and are preserved as-is in the output.
 *
 * @param {unknown} card       - The parsed JSON value from an individual file.
 * @param {Set}     validNames - Set of all card names from deckLists.json.
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateCard(card, validNames) {
  const errors   = [];
  const warnings = [];

  if (typeof card !== 'object' || card === null || Array.isArray(card)) {
    errors.push('Root value must be a JSON object.');
    return { errors, warnings };
  }

  // ── name ──────────────────────────────────────────────────────────────────
  if (!card.name) {
    errors.push('Missing required field "name".');
  } else if (typeof card.name !== 'string') {
    errors.push('"name" must be a string.');
  } else if (card.name.trim() === '') {
    errors.push('"name" must not be empty.');
  } else if (!validNames.has(card.name)) {
    errors.push(
      `"name" value "${card.name}" does not match any card in deckLists.json. ` +
      `Check spelling and capitalisation — card names are case-sensitive.`
    );
  }

  // ── description ───────────────────────────────────────────────────────────
  if (!card.description) {
    errors.push('Missing required field "description".');
  } else if (typeof card.description !== 'string') {
    errors.push('"description" must be a string.');
  } else if (card.description.trim() === '') {
    errors.push('"description" must not be empty.');
  } else if (card.description.toLowerCase().includes('placeholder')) {
    errors.push('"description" still contains placeholder text.');
  }

  // ── extra top-level fields ────────────────────────────────────────────────
  const knownTopLevel = new Set(['name', 'description', 'meanings']);
  const extraTopLevel = Object.keys(card).filter(k => !knownTopLevel.has(k));
  if (extraTopLevel.length > 0) {
    warnings.push(
      `Unexpected top-level field(s) will be preserved: ${extraTopLevel.join(', ')}`
    );
  }

  // ── meanings ──────────────────────────────────────────────────────────────
  if (!card.meanings) {
    errors.push('Missing required field "meanings".');
    return { errors, warnings };
  }

  if (typeof card.meanings !== 'object' || Array.isArray(card.meanings)) {
    errors.push('"meanings" must be a plain object.');
    return { errors, warnings };
  }

  // Extra meaning keys
  const extraMeaningKeys = Object.keys(card.meanings).filter(
    k => !MEANING_KEYS.includes(k)
  );
  if (extraMeaningKeys.length > 0) {
    warnings.push(
      `Unexpected meaning key(s) will be preserved: ${extraMeaningKeys.join(', ')}`
    );
  }

  // Validate each required meaning category
  for (const key of MEANING_KEYS) {
    const meaning = card.meanings[key];

    if (meaning === undefined || meaning === null) {
      errors.push(`Missing required meaning category "meanings.${key}".`);
      continue;
    }

    // Reject the array form — this project uses { upright, reverse } objects only
    if (Array.isArray(meaning)) {
      errors.push(
        `"meanings.${key}" is an array. Use the object form: ` +
        `{ "upright": "...", "reverse": "..." }`
      );
      continue;
    }

    if (typeof meaning !== 'object') {
      errors.push(
        `"meanings.${key}" must be an object with "upright" and "reverse" fields.`
      );
      continue;
    }

    // upright
    if (meaning.upright === undefined) {
      errors.push(`Missing "meanings.${key}.upright".`);
    } else if (typeof meaning.upright !== 'string') {
      errors.push(`"meanings.${key}.upright" must be a string.`);
    } else if (meaning.upright.trim() === '') {
      errors.push(`"meanings.${key}.upright" must not be empty.`);
    } else if (meaning.upright.toLowerCase().includes('placeholder')) {
      errors.push(`"meanings.${key}.upright" still contains placeholder text.`);
    }

    // reverse
    if (meaning.reverse === undefined) {
      errors.push(`Missing "meanings.${key}.reverse".`);
    } else if (typeof meaning.reverse !== 'string') {
      errors.push(`"meanings.${key}.reverse" must be a string.`);
    } else if (meaning.reverse.trim() === '') {
      errors.push(`"meanings.${key}.reverse" must not be empty.`);
    } else if (meaning.reverse.toLowerCase().includes('placeholder')) {
      errors.push(`"meanings.${key}.reverse" still contains placeholder text.`);
    }
  }

  return { errors, warnings };
}

// ── File loading helper ───────────────────────────────────────────────────────

/**
 * Safely reads and parses a JSON file.
 * Returns { data } on success or { error: string } on failure.
 */
function loadJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return { data: JSON.parse(raw) };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { error: `File not found: ${filePath}` };
    }
    if (err instanceof SyntaxError) {
      return { error: `JSON syntax error: ${err.message}` };
    }
    return { error: `Could not read file: ${err.message}` };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\n${c.bold}updateAllCards.js${c.reset}`);
  if (DRY_RUN) log.warn('DRY RUN mode — no files will be written.');
  if (STRICT)  log.warn('STRICT mode — validation failures will cause a non-zero exit.');

  // ── Step 1: Load deckLists.json ───────────────────────────────────────────

  log.section('Loading deckLists.json');

  const deckListsResult = loadJSON(DECK_LISTS);
  if (deckListsResult.error) {
    log.error(`Could not load deckLists.json: ${deckListsResult.error}`);
    process.exit(1);
  }

  const deckLists = deckListsResult.data;

  if (typeof deckLists !== 'object' || Array.isArray(deckLists)) {
    log.error('deckLists.json must be a plain object mapping deck names to card name arrays.');
    process.exit(1);
  }

  // Build a flat set of every valid card name across all decks
  const validNames = new Set(Object.values(deckLists).flat());

  log.ok(
    `${validNames.size} unique card names across ` +
    `${Object.keys(deckLists).length} decks: ${Object.keys(deckLists).join(', ')}`
  );

  // ── Step 2: Load or initialise AllCards.json ──────────────────────────────

  log.section('Loading AllCards.json');

  let allCardsData;
  const allCardsResult = loadJSON(ALL_CARDS);

  if (allCardsResult.error && allCardsResult.error.startsWith('File not found')) {
    log.warn('AllCards.json does not exist and will be created from scratch.');
    allCardsData = { cards: {} };
  } else if (allCardsResult.error) {
    log.error(`Could not load AllCards.json: ${allCardsResult.error}`);
    process.exit(1);
  } else {
    allCardsData = allCardsResult.data;

    if (
      typeof allCardsData !== 'object' ||
      Array.isArray(allCardsData) ||
      typeof allCardsData.cards !== 'object' ||
      Array.isArray(allCardsData.cards)
    ) {
      log.error(
        'AllCards.json must be an object with a top-level "cards" object. ' +
        'Expected: { "cards": { "CardName": { ... }, ... } }'
      );
      process.exit(1);
    }

    log.ok(`Loaded ${Object.keys(allCardsData.cards).length} existing card(s).`);
  }

  // ── Step 3: Discover card files ───────────────────────────────────────────

  log.section(`Scanning cards directory`);
  log.dim(CARDS_DIR);

  if (!fs.existsSync(CARDS_DIR)) {
    log.error(`Cards directory not found: ${CARDS_DIR}`);
    log.info(
      'Create the directory and place individual card JSON files inside it.\n' +
      '         Use CardFormat.json as a template for each file.'
    );
    process.exit(1);
  }

  const allFiles   = fs.readdirSync(CARDS_DIR);

  // Exclude known non-card files that live in the same directory
  const EXCLUDE_FILES = new Set([
    'AllCards.json',
    'CardFormat.json',
    'deckLists.json',
    'customDecks.json',
    'seasonalDecks.json',
  ]);

  const cardFiles  = allFiles.filter(f => f.toLowerCase().endsWith('.json') && !EXCLUDE_FILES.has(f));
  const ignoredFiles = allFiles.filter(f => !f.toLowerCase().endsWith('.json'));

  if (ignoredFiles.length > 0) {
    log.warn(`Ignoring ${ignoredFiles.length} non-JSON file(s): ${ignoredFiles.join(', ')}`);
  }

  if (cardFiles.length === 0) {
    log.warn('No .json files found in the cards directory. Nothing to do.');
    process.exit(0);
  }

  log.ok(`Found ${cardFiles.length} JSON file(s).`);

  // ── Step 4: Parse and validate each file ─────────────────────────────────

  log.section('Validating card files');

  const toUpdate   = []; // Array of { key, card, filename, isNew }
  const skipped    = []; // Array of { filename, errors }
  let   strictFail = false;

  for (const filename of cardFiles.sort()) {
    const filePath = path.join(CARDS_DIR, filename);
    const result   = loadJSON(filePath);

    if (result.error) {
      log.error(`${filename}: ${result.error}`);
      skipped.push({ filename, errors: [result.error] });
      if (STRICT) strictFail = true;
      continue;
    }

    const { errors, warnings } = validateCard(result.data, validNames);

    // Print warnings regardless of whether the card is accepted
    warnings.forEach(w => log.warn(`${filename}: ${w}`));

    if (errors.length > 0) {
      log.error(`${filename}: failed validation (${errors.length} error(s)):`);
      errors.forEach(e => log.error(`         → ${e}`));
      skipped.push({ filename, errors });
      if (STRICT) strictFail = true;
      continue;
    }

    const key   = result.data.name;
    const isNew = !Object.prototype.hasOwnProperty.call(allCardsData.cards, key);
    toUpdate.push({ key, card: result.data, filename, isNew });
    log.ok(`${filename}  →  "${key}" ${isNew ? '(new)' : '(update)'}`);
  }

  // ── Step 5: Report cards in AllCards.json with no source file ─────────────

  log.section('Checking for unmatched existing cards');

  const updatedKeys    = new Set(toUpdate.map(u => u.key));
  const unmatchedKeys  = Object.keys(allCardsData.cards).filter(k => !updatedKeys.has(k));

  if (unmatchedKeys.length === 0) {
    log.ok('All existing cards in AllCards.json have a matching source file.');
  } else {
    log.info(
      `${unmatchedKeys.length} card(s) in AllCards.json have no source file ` +
      `and will be left unchanged:`
    );
    unmatchedKeys.forEach(k => log.dim(`  "${k}"`));
  }

  // ── Step 6: Report cards in deckLists with no file and no existing entry ──

  log.section('Checking deck coverage');

  const missingCards = [...validNames].filter(
    name => !updatedKeys.has(name) && !allCardsData.cards[name]
  );

  if (missingCards.length === 0) {
    log.ok('All cards referenced in deckLists.json are accounted for.');
  } else {
    log.warn(
      `${missingCards.length} card(s) are in deckLists.json but have no ` +
      `source file and no existing AllCards.json entry:`
    );
    missingCards.forEach(name => log.dim(`  "${name}"`));
  }

  // ── Step 7: Print summary ─────────────────────────────────────────────────

  log.section('Summary');

  const newCards     = toUpdate.filter(u => u.isNew);
  const updatedCards = toUpdate.filter(u => !u.isNew);

  log.info(`Cards to add:        ${newCards.length}`);
  log.info(`Cards to update:     ${updatedCards.length}`);
  log.info(`Files skipped:       ${skipped.length}`);
  log.info(`Cards left as-is:    ${unmatchedKeys.length}`);
  log.info(`Deck coverage gaps:  ${missingCards.length}`);

  if (toUpdate.length === 0) {
    log.warn('Nothing to write.');
    if (STRICT && strictFail) process.exit(1);
    process.exit(0);
  }

  if (DRY_RUN) {
    log.section('Dry run complete — nothing written.');
    if (newCards.length)     log.info('Would add:    ' + newCards.map(u => u.key).join(', '));
    if (updatedCards.length) log.info('Would update: ' + updatedCards.map(u => u.key).join(', '));
    if (STRICT && strictFail) process.exit(1);
    process.exit(0);
  }

  // ── Step 8: Merge updates into allCardsData ───────────────────────────────

  log.section('Writing AllCards.json');

  for (const { key, card } of toUpdate) {
    allCardsData.cards[key] = card;
  }

  // Sort cards alphabetically by key so diffs are clean and predictable
  const sortedCards = Object.keys(allCardsData.cards)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = allCardsData.cards[key];
      return acc;
    }, {});

  allCardsData.cards = sortedCards;

  // ── Step 9: Back up existing file, then write ─────────────────────────────

  if (fs.existsSync(ALL_CARDS)) {
    const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = ALL_CARDS.replace(/\.json$/, `.backup-${timestamp}.json`);
    try {
      fs.copyFileSync(ALL_CARDS, backupPath);
      log.ok(`Backup created: ${path.basename(backupPath)}`);
    } catch (err) {
      log.warn(`Could not create backup: ${err.message} — proceeding without one.`);
    }
  }

  try {
    fs.writeFileSync(ALL_CARDS, JSON.stringify(allCardsData, null, 4) + '\n', 'utf8');
    log.ok(`AllCards.json written successfully.`);
    log.dim(`Path:         ${ALL_CARDS}`);
    log.dim(`Total cards:  ${Object.keys(allCardsData.cards).length}`);
  } catch (err) {
    log.error(`Failed to write AllCards.json: ${err.message}`);
    process.exit(1);
  }

  if (STRICT && strictFail) {
    log.warn('Exiting with code 1 because --strict is set and some files failed validation.');
    process.exit(1);
  }

  log.section('Done.\n');
}

main();
