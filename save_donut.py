import json
import re

# Read the HTML content that was given or write it directly
html_content = '''<!DOCTYPE html>
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
  <script src="/game-sticker-data.js"></script>
  <script>
    var stickerData = window.GAME_STICKER_DATA;
    if (stickerData) {
      lottie.loadAnimation({
        container: document.getElementById('sticker'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: stickerData
      });
    } else {
      fetch('/game-sticker.json')
        .then(r => r.json())
        .then(d => {
          lottie.loadAnimation({
            container: document.getElementById('sticker'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: d
          });
        });
    }
  </script>
</body>
</html>'''

with open('public/sticker-donut.html', 'w') as f:
    f.write(html_content)

print("Saved public/sticker-donut.html")
