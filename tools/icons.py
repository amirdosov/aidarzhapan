# -*- coding: utf-8 -*-
"""Иконки приложения.

Телефон, сохраняя сайт на экран, спрашивает картинку — и рисует её
на своём фоне, своей формой, своим размером. Отдаём ту же метку, что
стоит в шапке сайта: ствол, три ветви, три узла.

    python tools/icons.py

Кладёт готовое в assets/icons. Пересобирать нужно только если
поменялись цвета или сама метка.
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT  = ROOT / 'assets' / 'icons'

BG   = (12, 20, 24)        # --bg тёмной темы
GOLD = (216, 178, 106)     # --gold

SS = 8                     # рисуем крупнее и ужимаем — так края мягкие


def mark(size, scale):
    """Метка на тёмном поле. scale — доля стороны, занятая деревом.

    Для маскируемой иконки доля меньше: телефон вырезает из квадрата
    круг и обрезает всё, что дальше 40% от центра."""
    S = size * SS
    img = Image.new('RGB', (S, S), BG)
    d = ImageDraw.Draw(img)

    # метка живёт в поле 32×32 — тех же координатах, что и svg в шапке
    box = S * scale
    k = box / 32.0
    ox = (S - box) / 2.0
    oy = (S - box) / 2.0 + box * 0.02      # низ ствола длиннее верха

    def P(x, y):
        return (ox + x * k, oy + y * k)

    w = max(2, int(round(1.7 * k)))        # толщина линии

    def line(x1, y1, x2, y2):
        a, b = P(x1, y1), P(x2, y2)
        d.line([a, b], fill=GOLD, width=w)
        for p in (a, b):                   # круглые концы линий
            d.ellipse([p[0] - w / 2, p[1] - w / 2,
                       p[0] + w / 2, p[1] + w / 2], fill=GOLD)

    def ring(x, y, r):
        # Pillow ведёт обводку внутрь от рамки, svg — по обе стороны
        # от линии: чтобы кольцо осталось кольцом, рамку расширяем.
        c = P(x, y)
        rr = r * k + w / 2.0
        d.ellipse([c[0] - rr, c[1] - rr, c[0] + rr, c[1] + rr],
                  outline=GOLD, width=w)

    def branch(x, y, cx, cy, r):
        """Ветвь до самого кольца, но не внутрь него."""
        dx, dy = cx - x, cy - y
        L = math.hypot(dx, dy)
        gap = r + w / (2.0 * k)
        line(x, y, cx - dx / L * gap, cy - dy / L * gap)

    line(16, 29, 16, 13)                   # ствол
    branch(16, 13, 8, 6.5, 2.2)            # левая ветвь
    branch(16, 13, 24, 6.5, 2.2)           # правая
    branch(16, 13, 16, 3, 2.2)             # средняя
    ring(16, 3, 2.2)
    ring(8, 6.5, 2.2)
    ring(24, 6.5, 2.2)

    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    made = [
        ('icon-192.png',        mark(192, 0.72)),
        ('icon-512.png',        mark(512, 0.72)),
        ('icon-192-mask.png',   mark(192, 0.52)),
        ('icon-512-mask.png',   mark(512, 0.52)),
        ('apple-touch-icon.png', mark(180, 0.70)),
    ]
    for name, img in made:
        img.save(OUT / name, 'PNG', optimize=True)
        print('  ', name, img.size[0])
    print('Готово:', OUT)


if __name__ == '__main__':
    main()
