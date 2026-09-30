"""U105a, not for app/: the two lessonClaimsAboutApp claims that fail on a CRLF checkout, read against
the LF form of the changed files (the form git commits). Run from the worktree root."""
import pathlib
import re

css = pathlib.Path("app/src/style.css").read_bytes().decode("utf-8").replace("\r\n", "\n")
screen = pathlib.Path("app/src/ui/screens/ScoreScreen.ts").read_bytes().decode("utf-8").replace("\r\n", "\n")
shown = (re.search(r"\.score-stage--blind \.score-countin,[\s\S]*?\{", css) or [""])[0]
four_seven = (
    ".score-stage--blind {\n  visibility: hidden;\n}" in css
    and ".score-stage--blind .score-buffer" in css
    and ".score-countin" in shown
    and ".score-beat" in shown
    and ".score-cursor" not in shown
)
blues_three = "menuRow(\n    'Rhythm only'" in screen
print(f"4.7 holds on the LF form of style.css: {four_seven}")
print(f"blues.3 holds on the LF form of ScoreScreen.ts: {blues_three}")
