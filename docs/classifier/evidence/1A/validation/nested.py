from common import *
from r_misc import unusual
for i in BYID:
    w = cache(i)
    u = unusual(w)
    if u["nested"] or u["unclosed"]:
        print(i, "nested", u["nested"], "unclosed", u["unclosed"], u["ex"])
        if u["nested"]:
            openby = {}
            for n in sorted(w["notes"], key=lambda n: (n["part"], n["t"])):
                for typ, num in n["tuplets"]:
                    k = (n["part"], n["voice"])
                    o = openby.setdefault(k, {})
                    if typ == "start":
                        if o and num not in o:
                            print("   nested start m", n["m"], "voice", n["voice"], "num", num, "open", {a: float(b) for a, b in o.items()}, "tmod", n["tmod"], "t", float(n["t"]))
                        o[num] = n["t"]
                    else:
                        o.pop(num, None)
