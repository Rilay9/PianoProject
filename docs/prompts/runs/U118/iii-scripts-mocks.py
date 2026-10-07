"""U118: the Score screen's renderer stand-ins in the unit tests gain `placeSlots`, which the screen now calls
when its chrome folds. Idempotent; keeps each file's line endings."""
from pathlib import Path

FILES = [
    "evidenceVersion.test.ts",
    "feedbackFromMeasurements.test.ts",
    "firstContactOnTheScore.test.ts",
    "observationsFromRun.test.ts",
    "projectOnTheFinishSheet.test.ts",
    "scoreMidRunSettings.test.ts",
    "scoreSheetRows.test.ts",
    "scoreSheetsCloseAndPlayStartsSound.test.ts",
    "scoreSummaryTruth.test.ts",
    "scoreTourRoute.test.ts",
    "transferOfferOnTheRun.test.ts",
    "scoreSidePanelDecision.test.ts",
]
OLD = "      setRunning(): void {}\n"
NEW = "      setRunning(): void {}\n      placeSlots(): void {}\n"
for name in FILES:
    p = Path("app/tests/unit") / name
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    if "placeSlots(): void {}" in text:
        print(f"{name}: already")
        continue
    assert text.count(OLD) == 1, f"{name}: {text.count(OLD)}"
    text = text.replace(OLD, NEW)
    p.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    print(f"{name}: added")
