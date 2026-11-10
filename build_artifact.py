#!/usr/bin/env python3
"""Собирает dist/artifact.html: тело страницы + встроенные CSS/JS/данные (без <html>/<head>/<body>),
как требует публикация на claude.ai. Картинки публикуются отдельными файлами (assets/...)."""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
body = html.split("<!--PAGE-START-->")[1].split("<!--PAGE-END-->")[0]
title = re.search(r"<title>(.*?)</title>", html).group(1)
desc = re.search(r'<meta name="description" content="([^"]*)"', html).group(1)
fonts = re.search(r'<link href="(https://fonts.googleapis.com[^"]*)"', html).group(1)
css = (root / "css/style.css").read_text(encoding="utf-8")
data = (root / "data/event.js").read_text(encoding="utf-8")
js = (root / "js/app.js").read_text(encoding="utf-8")
out = f"""<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{desc}">
<link rel="icon" href="assets/logo/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{fonts}" rel="stylesheet">
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
print("dist/artifact.html", len(out.encode()), "bytes")
