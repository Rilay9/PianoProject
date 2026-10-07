# U122: which commit last wrote each inventoried line (the lane that added a rule), read-only.
import subprocess, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
TARGETS = {
    'app/src/style.css': [961, 966, 979, 983, 985, 986, 1007, 1015, 1016, 1021, 1028, 1029, 1042, 1043, 1057,
                          2561, 2915, 2916, 2917, 2927, 2928, 2935, 2943, 2947, 2954, 2955, 2956, 2965, 2973,
                          2981, 2982, 2984, 2992, 2998, 3007, 3029, 3059, 3081, 3129, 3130, 3131, 3135,
                          6219, 6255, 6256, 6257, 6258, 6259, 6260, 6261, 6262],
    'app/src/ui/screens/ScoreScreen.ts': [164, 167, 1203, 1218, 1450, 1485, 1488, 1494, 1523, 1530, 1545, 1546,
                                          1549, 1554, 1555, 1564, 1566, 1655, 2919, 3567, 4778, 4791, 4925, 4930],
}
for path, lines in TARGETS.items():
    for n in lines:
        out = subprocess.run(['git', 'blame', '-L', f'{n},{n}', '--porcelain', path], cwd=ROOT,
                             capture_output=True, text=True, encoding='utf-8').stdout.splitlines()
        if not out:
            print(f'{path}:{n} ?')
            continue
        sha = out[0].split()[0][:8]
        summary = next((l[8:] for l in out if l.startswith('summary ')), '')
        t = next((int(l.split()[1]) for l in out if l.startswith('author-time ')), 0)
        code = out[-1][1:].strip()
        print(f'{path}:{n} {sha} {datetime.date.fromtimestamp(t)} | {summary[:110]} | {code[:70]}')
