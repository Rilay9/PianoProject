"""G101: the catalogue's titles that differ from another only by their ending (siblings).

Two titles are siblings when, compared on their words (lower case, punctuation dropped), one
shares with the other a prefix of at least two words that is at least half of the shorter title's
words, and the two are not the same words. The words after the shared prefix are the ending that
tells them apart. Identical titles are not siblings: nothing in the title tells them apart (their
detail line does). Writes build/g101/siblings.json: every sibling id, its group, its ending.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / 'app' / 'public' / 'content' / 'catalog.json').read_text(encoding='utf-8'))


def words(title: str) -> list[str]:
    return re.sub(r"[^\w\s]", ' ', title.lower()).split()


items = [(item['id'], item['title'], words(item['title'])) for item in catalog]
parent = {i: i for i, _, _ in items}


def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x


ending: dict[str, str] = {}
# Index by the first two words, so only titles that can share a two-word prefix are compared.
by_start = defaultdict(list)
for entry in items:
    if len(entry[2]) >= 2:
        by_start[tuple(entry[2][:2])].append(entry)
for group in by_start.values():
    for a in range(len(group)):
        for b in range(a + 1, len(group)):
            ia, ta, wa = group[a]
            ib, tb, wb = group[b]
            if wa == wb:
                continue
            n = 0
            while n < min(len(wa), len(wb)) and wa[n] == wb[n]:
                n += 1
            if n >= 2 and n * 2 >= min(len(wa), len(wb)):
                parent[find(ia)] = find(ib)
                for i, w in ((ia, wa), (ib, wb)):
                    tail = ' '.join(w[n:]) or '(nothing: the shorter of the pair)'
                    if i not in ending or len(tail) > len(ending[i]):
                        ending[i] = tail

groups = defaultdict(list)
for i in ending:
    groups[find(i)].append(i)
title_of = {i: t for i, t, _ in items}
out = {
    'rule': __doc__.strip().splitlines()[2:6],
    'ids': sorted(ending),
    'groups': sorted(([title_of[i] for i in sorted(g)] for g in groups.values()), key=lambda g: g[0]),
}
(ROOT / 'build' / 'g101' / 'siblings.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'{len(out["ids"])} sibling titles in {len(out["groups"])} groups, of {len(items)}')
longest = sorted(items, key=lambda e: -len(e[1]))[:12]
for i, t, _ in longest:
    print(len(t), i, '|', t)
