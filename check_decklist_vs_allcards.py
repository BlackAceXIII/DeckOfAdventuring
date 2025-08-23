# Check for card names in deckLists.json that are not in AllCards.json
import json
from pathlib import Path

def check_missing_cards():
    base_path = Path(r"c:\Users\sbawaney\Documents\VSCode Files\DeckOfAdventuring\CardsJsons")
    
    # Load deckLists.json
    with open(base_path / "deckLists.json", "r", encoding="utf-8") as f:
        deck_lists = json.load(f)
    
    # Load AllCards.json
    with open(base_path / "AllCards.json", "r", encoding="utf-8") as f:
        all_cards = json.load(f)
    
    # Get all card names from AllCards.json
    available_cards = set(all_cards.get("cards", {}).keys())
    
    # Collect all unique card names from all decks in deckLists.json
    all_deck_cards = set()
    
    print("Checking each deck:")
    for deck_name, card_list in deck_lists.items():
        print(f"\nDeck: {deck_name}")
        print(f"  Cards: {len(card_list)}")
        
        # Check for missing cards in this specific deck
        deck_set = set(card_list)
        missing_in_deck = deck_set - available_cards
        
        if missing_in_deck:
            print(f"  MISSING from AllCards.json: {sorted(missing_in_deck)}")
        else:
            print("  ✓ All cards found in AllCards.json")
        
        # Add to overall set
        all_deck_cards.update(card_list)
    
    # Overall summary
    print(f"\n=== SUMMARY ===")
    print(f"Total unique cards referenced in deckLists.json: {len(all_deck_cards)}")
    print(f"Total cards available in AllCards.json: {len(available_cards)}")
    
    # Find cards in deckLists but not in AllCards
    missing_cards = all_deck_cards - available_cards
    
    if missing_cards:
        print(f"\nCards in deckLists.json but NOT in AllCards.json:")
        for card in sorted(missing_cards):
            print(f"  - {card}")
    else:
        print(f"\n✓ All cards from deckLists.json are present in AllCards.json")
    
    # Find cards in AllCards but not referenced in any deck
    unused_cards = available_cards - all_deck_cards
    if unused_cards:
        print(f"\nCards in AllCards.json but NOT referenced in any deck:")
        for card in sorted(unused_cards):
            print(f"  - {card}")
    else:
        print(f"\n✓ All cards in AllCards.json are referenced in at least one deck")

if __name__ == "__main__":
    check_missing_cards()
