import json

with open('public/telegram-muscle-duck.json', 'r') as f:
    d = json.load(f)

print("Name:", d.get('nm'))
print("Layer count:", len(d.get('layers', [])))
print("First 5 layer names:", [l.get('nm') for l in d.get('layers', [])[:5]])
