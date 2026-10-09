"""Which fields of a generated catalogue entry state its family / layout (item.format, generated items)."""
import json
from ids import CAT
by = {x["id"]: x for x in CAT}
for i in ["exercise.montuno.a.2note.bossa", "exercise.ii-v-i.a.rootless", "exercise.clave.bossa"]:
    x = by[i]
    print(i, {k: x.get(k) for k in ("type", "hands", "tags", "concepts", "variantOf", "variantLabel", "family", "recipe")})
    print("   provenance.generator:", json.dumps((x.get("provenance") or {}).get("generator")))
    print("   keys:", sorted(x.keys()))
