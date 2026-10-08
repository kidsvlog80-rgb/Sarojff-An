import json

# Let's verify layers in telegram-muscle-duck.json currently
with open('public/telegram-muscle-duck.json') as f:
    current = json.load(f)

print("Current layers count:", len(current.get('layers', [])))
