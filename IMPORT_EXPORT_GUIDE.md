# Import/Export Feature Guide

## Overview
The Card Reading application now supports saving and loading your reading sessions. This allows you to:
- Save your current reading to share with others
- Create backup copies of important readings
- Resume a reading session later
- Archive readings for future reference

## User Interface

### Export Button
- **Location**: Below the replacement toggle, before the spread tabs
- **Icon**: 📥 Export Reading
- **Color**: Blue (#2196F3)
- **Function**: Downloads current reading as a JSON file

### Import Button
- **Location**: Next to the Export button
- **Icon**: 📤 Import Reading
- **Color**: Orange (#FF9800)
- **Function**: Opens file picker to load a saved reading

## How to Export a Reading

1. **Draw Your Cards**: Use the application normally to draw cards across any spreads
2. **Click "Export Reading"**: The blue export button in the control area
3. **File Downloads**: A JSON file is automatically downloaded with format:
   - Filename: `card-reading-YYYY-MM-DDTHH-MM-SS.json`
   - Example: `card-reading-2024-01-15T14-30-45.json`
4. **Confirmation**: Alert shows how many cards were saved

### What Gets Exported?

The export file contains:
- **All drawn cards** (C.00 through C.30)
- **Card orientations** (Upright or Reverse)
- **Deck selections** (which deck is selected for each spread)
- **Settings**:
  - Replacement toggle state (with/without replacement)
- **Metadata**:
  - Export timestamp
  - File format version

### Example Export File Structure

```json
{
  "version": "1.0",
  "timestamp": "2024-01-15T14:30:45.123Z",
  "settings": {
    "isReplaceableEnabled": false,
    "selectedDecks": {
      "adventure": "Default",
      "fiveCard": "Default",
      "threeCard": "Custom Deck 1",
      "journey": "Default"
    }
  },
  "cards": {
    "C.00": {
      "name": "Aberration",
      "orientation": "Upright"
    },
    "C.01": {
      "name": "Balance",
      "orientation": "Reverse"
    },
    "C.17": {
      "name": "Void",
      "orientation": "Upright"
    }
  }
}
```

## How to Import a Reading

1. **Click "Import Reading"**: The orange import button
2. **Select File**: File picker opens - choose a `.json` reading file
3. **Automatic Restoration**: All cards, settings, and selections are restored
4. **Confirmation**: Alert shows:
   - How many cards were restored
   - Warning if any cards couldn't be found

### Import Process

When you import a reading:

1. **Settings Restored**:
   - Replacement toggle is set to saved state
   - Deck selections are restored for all spreads
   - Dropdown menus update automatically

2. **Cards Restored**:
   - Card names populate in detail panels
   - Orientations are set correctly
   - All five meaning categories are filled
   - Spread tables update automatically

3. **Validation**:
   - Checks if card names exist in current `AllCards.json`
   - Skips cards that are no longer in the database
   - Reports how many cards were skipped (if any)

### Import Warnings

You may see warnings if:
- **Card not found**: A saved card no longer exists in `AllCards.json`
  - The card is skipped
  - Other cards are still restored
  - Warning message shows count of missing cards

- **Deck not found**: A saved deck selection doesn't exist
  - Falls back to first available deck
  - Cards still restore with correct names/orientations

## Use Cases

### 1. Session Continuity
**Scenario**: You're in the middle of a complex reading but need to close your browser.

**Workflow**:
1. Click "Export Reading"
2. Close browser
3. Later: Open application, click "Import Reading"
4. Select your saved file
5. Continue exactly where you left off

### 2. Sharing Readings
**Scenario**: You want to share a reading with another GM or player.

**Workflow**:
1. Complete your reading
2. Click "Export Reading"
3. Send the `.json` file via email, Discord, etc.
4. Recipient imports it to see the exact same spread

### 3. Reading Archives
**Scenario**: You want to keep a library of readings for different campaigns.

**Workflow**:
1. Create reading for Campaign A
2. Export as `campaign-a-session-1.json`
3. Rename file descriptively
4. Store in organized folder structure
5. Import later to review or continue

### 4. Backup Before Redraw
**Scenario**: You like a reading but want to experiment with redraws.

**Workflow**:
1. Export current reading (creates backup)
2. Click "Redraw All Cards" to experiment
3. If you prefer original, import the backup

## Technical Details

### File Format
- **Type**: JSON (JavaScript Object Notation)
- **Encoding**: UTF-8
- **Extension**: `.json`
- **MIME Type**: `application/json`

### Data Storage
The export captures data from the DOM:
- Card names from `#card-name-C.##` elements
- Orientations from `#card-orientation-C.##` elements
- Deck selections from `selectedDecks` global object
- Settings from global variables

The import restores data to the DOM:
- Uses existing `setText()` helper function
- Updates both detail panels and spread tables
- Maintains data consistency across all UI elements

### Version Compatibility
- **Current Version**: 1.0
- **Forward Compatibility**: Future versions will read older formats
- **Validation**: Import checks for required fields before processing

### Error Handling

**Export Errors** (rare):
- Browser blocks download → Check browser permissions
- No cards drawn → Still exports (empty cards object)

**Import Errors**:
- Invalid JSON → Alert with error message
- Missing version field → Rejects file
- Missing cards field → Rejects file
- Individual card not found → Skips card, continues import

### Browser Compatibility
- **Modern browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **File API**: Required (supported in all modern browsers)
- **Blob API**: Required (supported in all modern browsers)
- **Download attribute**: Required (supported in all modern browsers)

## Best Practices

### File Naming
The application auto-generates names with timestamps, but you can rename for better organization:

**Good Names**:
- `campaign-name-session-01.json`
- `adventure-spread-final-boss.json`
- `five-card-spread-2024-01-15.json`

**Avoid**:
- Generic names like `reading.json` (hard to identify later)
- Special characters that may not work on all systems

### Organizing Exports
Suggested folder structure:
```
/Card Readings
  /Campaign Alpha
    session-001.json
    session-002.json
  /Campaign Beta
    intro-reading.json
    finale-reading.json
  /Templates
    blank-adventure-spread.json
```

### Version Control
For important readings:
1. Export initial version
2. Make changes
3. Export v2 with descriptive name
4. Keep both versions for comparison

## Troubleshooting

### "Card not found" warnings on import
**Cause**: Card existed in old `AllCards.json` but not in current version

**Solution**:
- Check if card was renamed or removed
- Update the JSON file manually if needed
- Or accept that those cards will be skipped

### Import does nothing
**Cause**: Likely file format issue

**Steps**:
1. Open JSON file in text editor
2. Verify it contains `"version"` and `"cards"` fields
3. Check JSON is valid (use jsonlint.com)
4. Re-export if file is corrupted

### Export button not working
**Cause**: Browser security or permissions

**Steps**:
1. Check browser console for errors
2. Verify browser allows downloads
3. Try different browser
4. Check browser download settings

### Deck selection not restoring
**Cause**: Saved deck name doesn't exist in current `allDecks`

**Result**: Application uses first available deck instead

**Solution**: 
- Ensure `deckLists.json` or `customDecks.json` contains the required deck
- Or manually select the correct deck after import

## Future Enhancements

Possible improvements for future versions:

1. **Cloud Storage**: Save readings to cloud service
2. **Auto-save**: Periodic automatic backups
3. **Reading History**: Built-in list of recent readings
4. **Batch Export**: Export multiple readings at once
5. **Import Preview**: Show what will be imported before confirming
6. **Partial Import**: Select which spreads to import
7. **Merge Readings**: Combine cards from multiple readings
8. **Export to PDF**: Generate printable reading summary

## JSON Schema Reference

For developers or advanced users who want to manually create/edit reading files:

```json
{
  "version": "string (required) - Format version, currently '1.0'",
  "timestamp": "string (optional) - ISO 8601 timestamp",
  "settings": {
    "isReplaceableEnabled": "boolean (optional) - Card replacement setting",
    "selectedDecks": {
      "adventure": "string (optional) - Deck name for Adventure spread",
      "fiveCard": "string (optional) - Deck name for Five-Card spread",
      "threeCard": "string (optional) - Deck name for Three-Card spread",
      "journey": "string (optional) - Deck name for Journey spread"
    }
  },
  "cards": {
    "C.##": {
      "name": "string (required) - Card name matching AllCards.json",
      "orientation": "string (required) - 'Upright' or 'Reverse'"
    }
  }
}
```

### Validation Rules

**Required Fields**:
- `version` (string)
- `cards` (object)

**Optional Fields**:
- `timestamp` (string)
- `settings` (object)
- `settings.isReplaceableEnabled` (boolean)
- `settings.selectedDecks` (object)

**Card Slots**:
- Valid range: `C.00` through `C.30`
- Format: `C.` followed by two-digit number (leading zero for 0-9)

**Card Names**:
- Must match entry in `AllCards.json`
- Case-sensitive

**Orientations**:
- Accepted values: `"Upright"` or `"Reverse"`
- Case-sensitive

## Support

For issues or questions about import/export:
1. Check browser console for error messages
2. Verify JSON file format using validator
3. Test with a fresh export to confirm functionality
4. Report persistent issues with example file (remove sensitive data)
