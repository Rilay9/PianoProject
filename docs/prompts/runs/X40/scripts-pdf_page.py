"""Read-only: decode the CCITT G4 page images of a scanned PDF into PNG files (X40 item 1)."""
import io
import re
import struct
import sys

from PIL import Image

pdf = open(sys.argv[1], 'rb').read()
out = sys.argv[2]
objs = {}
for m in re.finditer(rb'(\d+) 0 obj', pdf):
    objs[int(m.group(1))] = m.start()
n = 0
for m in re.finditer(rb'/Subtype\s*/Image', pdf):
    start = pdf.rfind(b'<<', 0, m.start())
    dict_end = pdf.find(b'stream', m.start())
    head = pdf[start:dict_end]
    w = int(re.search(rb'/Width (\d+)', head).group(1))
    h = int(re.search(rb'/Height (\d+)', head).group(1))
    k = re.search(rb'/K\s*(-?\d+)', head)
    k = int(k.group(1)) if k else 0
    blackis1 = b'/BlackIs1 true' in head
    ln = re.search(rb'/Length (\d+)( 0 R)?', head)
    if ln.group(2):
        o = objs[int(ln.group(1))]
        length = int(re.search(rb'obj\s*(\d+)', pdf[o:o + 40]).group(1))
    else:
        length = int(ln.group(1))
    s = dict_end + len(b'stream')
    if pdf[s:s + 2] == b'\r\n':
        s += 2
    elif pdf[s:s + 1] in (b'\n', b'\r'):
        s += 1
    data = pdf[s:s + length]
    comp = 4 if k < 0 else 3
    photometric = 1 if blackis1 else 0
    if re.search(rb'/Decode \[ ?1 0 ?\]', head):
        photometric = 1 - photometric
    tags = [(256, 4, 1, w), (257, 4, 1, h), (258, 3, 1, 1), (259, 3, 1, comp), (262, 3, 1, photometric),
            (273, 4, 1, 0), (277, 3, 1, 1), (278, 4, 1, h), (279, 4, 1, len(data))]
    ifd_off = 8
    data_off = ifd_off + 2 + len(tags) * 12 + 4
    b = io.BytesIO()
    b.write(b'II*\x00')
    b.write(struct.pack('<I', ifd_off))
    b.write(struct.pack('<H', len(tags)))
    for tag, typ, cnt, val in tags:
        if tag == 273:
            val = data_off
        if typ == 3:
            b.write(struct.pack('<HHIHH', tag, typ, cnt, val, 0))
        else:
            b.write(struct.pack('<HHII', tag, typ, cnt, val))
    b.write(struct.pack('<I', 0))
    b.write(data)
    img = Image.open(io.BytesIO(b.getvalue()))
    img.load()
    n += 1
    grey = img.convert('L')
    grey.resize((w // 4, h // 4)).save(f'{out}-p{n}.png')
    # The top of the page at full resolution: the title, the tempo word and any metronome mark.
    grey.crop((0, 0, w, h // 5)).resize((w // 2, h // 10)).save(f'{out}-p{n}-top.png')
    print(n, w, h, k, blackis1)
