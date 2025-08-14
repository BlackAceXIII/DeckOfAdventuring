# python - filename: list_missing_cards.py
import json
from pathlib import Path

p = Path(r"c:\Users\sbawaney\Documents\VSCode Files\DeckOfAdventuring")
a = json.load(open(p / "5etools_DoMMT.json", "r", encoding="utf-8"))
b = json.load(open(p / "CardsJsons" / "AllCards.json", "r", encoding="utf-8"))

names_a = {c.get("name") for c in a.get("cards", []) if c.get("name")}
names_b = set(b.get("cards", {}).keys())

missing = sorted(names_a - names_b)
print("\n".join(missing) if missing else "None - all cards present in AllCards.json")