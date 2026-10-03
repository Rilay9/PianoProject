"""The freeze's own spread and the history finding, from the reruns.

v1..v3: the three cells where one candidate's clean run froze smaller (667x375 t100 stack moon, 700x350 t100
wider moon, 780x360 t100 stack moon), every candidate, three clean runs each, beside the chain's run (r-side).
h1..h3: the five (cell, candidate) runs that froze smaller after the at-rest refusals on the same page,
three times each with the first pass's probe, beside the clean run (r-side) and the first pass (history/f-side).
"""
import glob
import json
import os
from collections import defaultdict

base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')


def stave(path, state='run-frozen'):
    try:
        d = json.load(open(path, encoding='utf-8'))
    except FileNotFoundError:
        return None
    v = d.get(state)
    if not isinstance(v, dict) or 'glass' not in v:
        return None
    return v['glass']['stavePx']


print('# The freeze\'s own spread: run-frozen five-line stave (px), the chain\'s run then three reruns')
for cell in ('667x375-t100-stack-moon', '700x350-t100-wider-moon', '780x360-t100-stack-moon'):
    for c in ('c1', 'c2', 'c3', 'c4', 'c5', 'c6'):
        vals = [stave(os.path.join(base, f"r-side-sideways-{c}-{cell}.json"))] + [stave(os.path.join(base, f"v{i}-sideways-{c}-{cell}.json")) for i in (1, 2, 3)]
        print(f"  {cell} {c}: {vals}")
print()
print('# History: after the at-rest refusals on the same page (first pass, then three reruns) against the clean run')
for c, cell in (('c4', '568x320-t100-wider-moon'), ('c5', '568x320-t100-wider-moon'), ('c1', '568x320-t115-stack-moon'), ('c5', '568x320-t115-wider-moon'), ('c5', '640x360-t115-stack-moon')):
    first = stave(os.path.join(base, 'history', f"f-side-sideways-{c}-{cell}.json"))
    again = [stave(os.path.join(base, f"h{i}-sideways-{c}-{cell}.json")) for i in (1, 2, 3)]
    clean = stave(os.path.join(base, f"r-side-sideways-{c}-{cell}.json"))
    print(f"  {cell} {c}: after refusals {[first] + again} | clean {clean}")
