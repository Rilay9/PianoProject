"""Copies the record's pictures into docs/prompts/pictures/u122c/: before (the base, measured by the same walk)
and after (the build), every moment of the walk for one cell per device, and the moments a second cell
changes for its own reason."""
import os
import shutil

ROOT = os.getcwd()
DEST = os.path.join(ROOT, 'docs', 'prompts', 'pictures', 'u122c')
os.makedirs(DEST, exist_ok=True)
ALL = ['rest', 'count-in', 'armed', 'playing', 'paused', 'refused', 'finished']
PICK = [
    ('568x320_100__stack_hcb', ALL),  # phone sideways
    ('342x740_100__stack_hcb', ALL),  # phone upright
    ('1366x1024_100__stack_hcb', ALL),  # tablet
    ('1024x768_100__stack_hcb', ['count-in', 'paused']),  # R7's tablet the app lays out upright: the stage rule
    ('568x320_115__wider_moon', ['count-in', 'refused']),  # the tightest sideways cell: the count, the refusal
]
SOURCES = [('before', os.path.join(ROOT, 'app', 'build', 'u122c', 'shots-base')), ('after', os.path.join(ROOT, 'app', 'build', 'u122c', 'shots-final'))]
copied = 0
missing = []
for prefix, folder in SOURCES:
    for cell, moments in PICK:
        for moment in moments:
            name = f'{prefix}-{cell}-{moment}.png'
            src = os.path.join(folder, name)
            if not os.path.exists(src):
                missing.append(name)
                continue
            shutil.copyfile(src, os.path.join(DEST, name.replace('__', '-').replace('_', '-')))
            copied += 1
print('copied', copied)
print('missing', missing)
