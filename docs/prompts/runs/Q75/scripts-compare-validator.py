"""
The claim rule's findings on one built catalogue under the committed code (HEAD's claims.py and
validate.py, loaded from git) and under the working tree, side by side: `concept_claim_findings`
and `rung_claims_warning`, the two things Q75 changes in the validator. Read-only.

Usage: python scripts-compare-validator.py <content dir>
"""
import importlib.util
import json
import subprocess
import sys
import types
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
TOOLS = REPO / "tools" / "content"
sys.path.insert(0, str(TOOLS))
content = Path(sys.argv[1])
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))


def head_module(name: str) -> types.ModuleType:
    source = subprocess.run(["git", "show", f"HEAD:tools/content/{name}.py"], cwd=REPO, capture_output=True,
                            text=True, encoding="utf-8", check=True).stdout
    module = types.ModuleType(name)
    module.__file__ = str(TOOLS / f"{name}.py")
    sys.modules[name] = module
    exec(compile(source, module.__file__, "exec"), module.__dict__)
    return module


def tree_module(name: str) -> types.ModuleType:
    spec = importlib.util.spec_from_file_location(name, TOOLS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def findings(label: str, loader) -> list[str]:
    for name in ("claims", "validate"):
        sys.modules.pop(name, None)
    loader("claims")
    validate = loader("validate")
    errors, warnings = validate.concept_claim_findings(catalog, curriculum)
    lines = [f"== {label}", f"errors ({len(errors)}):"] + [f"  {e}" for e in errors]
    lines += [f"warnings ({len(warnings)}):"] + [f"  {w}" for w in warnings]
    lines += ["count line:", f"  {validate.rung_claims_warning(catalog, curriculum)}"]
    return lines


head = findings("HEAD (committed)", head_module)
tree = findings("working tree (Q75)", tree_module)
print(f"content: {content}\n")
print("\n".join(head))
print()
print("\n".join(tree))
