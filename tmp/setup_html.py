import os

# We will create the standalone HTML file that contains lottie and the complete animated duck
html_content = """<!DOCTYPE html>
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
    overflow: hidden;
    background: transparent !important;
  }
  #sticker {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
</head>
<body>
  <div id="sticker"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
  <script src="/duck-donut-data.js"></script>
  <script>
    function loadSticker() {
      if (window.donutStickerData) {
        lottie.loadAnimation({
          container: document.getElementById('sticker'),
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: window.donutStickerData
        });
      }
    }
    if (window.donutStickerData) {
      loadSticker();
    } else {
      window.addEventListener('load', loadSticker);
    }
  </script>
</body>
</html>
"""

with open("public/duck-donut.html", "w") as f:
    f.write(html_content)

print("duck-donut.html created!")
