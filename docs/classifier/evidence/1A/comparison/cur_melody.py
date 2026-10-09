"""The current texture.melody-location detector, as the chunk-1 validator implemented it (validation/r_melody.py, called unchanged).

`bars(path_or_id, ...)` returns {bar: (rule, hand) | None} exactly as r_melody.melody does: rules 1 (with the accompaniment guard),
2 and 3; None = UNKNOWN (rule 4). The validator reads a catalogue id; here a synthetic entry is added to its id table for a
score file that is not in the catalogue (the POP909 and Mozart ground-truth scores), and `cache` (the raw MusicXML walk, which
supplies only "has chord symbols or lyrics" to rule 3) is replaced by an empty answer for those.
"""
from mel_common import *

load_validators()
import common            # noqa: E402  (validators', unchanged)
import r_melody as RM    # noqa: E402
import score as S        # noqa: E402

_real_cache = RM.cache


def _empty_cache(i):
    return {"harm": [], "notes": [{"lyrics": None}]}


def bars_for_file(item_id, path, hands="both", guard=True):
    """Run the validator's per-bar rules on a MusicXML file outside the catalogue."""
    common.BYID[item_id] = {"id": item_id, "file": str(Path(path).resolve()), "hands": hands}
    RM.cache = _empty_cache
    try:
        return RM.melody(item_id, guard)
    finally:
        RM.cache = _real_cache
        del common.BYID[item_id]


def bars_for_catalogue(item_id, guard=True):
    RM.cache = _real_cache
    return RM.melody(item_id, guard)
