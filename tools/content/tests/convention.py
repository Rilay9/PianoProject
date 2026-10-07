"""
A generator family's own fingering convention, read as if its row printed it (G30).

Not a test module. Since G30 a family whose contract row says `"printed": "none"` has its fingering taken
off the score by `generate_exercises.print_as_contracted`, which reads the row. The makers still work their
convention out: it is what a source would be checked against, and `confirm_fingering` still refuses an
impossible chord of it. A test of the convention itself reads it inside `convention_printed()`, with every
row read as printing; what reaches the page is held elsewhere (`test_physical_gate`'s families that print
no fingering print none, `test_family_contracts.TestFingeringOnlyWhereSourced`).
"""
from __future__ import annotations

import copy
from contextlib import contextmanager
from typing import Iterator
from unittest import mock

import family_contracts


@contextmanager
def convention_printed() -> Iterator[None]:
    """Inside, `family_contracts.contract` reads every row that prints none as printing; nothing else in the row moves."""
    real = family_contracts.contract

    def contract(family: str) -> dict:
        row = copy.deepcopy(real(family))
        if row["physical"]["fingering"]["printed"] == "none":
            row["physical"]["fingering"]["printed"] = "printed"
        return row

    with mock.patch.object(family_contracts, "contract", contract):
        yield
