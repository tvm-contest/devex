#!/usr/bin/env python3

# ==============================================================================
# 
import time
import os
import sys
import random
import json
from PIL import Image
from pprint import pprint

# ==============================================================================
# 
defaultMeta = {
    "name"  : "Test Degen EVER #",
    "symbol": "TDEVER",
    "description": "testing generator",
    "image": "",
    "external_url": "",
    "collection": {
        "name": "Degens test 1",
        "family": "Degens"
    },
    "attributes": [],
    "properties": {
        "files": [
            {"uri": "","type": "image/png"}
        ],
        "category": "image"
    }
}

# ==============================================================================
# 
def getFilesInFolder(folder: str, extension: str):
    files = []
    for file in os.listdir(folder):
        if file.endswith(extension):
            files.append(os.path.join(folder, file))
    return files

# ==============================================================================
# 
backgrounds = getFilesInFolder("./assets_raw/background", ".png")
balls       = getFilesInFolder("./assets_raw/ball",       ".png")
eyes        = getFilesInFolder("./assets_raw/eye_color",  ".png")
iriss       = getFilesInFolder("./assets_raw/iris",       ".png")
shines      = getFilesInFolder("./assets_raw/shine",      ".png")
bottoms     = getFilesInFolder("./assets_raw/bottom_lid", ".png")
tops        = getFilesInFolder("./assets_raw/top_lid",    ".png")

backgroundsProbabilities = [100]
backgroundsTraits        = [{"Background": "Black"}]
ballsProbabilities       = [10, 90]
ballsTraits              = [{"Ball Color": "Red"}, {"Ball Color": "White"}]
eyesProbabilities        = [3,10,7,10,15,5,5,10,9,6,19,1]
eyesTraits               = [{"Eye Color": "Cyan Big"},   {"Eye Color": "Cyan Small"}, 
                            {"Eye Color": "Green Big"},  {"Eye Color": "Green Small"},
                            {"Eye Color": "Pink Big"},   {"Eye Color": "Pink Small"},
                            {"Eye Color": "Purple Big"}, {"Eye Color": "Purple Small"},
                            {"Eye Color": "Red Big"},    {"Eye Color": "Red Small"},
                            {"Eye Color": "Yellow Big"}, {"Eye Color": "Yellow Small"}]
irissProbabilities       = [10, 80, 10]
irissTraits              = [{"Iris Size": "Large"}, {"Iris Size": "Medium"}, {"Iris Size": "Small"}]
shinesProbabilities      = [100]
shinesTraits             = [{"Shine Type": "Shapes"}]
bottomsProbabilities     = [30, 30, 40]
bottomsTraits            = [{"Bottom Lid": "High"}, {"Bottom Lid": "Low"}, {"Bottom Lid": "Tilted"}]
topsProbabilities        = [30, 30, 40]
topsTraits               = [{"Top Lid": "High"}, {"Top Lid": "Low"}, {"Top Lid": "Tilted"}]

# ==============================================================================
# 
for i in range(0, 200):
    layers = []

    layers.append(backgrounds.index(random.choices(backgrounds, weights=backgroundsProbabilities)[0]))
    layers.append(balls.index      (random.choices(balls,       weights=ballsProbabilities      )[0]))
    layers.append(eyes.index       (random.choices(eyes,        weights=eyesProbabilities       )[0]))
    layers.append(iriss.index      (random.choices(iriss,       weights=irissProbabilities      )[0]))
    layers.append(shines.index     (random.choices(shines,      weights=shinesProbabilities     )[0]))
    layers.append(bottoms.index    (random.choices(bottoms,     weights=bottomsProbabilities    )[0]))
    layers.append(tops.index       (random.choices(tops,        weights=topsProbabilities       )[0]))

    result = Image.open(backgrounds[layers[0]]).convert('RGBA')

    with Image.open(balls  [layers[1]]).convert('RGBA') as foreground:
        result.alpha_composite(foreground, (0, 0), (0, 0))
    with Image.open(eyes   [layers[2]]).convert('RGBA') as foreground:
        result.alpha_composite(foreground, (0, 0), (0, 0))
    with Image.open(iriss  [layers[3]]).convert('RGBA') as foreground:
        result.alpha_composite(foreground, (0, 0), (0, 0))
    with Image.open(shines [layers[4]]).convert('RGBA') as foreground:
        result.alpha_composite(foreground, (0, 0), (0, 0))
    with Image.open(bottoms[layers[5]]).convert('RGBA') as foreground:
        result.alpha_composite(foreground, (0, 0), (0, 0))
    with Image.open(tops   [layers[6]]).convert('RGBA') as foreground:
        result.alpha_composite(foreground, (0, 0), (0, 0))
    
    result.save(os.path.join("assets_generated", f"{i}.png"))

    meta = defaultMeta.copy()
    meta["name"] = meta["name"] + str(i)

    meta["attributes"] = []
    meta["attributes"].append(backgroundsTraits[layers[0]])
    meta["attributes"].append(ballsTraits      [layers[1]])
    meta["attributes"].append(eyesTraits       [layers[2]])
    meta["attributes"].append(irissTraits      [layers[3]])
    meta["attributes"].append(shinesTraits     [layers[4]])
    meta["attributes"].append(bottomsTraits    [layers[5]])
    meta["attributes"].append(topsTraits       [layers[6]])

    jsonFile = os.path.join("assets_generated", f"{i}.json")
    with open(jsonFile, "w") as fp:
        json.dump(meta, fp)
