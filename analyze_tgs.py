import json

with open('public/game-sticker.json') as f:
    d = json.load(f)

# Let's inspect the entire JSON to understand what character it actually is and why some parts were separated
print("Canvas w:", d.get('w'), "h:", d.get('h'), "fr:", d.get('fr'), "op:", d.get('op'))
print("Number of layers:", len(d.get('layers', [])))

# Let's check layer types and names
for l in d.get('layers', []):
    print(f"Layer {l.get('ind')}: {l.get('nm')} (ty={l.get('ty')}, parent={l.get('parent')}, ip={l.get('ip')}, op={l.get('op')})")
