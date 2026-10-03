"""Report every measured demand, rung-claim and pin change; write no source files.

Run from the repository root with before/after catalog snapshots made by the
orchestrator. Suggestions are data for review, never automatically accepted pins.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / 'tools' / 'content'))
import claims  # noqa: E402


def reading(demand: str) -> str:
    return {
        'clef.bass': 'clef in force, including one-staff bass and changes',
        'pitch.ledger': 'ledger position relative to the clef in force',
        'key.signature': 'key in force at the note',
        'pitch.chromatic': 'written pitch against the key in force',
        'texture.walking-bass': 'simple-quarter beat grid, held tune and eligible-bar share',
        'texture.left-hand-pattern': 'held tune and eligible-bar share',
    }.get(demand, 'unexpected: inspect before any repin')


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('before', type=Path)
    p.add_argument('after', type=Path)
    p.add_argument('curriculum', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    before = json.loads(args.before.read_text(encoding='utf-8'))
    after = json.loads(args.after.read_text(encoding='utf-8'))
    curriculum = json.loads(args.curriculum.read_text(encoding='utf-8'))
    old, new = ({row['id']: row for row in rows} for rows in (before, after))
    changes = []
    for item in sorted(old.keys() | new.keys()):
        a, b = old.get(item, {}), new.get(item, {})
        ad, bd = a.get('demands'), b.get('demands')
        if not isinstance(ad, list) or not isinstance(bd, list):
            if ad != bd:
                changes.append({'item': item, 'before': ad, 'after': bd, 'why': 'measurement availability changed; inspect'})
            continue
        ae = set((a.get('measurement') or {}).get('established', []))
        be = set((b.get('measurement') or {}).get('established', []))
        for demand in sorted(set(ad) ^ set(bd) | ae ^ be):
            changes.append({'item': item, 'demand': demand,
                            'before': {'present': demand in ad, 'established': demand in ae},
                            'after': {'present': demand in bd, 'established': demand in be},
                            'why': reading(demand)})
    reports = [claims.rung_claims(rows, curriculum) for rows in (before, after)]
    indexed = [{(r['rung'], c['id']): c for r in report['rungs'] for c in r['claims']} for report in reports]
    rung_changes = []
    losses = []
    for key in sorted(indexed[0].keys() | indexed[1].keys()):
        a, b = (table.get(key, {}) for table in indexed)
        counts = [a.get('established', 0), b.get('established', 0)]
        if counts[0] != counts[1]:
            row = {'rung': key[0], 'conceptDemand': key[1], 'beforeOptions': counts[0], 'afterOptions': counts[1], 'why': reading(key[1])}
            rung_changes.append(row)
            if counts[0] > 0 and counts[1] == 0:
                losses.append(row)
    fixture_dir = ROOT / 'tools' / 'content' / 'tests' / 'fixtures'
    bridge = json.loads((fixture_dir / 'bridge_regression.json').read_text(encoding='utf-8'))
    bridge_changes = []
    for pin in bridge['items']:
        actual = new.get(pin['id'], {}).get('demands')
        if actual != pin['demands']:
            bridge_changes.append({'item': pin['id'], 'before': pin['demands'], 'after': actual,
                                   'readings': {d: reading(d) for d in sorted(set(pin['demands']) ^ set(actual or []))}})
    untaught = [{(r['family'], r['rung'], r['demand']): r for r in report['generatedUntaught']} for report in reports]
    untaught_changes = [{'family': k[0], 'rung': k[1], 'demand': k[2],
                         'before': untaught[0].get(k, {}).get('items', 0),
                         'after': untaught[1].get(k, {}).get('items', 0), 'why': reading(k[2])}
                        for k in sorted(untaught[0].keys() | untaught[1].keys())
                        if untaught[0].get(k) != untaught[1].get(k)]
    result = {'itemChanges': changes, 'rungClaimChanges': rung_changes,
              'bridgePinChanges': bridge_changes, 'untaughtChanges': untaught_changes,
              'suggestedUntaughtRows': reports[1]['generatedUntaught'],
              'STOP_lostClaims': losses,
              'missingAfterItems': sorted(old.keys() - new.keys())}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(f'{len(changes)} item demand/establishment changes; {len(rung_changes)} rung claim changes; '
          f'{len(bridge_changes)} bridge pins; {len(untaught_changes)} untaught combinations; {len(losses)} lost claims')
    return 1 if losses or result['missingAfterItems'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
