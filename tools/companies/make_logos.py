"""Логотипы компаний спикеров для карточек → assets/companies/*.png (прозрачный фон, высота до 200 px).

Источники:
  dominos.svg   https://commons.wikimedia.org/wiki/File:Domino's_pizza_logo.svg  – скачать в каталог исходников
  The Coca-Cola Company – файл клиента KO-LOGO-_Black.png (прислан 27.11 в «Правках по сайту»), лежит рядом: tools/companies/src/.
                Логотип чёрный, клиент просил НЕ перекрашивать.
CCI Kazakhstan берётся готовый: assets/logo/cci-color.png.

SVG растрируются через headless Chrome. Нужен Pillow.

Запуск: python -I make_logos.py <каталог с исходниками> <рабочий каталог> <assets/companies>
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image

src, work, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
own = Path(__file__).resolve().parent / "src"
work.mkdir(parents=True, exist_ok=True)
out.mkdir(parents=True, exist_ok=True)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
H = 200


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


res = {
    "dominos": fit(raster("dominos")),
    "tccc": fit(Image.open(own / "KO-LOGO-_Black.png").convert("RGBA")),
}
for name, im in res.items():
    im.save(out / (name + ".png"), optimize=True)
    print(name, im.size)
