# G2a: the ladder case's helper took `undefined` for "no composition", which a default parameter
# swallows (an explicit undefined argument takes the default). Switched to `null`. Run once from the
# worktree root, before the red run; kept as it was run.
p='app/tests/unit/masteryLadder.test.ts'
s=open(p,encoding='utf-8').read()
a="composition: typeof ANH_113 | undefined = ANH_113): Evidence =>"
b="composition: typeof ANH_113 | null = ANH_113): Evidence =>"
assert s.count(a)==1; s=s.replace(a,b)
a2="...(composition ? { composition } : {}) });"
assert s.count(a2)==1
s=s.replace(a2,"...(composition === null ? {} : { composition }) });")
for old in ["relatedRead(day(2), {}, undefined)","relatedRead(day(2), BADLY, undefined)","relatedRead(day(3), BADLY, undefined)"]:
    assert s.count(old)==1, old
    s=s.replace(old, old.replace("undefined","null"))
open(p,'w',encoding='utf-8',newline='').write(s)
