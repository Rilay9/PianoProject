"""U119 mutants on app/src/style.css. Usage: python mutant.py apply m1|m2  |  python mutant.py restore
apply: saves the fixed style.css (once) under build/u119/, writes the mutant, prints both hashes.
restore: writes the saved copy back byte for byte and checks the hash."""
import hashlib
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
css = os.path.normpath(os.path.join(here, '..', '..', 'src', 'style.css'))
saved = os.path.join(here, 'style.css.fixed')
sha = lambda b: hashlib.sha256(b).hexdigest()[:16]

CLIP = b'    overflow-x: clip;\r\n  }\r\n\r\n  .screen--score .score-bar__title {'
MUTANTS = {
    # m1: the new clip removed whole (the committed CSS's behaviour).
    'm1': (CLIP, b'  }\r\n\r\n  .screen--score .score-bar__title {'),
    # m2: the clip moved off the group onto the controls beside it.
    'm2': None,
}

if sys.argv[1] == 'apply':
    fixed = open(css, 'rb').read()
    if not os.path.exists(saved):
        open(saved, 'wb').write(fixed)
    fixed = open(saved, 'rb').read()
    name = sys.argv[2]
    assert fixed.count(CLIP) == 1, 'the clip is not where it was'
    if name == 'm1':
        out = fixed.replace(CLIP, MUTANTS['m1'][1], 1)
    elif name == 'm2':
        nf = b'  .screen--score .score-bar > :not(.score-bar__left) {\r\n    flex: none;\r\n  }'
        assert fixed.count(nf) == 1, 'the controls rule is not where it was'
        out = fixed.replace(CLIP, MUTANTS['m1'][1], 1).replace(
            nf, b'  .screen--score .score-bar > :not(.score-bar__left) {\r\n    flex: none;\r\n    overflow: hidden;\r\n  }', 1
        )
    else:
        raise SystemExit('unknown mutant')
    open(css, 'wb').write(out)
    print(f'{name}: fixed {sha(fixed)} -> mutant {sha(out)}')
elif sys.argv[1] == 'restore':
    fixed = open(saved, 'rb').read()
    open(css, 'wb').write(fixed)
    now = open(css, 'rb').read()
    print(f'restored {sha(now)} == saved {sha(fixed)}: {now == fixed}')
