import os
import json

def convert_card_format():
    """
    Converts card JSON files from array format to upright/reverse object format.
    
    Old format (like Star.json):
    "meanings": {
        "person": [
            "upright meaning",
            "reverse meaning"
        ]
    }
    
    New format (like Stairway.json):
    "meanings": {
        "person": {
            "upright": "upright meaning",
            "reverse": "reverse meaning"
        }
    }
    """
    base_dir = r'c:\Users\sbawaney\Documents\VSCode Files\DeckOfAdventuring\CardsJsons'
    
    # Files to exclude from conversion
    exclude_files = ['CardFormat.json', 'deckLists.json', 'AllCards.json', 'customDecks.json', 'seasonalDecks.json']
    
    # Get all JSON files in the directory
    json_files = [f for f in os.listdir(base_dir) if f.endswith('.json')]
    
    converted_count = 0
    already_converted_count = 0
    error_count = 0
    
    for filename in json_files:
        if filename in exclude_files:
            continue
            
        filepath = os.path.join(base_dir, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                card_data = json.load(f)
            
            # Check if this card needs conversion
            needs_conversion = False
            if 'meanings' in card_data:
                for category, meaning in card_data['meanings'].items():
                    if isinstance(meaning, list):
                        needs_conversion = True
                        break
            
            if not needs_conversion:
                print(f"✓ {filename} - Already in new format")
                already_converted_count += 1
                continue
            
            # Convert the meanings format
            converted_meanings = {}
            for category, meaning in card_data['meanings'].items():
                if isinstance(meaning, list) and len(meaning) == 2:
                    converted_meanings[category] = {
                        "upright": meaning[0],
                        "reverse": meaning[1]
                    }
                elif isinstance(meaning, dict):
                    # Already in new format
                    converted_meanings[category] = meaning
                else:
                    print(f"⚠ Warning: Unexpected format in {filename}, category {category}")
                    converted_meanings[category] = meaning
            
            # Update the card data
            card_data['meanings'] = converted_meanings
            
            # Write back to file
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(card_data, f, indent=4)
            
            print(f"✓ {filename} - Converted to new format")
            converted_count += 1
            
        except Exception as e:
            print(f"✗ Error processing {filename}: {e}")
            error_count += 1
    
    print(f"\n=== Conversion Summary ===")
    print(f"Files converted: {converted_count}")
    print(f"Files already in new format: {already_converted_count}")
    print(f"Files with errors: {error_count}")
    print(f"Total files processed: {converted_count + already_converted_count + error_count}")
    
    if converted_count > 0:
        print(f"\n✓ Successfully converted {converted_count} files to the new upright/reverse object format!")
    else:
        print(f"\n✓ All files are already in the correct format!")

def preview_conversion(filename):
    """
    Preview what the conversion would look like for a specific file without making changes.
    """
    base_dir = r'c:\Users\sbawaney\Documents\VSCode Files\DeckOfAdventuring\CardsJsons'
    filepath = os.path.join(base_dir, filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            card_data = json.load(f)
        
        print(f"\n=== Preview for {filename} ===")
        print("Current format:")
        print(json.dumps(card_data.get('meanings', {}), indent=2))
        
        # Convert the meanings format
        if 'meanings' in card_data:
            converted_meanings = {}
            for category, meaning in card_data['meanings'].items():
                if isinstance(meaning, list) and len(meaning) == 2:
                    converted_meanings[category] = {
                        "upright": meaning[0],
                        "reverse": meaning[1]
                    }
                else:
                    converted_meanings[category] = meaning
            
            print("\nNew format would be:")
            print(json.dumps(converted_meanings, indent=2))
        
    except Exception as e:
        print(f"Error previewing {filename}: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        if len(sys.argv) > 2:
            preview_conversion(sys.argv[2])
        else:
            print("Usage: python convert_card_format.py preview <filename.json>")
    else:
        convert_card_format()
