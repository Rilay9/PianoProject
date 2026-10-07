"""Runs the lane's Playwright copy (port 5453, two workers) with a title grep, from app/.
Usage: python build/u122c-tools/pw.py <log> <grep or -> <spec> [<spec> ...] [--env KEY=VALUE ...]"""
import os
import re
import subprocess
import sys

args = sys.argv[1:]
env = dict(os.environ)
rest = []
i = 0
while i < len(args):
    if args[i] == '--env':
        k, v = args[i + 1].split('=', 1)
        env[k] = v
        i += 2
    else:
        rest.append(args[i])
        i += 1
log, grep, specs = rest[0], rest[1], rest[2:]
cmd = ['npx.cmd' if os.name == 'nt' else 'npx', 'playwright', 'test', '--config', 'build/u122c/playwright.u122c.config.ts', *specs, '--workers=2']
if grep != '-':
    cmd += ['-g', grep]
with open(log, 'w', encoding='utf-8', errors='replace') as f:
    code = subprocess.call(cmd, cwd=os.path.join(os.getcwd(), 'app'), stdout=f, stderr=subprocess.STDOUT, env=env)
body = open(log, encoding='utf-8', errors='replace').read()
for line in body.splitlines():
    if re.match(r'^\s+(x|✘) ', line) or re.match(r'^\s+\d+ (passed|failed|flaky|skipped|did not run)', line):
        print(line)
print('exit', code)
