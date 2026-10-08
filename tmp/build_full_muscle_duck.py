import subprocess
import json
import os

scripts = [
    'tmp/build_p1.py',
    'tmp/build_p2.py',
    'tmp/build_p3.py',
    'tmp/build_p4.py',
    'tmp/build_p5.py',
    'tmp/build_p6.py'
]

for s in scripts:
    print(f"Running {s}...")
    res = subprocess.run(['python3', s], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error in {s}:", res.stderr)
        exit(1)
    print(res.stdout.strip())

# Now assemble all layers
all_layers = []
layer_files = [
    '/tmp/layers_1_6.json',
    '/tmp/layers_7_12.json',
    '/tmp/layers_13_22.json',
    '/tmp/layers_23_32.json',
    '/tmp/layers_33_42.json',
    '/tmp/layers_43_52.json'
]

# also check if /tmp or tmp
for lf in layer_files:
    path = lf if os.path.exists(lf) else lf.lstrip('/')
    with open(path, 'r') as f:
        data = json.load(f)
        all_layers.extend(data)

print(f"Total merged layers: {len(all_layers)}")

# Sort by ind
all_layers.sort(key=lambda x: x['ind'])

print("Layer count:", len(all_layers))
print("Layer indices:", [l['ind'] for l in all_layers])
print("Layer names:", [l.get('nm', '') for l in all_layers])

full_animation = {
    "v": "5.5.2",
    "fr": 60,
    "ip": 0,
    "op": 180,
    "w": 512,
    "h": 512,
    "nm": "Muscle Duck",
    "ddd": 0,
    "assets": [],
    "layers": all_layers,
    "markers": []
}

# Write to public/telegram-muscle-duck.json
with open('public/telegram-muscle-duck.json', 'w') as f:
    json.dump(full_animation, f)
print("Saved public/telegram-muscle-duck.json")

# Write to public/duck-muscle-animation-data.js
js_content = "window.DUCK_MUSCLE_ANIMATION_DATA = " + json.dumps(full_animation) + ";\nwindow.duckMuscleAnimationData = window.DUCK_MUSCLE_ANIMATION_DATA;\nwindow.donutStickerData = window.DUCK_MUSCLE_ANIMATION_DATA;"
with open('public/duck-muscle-animation-data.js', 'w') as f:
    f.write(js_content)
print("Saved public/duck-muscle-animation-data.js")

# Write to public/duck-muscle-sticker.json
with open('public/duck-muscle-sticker.json', 'w') as f:
    json.dump(full_animation, f)
print("Saved public/duck-muscle-sticker.json")
