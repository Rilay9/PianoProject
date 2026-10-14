#!/usr/bin/env python3
"""Makes web/tests/fixtures/pdf/jpx.pdf: one page stored as a JPEG 2000 image, the way many scanners save pages
(test review 2026-10-14, P7: no fixture had one, and pdf.js draws such a page blank without its JPEG 2000 decoder).

The page: two grand staves (five lines each, a brace where the staves start) with a few note heads, drawn as a
greyscale image at 144 dpi on a 612x792 pt page, written as a JPXDecode image XObject in a hand-written PDF so the
file needs no toolchain but Pillow (built with OpenJPEG) and its contents are obvious.

Run from the web directory:
    python3 tests/fixtures/pdf/make-jpx-pdf.py
"""
import io
from pathlib import Path

from PIL import Image, ImageDraw

SCALE = 2  # 144 dpi
W, H = 612 * SCALE, 792 * SCALE
LEFT, RIGHT = 60 * SCALE, 560 * SCALE
SPACING = 8 * SCALE
# Top line of each staff (pt from the top): two grand staves.
STAVES = [120, 180, 420, 480]


def page() -> Image.Image:
    img = Image.new('L', (W, H), 255)
    d = ImageDraw.Draw(img)
    for top in STAVES:
        for line in range(5):
            y = top * SCALE + line * SPACING
            d.rectangle([LEFT, y, RIGHT, y + 1], fill=0)
    for first, second in ((0, 1), (2, 3)):
        y0, y1 = STAVES[first] * SCALE, STAVES[second] * SCALE + 4 * SPACING
        d.rectangle([LEFT - 8, y0, LEFT - 3, y1], fill=0)  # the brace's stroke where the staves start
        for x in range(LEFT + 60, RIGHT - 20, 70):  # note heads on lines and spaces
            for top in (STAVES[first], STAVES[second]):
                y = top * SCALE + ((x // 70) % 5) * SPACING
                d.ellipse([x, y - SPACING // 2, x + SPACING + 4, y + SPACING // 2], fill=0)
    return img


def jpx(img: Image.Image) -> bytes:
    out = io.BytesIO()
    img.save(out, format='JPEG2000', irreversible=False)
    return out.getvalue()


def pdf(image: bytes) -> bytes:
    content = b'q 612 0 0 792 0 0 cm /Im0 Do Q'
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>',
        b'<< /Length %d >>\nstream\n' % len(content) + content + b'\nendstream',
        b'<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /JPXDecode /Length %d >>\nstream\n'
        % (W, H, len(image)) + image + b'\nendstream',
    ]
    body = bytearray(b'%PDF-1.5\n%\xe2\xe3\xcf\xd3\n')
    offsets = []
    for n, obj in enumerate(objects, start=1):
        offsets.append(len(body))
        body += b'%d 0 obj\n' % n + obj + b'\nendobj\n'
    xref = len(body)
    body += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objects) + 1)
    for off in offsets:
        body += b'%010d 00000 n \n' % off
    body += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objects) + 1, xref)
    return bytes(body)


if __name__ == '__main__':
    target = Path(__file__).with_name('jpx.pdf')
    target.write_bytes(pdf(jpx(page())))
    print(f'wrote {target} ({target.stat().st_size} bytes)')
