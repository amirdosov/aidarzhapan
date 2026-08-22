# -*- coding: utf-8 -*-
"""Готовит фотографии и собирает assets/photos.js из папок assets/photos/<id>/.

Статический хостинг не отдаёт список файлов в папке, поэтому его надо
записать заранее. Кладём снимки в assets/photos/<id>/ и запускаем:

    python tools/photos.py

Что делает скрипт:
  * разворачивает по EXIF и вычищает метаданные (в том числе GPS);
  * ужимает до 1600 px по длинной стороне;
  * переименовывает в 01.jpg, 02.jpg, ...;
  * кладёт превью 240 px в подпапку thumbs/ — их грузят аватар и миниатюры;
  * переписывает assets/photos.js.

Порядок — по имени файла. Первое фото становится аватаром человека.
"""
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PHOTOS = os.path.join(ROOT, "assets", "photos")
OUT = os.path.join(ROOT, "assets", "photos.js")

EXT = (".jpg", ".jpeg", ".png", ".webp", ".avif")
THUMBS = "thumbs"
MAX_FULL = 1600
MAX_THUMB = 240
Q_FULL = 86
Q_THUMB = 78


def natural(name):
    """01.jpg, 2.jpg, 10.jpg — по-человечески, а не 01, 10, 2."""
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r"(\d+)", name)]


def prepare(folder):
    """Приводит снимки к 01.jpg, 02.jpg... и делает превью. Возвращает имена."""
    from PIL import Image, ImageOps

    files = [f for f in os.listdir(folder) if f.lower().endswith(EXT)]
    files.sort(key=natural)
    if not files:
        return []

    tdir = os.path.join(folder, THUMBS)
    if os.path.isdir(tdir):
        for f in os.listdir(tdir):
            os.remove(os.path.join(tdir, f))
    else:
        os.makedirs(tdir)

    staged = []
    for i, f in enumerate(files, 1):
        src = os.path.join(folder, f)
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")

        big = im.copy()
        if max(big.size) > MAX_FULL:
            k = MAX_FULL / float(max(big.size))
            big = big.resize((int(big.width * k), int(big.height * k)), Image.LANCZOS)
        tmp = os.path.join(folder, "__%02d.jpg" % i)
        big.save(tmp, "JPEG", quality=Q_FULL, optimize=True, progressive=True)

        small = im.copy()
        k = MAX_THUMB / float(max(small.size))
        if k < 1:
            small = small.resize((int(small.width * k), int(small.height * k)), Image.LANCZOS)
        small.save(os.path.join(tdir, "%02d.jpg" % i), "JPEG", quality=Q_THUMB, optimize=True)

        os.remove(src)
        staged.append((tmp, "%02d.jpg" % i))

    names = []
    for tmp, final in staged:
        os.rename(tmp, os.path.join(folder, final))
        names.append(final)
    return names


def collect():
    out = {}
    if not os.path.isdir(PHOTOS):
        return out
    for who in sorted(os.listdir(PHOTOS)):
        folder = os.path.join(PHOTOS, who)
        if not os.path.isdir(folder):
            continue
        names = prepare(folder)
        if names:
            out[who] = [{
                "src":   "assets/photos/%s/%s" % (who, n),
                "thumb": "assets/photos/%s/%s/%s" % (who, THUMBS, n),
            } for n in names]
    return out


def main():
    data = collect()
    lines = [
        u"/* Файл создаётся автоматически: python tools/photos.py",
        u"   Руками не правим — правки затрутся при следующем запуске.",
        u"   Порядок фотографий = порядок имён файлов, первое становится аватаром. */",
        u"window.SHEZHIRE_PHOTOS = {",
    ]
    for who in sorted(data):
        lines.append(u'  "%s": [' % who)
        for it in data[who]:
            lines.append(u'    { "src": "%s", "thumb": "%s" },' % (it["src"], it["thumb"]))
        lines.append(u'  ],')
    lines.append(u"};")
    io.open(OUT, "w", encoding="utf-8").write(u"\n".join(lines) + u"\n")

    total = sum(len(v) for v in data.values())
    print("assets/photos.js: %d чел., %d фото" % (len(data), total))
    for who in sorted(data):
        print("  %-12s %d" % (who, len(data[who])))


if __name__ == "__main__":
    main()
