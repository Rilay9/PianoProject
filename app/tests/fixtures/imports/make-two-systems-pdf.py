#!/usr/bin/env python3
"""Regenerates tests/fixtures/imports/two-systems.pdf.

Written by hand rather than produced by a tool so the fixture needs no
toolchain and its contents are obvious: two systems, each a pair of five-line
staves joined at the very left edge by a brace. That brace is exactly the
signal `app/src/pdf/systems.ts` reads to decide which staves belong to one
system, so the fixture exercises the real detection path rather than a special
case. The brace sits within the first 4% of the page width because that is the
strip `bridgedAtLeftEdge` looks at.

Run from the app directory:
    python3 tests/fixtures/imports/make-two-systems-pdf.py
"""
from pathlib import Path

W, H = 612, 792
LEFT, RIGHT = 8, 604


def staff(top: int) -> list[int]:
    """Five lines, six points apart, running down from `top`."""
    return [top - 6 * i for i in range(5)]


def main() -> None:
    systems = [(staff(700), staff(650)), (staff(500), staff(450))]

    ops = ["1.4 w", "0 G"]
    for upper, lower in systems:
        for st in (upper, lower):
            for y in st:
                ops.append(f"{LEFT} {y} m {RIGHT} {y} l S")
        ops.append("3 w")
        ops.append(f"{LEFT + 2} {lower[-1]} m {LEFT + 2} {upper[0]} l S")
        ops.append("1.4 w")
    stream = "\n".join(ops).encode()

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] "
            f"/Contents 4 0 R /Resources << >> >>"
        ).encode(),
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for index, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{index} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref}\n%%EOF\n"
    ).encode()

    target = Path(__file__).with_name("two-systems.pdf")
    target.write_bytes(bytes(out))
    print(f"wrote {target} ({len(out)} bytes)")


if __name__ == "__main__":
    main()
