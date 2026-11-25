"""Логотипы компаний спикеров для карточек → assets/companies/*.png (прозрачный фон, высота до 200 px).

Источники (скачать в один каталог под этими именами):
  dominos.svg      https://commons.wikimedia.org/wiki/File:Domino's_pizza_logo.svg
  cocacola.svg     https://commons.wikimedia.org/wiki/File:Coca-Cola_logo.svg  (для The Coca-Cola Company: обычный логотип узнаётся быстрее надписи с «Company»)
  cci.png          https://en.wikipedia.org/wiki/File:Coca-Cola_İçecek_logo.png
  goodproject.svg  https://goodproject.kz/wp-content/uploads/2022/09/logo.svg  (на сайте он белый – перекрашен в тёмный)
CCI Kazakhstan берётся готовый: assets/logo/cci-color.png.

Красные логотипы Coca-Cola (CCI, Coca-Cola) перекрашены в красный сайта #AF0000 – как и остальные логотипы на странице.
SVG растрируются через headless Chrome. Нужен Pillow.

Запуск: python -I make_logos.py <каталог с исходниками> <рабочий каталог> <assets/companies>
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image

src, work, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
work.mkdir(parents=True, exist_ok=True)
out.mkdir(parents=True, exist_ok=True)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
H = 200
RED = (175, 0, 0)      # #AF0000
INK = (26, 26, 26)


def raster(name):
    """SVG → PNG с прозрачным фоном."""
    page = work / (name + ".html")
    page.write_text('<!doctype html><html><body style="margin:0;background:transparent">'
                    '<img src="%s" style="display:block;height:600px;width:auto"></body></html>' % (src / (name + ".svg")).as_uri(), encoding="utf-8")
    shot = work / (name + ".png")
    subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", "--default-background-color=00000000", "--user-data-dir=" + str(work / "prof"),
                    "--window-size=4200,700", "--screenshot=" + str(shot), page.as_uri()], check=True, capture_output=True, timeout=120)
    return Image.open(shot).convert("RGBA")


def fit(im):
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(box) if box else im
    w, h = im.size
    return im.resize((round(w * H / h), H), Image.LANCZOS) if h > H else im


def mono(im, color):
    """Одноцветный логотип: форма из прозрачности, цвет – заданный."""
    flat = Image.new("RGBA", im.size, color + (255,))
    flat.putalpha(im.getchannel("A"))
    return flat


res = {
    "dominos": fit(raster("dominos")),
    "cocacola": fit(mono(raster("cocacola"), RED)),
    "goodproject": fit(mono(raster("goodproject"), INK)),
    "cci": fit(mono(Image.open(src / "cci.png").convert("RGBA"), RED)),      # в исходнике фон уже прозрачный
}
for name, im in res.items():
    im.save(out / (name + ".png"), optimize=True)
    print(name, im.size)
