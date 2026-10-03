"""X1 (L113): constructed rung options carry a measurement, as every bundled row does.

Run from `app/`. Each edit checks its own marker; a rerun changes nothing. Line endings kept.
"""
import pathlib

MEASURED_IMPORT = "import { measured } from './helpers/measured';\n"


def splice(path: str, old: str, new: str, anchor: str) -> None:
    p = pathlib.Path(path)
    raw = p.read_bytes()
    crlf = b'\r\n' in raw
    t = raw.decode('utf-8').replace('\r\n', '\n')
    if new in t:
        print(f'{path}: already revised')
        return
    if t.count(old) != 1:
        raise SystemExit(f'{path}: expected one occurrence of the fixture, found {t.count(old)}')
    t = t.replace(old, new)
    if MEASURED_IMPORT not in t:
        if t.count(anchor) != 1:
            raise SystemExit(f'{path}: import anchor not found once')
        t = t.replace(anchor, anchor + MEASURED_IMPORT)
    p.write_bytes((t.replace('\n', '\r\n') if crlf else t).encode('utf-8'))
    print(f'{path}: revised')


splice(
    'tests/unit/sightReadingIsNotAPiece.test.ts',
    "  const song = (id: string): CatalogItem =>\n    ({ id, type: 'song', title: id, level: 1, tracks: ['core'], concepts: [], tags: [], file: `${id}.mxl` }) as unknown as CatalogItem;\n",
    "  // Revised (X1, L113): measured, as every bundled song is. An unmeasured song on a rung's list is refused as\n"
    "  // any automatic offer of it is (`oneGateBoundary.test.ts`), which is not what these cases are about.\n"
    "  const song = (id: string): CatalogItem =>\n    ({ id, type: 'song', title: id, level: 1, tracks: ['core'], concepts: [], tags: [], file: `${id}.mxl`, ...measured([]) }) as unknown as CatalogItem;\n",
    "import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';\n",
)
splice(
    'tests/unit/parallelStrands.test.ts',
    "  const item = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({ id, type: 'song', title: id, level: 8, hands: 'both', tracks: ['classical'], concepts: [], file: `scores/${id}.mxl`, ...over });\n",
    "  // Revised (X1, L113): measured, as every bundled row is. An unmeasured option on a rung's list is refused\n"
    "  // as any automatic offer of it is (`oneGateBoundary.test.ts`).\n"
    "  const item = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({ id, type: 'song', title: id, level: 8, hands: 'both', tracks: ['classical'], concepts: [], file: `scores/${id}.mxl`, ...measured([]), ...over });\n",
    "import type { RungReading, RungStates } from '../../src/evidence/rungState';\n",
)
splice(
    'tests/unit/todayOpensWithItsRung.test.ts',
    "    file: `scores/${id}.mxl`,\n    ...over,\n  } as unknown as CatalogItem;\n}\n",
    "    file: `scores/${id}.mxl`,\n"
    "    // Revised (X1, L113): measured, as every bundled row is. An unmeasured option on a rung's list is refused\n"
    "    // as any automatic offer of it is (`oneGateBoundary.test.ts`), and the card here would be empty.\n"
    "    ...measured([]),\n    ...over,\n  } as unknown as CatalogItem;\n}\n",
    "import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';\n",
)
