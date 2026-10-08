import json
import re

# We will read the HTML content from the python script directly with the exact data provided by user
html_text = """<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: transparent !important;
  }
  #sticker {
    width: 90vw;
    height: 90vw;
    max-width: 500px;
    max-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
</style>
</head>
<body>
  <div id="sticker"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
  <script>
"""

# Let's save the HTML file provided by the user to public/duck-muscle-sticker.html
