#!/usr/bin/env python3
"""Собирает dist/artifact.html: тело страницы + встроенные CSS/JS/данные (без <html>/<head>/<body>),
как требует публикация на claude.ai. Картинки публикуются отдельными файлами (assets/...)."""
import re, base64, pathlib
root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
body = html.split("<!--PAGE-START-->")[1].split("<!--PAGE-END-->")[0]
title = re.search(r"<title>(.*?)</title>", html).group(1)
desc = re.search(r'<meta name="description" content="([^"]*)"', html).group(1)
css = (root / "css/style.css").read_text(encoding="utf-8")
# на claude.ai сторонние шрифты грузятся только встроенными: woff2 → data URI
def _inline_font(m):
    data = base64.b64encode((root / "assets/fonts" / m.group(1)).read_bytes()).decode()
    return f'url("data:font/woff2;base64,{data}")'
css = re.sub(r'url\("\.\./assets/fonts/([^"]+)"\)', _inline_font, css)
css = css.replace('url("../assets/', 'url("assets/')   # CSS встраивается в страницу: пути считаются от неё
data = (root / "data/event.js").read_text(encoding="utf-8")
js = (root / "js/app.js").read_text(encoding="utf-8")
out = f"""<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{desc}">
<link rel="icon" href="assets/logo/favicon.png" type="image/png">
<style>
{css}
</style>
{body}
<script>
{data}
</script>
<script>
{js}
</script>
"""
(root / "dist/artifact.html").write_text(out, encoding="utf-8")

# вторая страница — банкетное меню: самостоятельный HTML со встроенными стилями и скриптами
menu_src = (root / "menu.html").read_text(encoding="utf-8")
menu_body = menu_src.split("<!--MENU-START-->")[1].split("<!--MENU-END-->")[0]
menu_js = (root / "js/menu.js").read_text(encoding="utf-8")
menu_out = f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Банкетное меню</title>
<link rel="icon" href="assets/logo/favicon.png" type="image/png">
<style>
{css}
</style>
</head>
<body>
{menu_body}
<script>
{data}
</script>
<script>
{menu_js}
</script>
</body>
</html>
"""
(root / "dist/menu.html").write_text(menu_out, encoding="utf-8")
print("dist/menu.html", len(menu_out.encode()), "bytes")
print("dist/artifact.html", len(out.encode()), "bytes")
