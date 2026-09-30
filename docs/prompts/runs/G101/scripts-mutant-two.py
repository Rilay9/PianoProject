"""Mutant m1 on the final CSS: the Library title clamped at two lines again (the brief's mutant)."""
p = 'app/src/style.css'
s = open(p, encoding='utf-8').read()
old = """  #library-list .list-row__title {
    white-space: normal;
    text-overflow: clip;
    overflow-wrap: break-word;
  }"""
new = """  #library-list .list-row__title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    white-space: normal;
  }"""
assert s.count(old) == 1
open(p, 'w', encoding='utf-8', newline='\r\n').write(s.replace(old, new))
print('mutant m1 applied')
