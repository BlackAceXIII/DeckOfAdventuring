import os
import json

def build_all_cards():
    base_dir = r'c:\Users\sbawaney\Documents\VSCode Files\DeckOfAdventuring\CardsJsons'
    
    # Load deckLists.json
    with open(os.path.join(base_dir, 'deckLists.json'), 'r', encoding='utf-8') as f:
        deck_lists = json.load(f)
    
    # Initialize the cards dictionary
    cards = {}
    
    # Get all JSON files in the directory
    json_files = [f for f in os.listdir(base_dir) if f.endswith('.json')]
    
    # Exclude the files we don't want to include
    exclude_files = ['CardFormat.json', 'deckLists.json', 'AllCards.json']
    
    for filename in json_files:
        if filename in exclude_files:
            continue
            
        card_name = filename[:-5]  # Remove .json extension
        filepath = os.path.join(base_dir, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                card_data = json.load(f)
                cards[card_name] = card_data
                print(f"Added {card_name}")
        except Exception as e:
            print(f"Error reading {filename}: {e}")
    
    # Create the combined structure
    all_cards = {
        "deckLists": deck_lists,
        "cards": cards
    }
    
    # Write to AllCards.json
    output_path = os.path.join(base_dir, 'AllCards.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_cards, f, indent=2)
    
    print(f"\nSuccessfully created AllCards.json with {len(cards)} cards")
    print(f"Excluded files: {exclude_files}")

if __name__ == "__main__":
    build_all_cards()
