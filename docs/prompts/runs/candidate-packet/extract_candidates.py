#!/usr/bin/env python3
"""
Extract candidate pieces from PDMX archive and app catalogue.
"""

import json
import csv
import sys
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Optional, Dict, List, Tuple

# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LIBRARY = PROJECT_ROOT / "build" / "pdmx" / "library"
CSV_PATH = Path(r"C:\Users\yalir\repos\Piano Stuff\PDMX.csv")
CATALOG_PATH = PROJECT_ROOT / "app" / "public" / "content" / "catalog.json"
OUTPUT_DIR = Path(__file__).resolve().parent
BRIEF_PATH = OUTPUT_DIR.parent / "candidate-packet-brief.md"

# Cache the catalog
_catalog_cache = None


def slug(text: str) -> str:
    """Simple slug: lowercase, replace spaces and special chars with hyphens."""
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"^-|-$", "", s)
    return s[:40]


def score_path(cid: str) -> Path:
    """Get path to score in library."""
    return LIBRARY / cid[2:4].lower() / f"{cid}.mxl"


def read_musicxml(path: Path) -> Optional[str]:
    """Extract XML from .mxl file."""
    if path.suffix.lower() in {".musicxml", ".xml"}:
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return None
    try:
        with zipfile.ZipFile(path) as bundle:
            name = None
            if "META-INF/container.xml" in bundle.namelist():
                root = ET.fromstring(bundle.read("META-INF/container.xml"))
                el = root.find(".//{*}rootfile")
                if el is not None:
                    name = el.get("full-path")
            if name is None or name not in bundle.namelist():
                scores = [
                    n for n in bundle.namelist()
                    if n.lower().endswith((".musicxml", ".xml")) and "container" not in n
                ]
                if not scores:
                    return None
                name = max(scores, key=lambda n: bundle.getinfo(n).file_size)
            return bundle.read(name).decode("utf-8", errors="replace")
    except (zipfile.BadZipFile, KeyError, ET.ParseError, OSError):
        return None


def analyze_xml(text: str) -> Dict:
    """Extract metadata from XML."""
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        return {"parts": 0, "staves": 0, "bars": 0}

    parts = root.findall("{*}part")

    # Count bars in first part
    bars = 0
    if parts:
        bars = len(parts[0].findall("{*}measure"))

    # Count score-part elements
    score_parts = root.findall(".//{*}score-part")

    # Count staves
    staves_count = 0
    for part in parts:
        measures = part.findall("{*}measure")
        if measures:
            first_measure = measures[0]
            staves_el = first_measure.find("{*}attributes/{*}staves")
            if staves_el is not None:
                staves_count = max(staves_count, int(staves_el.text or "1"))
            else:
                staves_count = max(staves_count, 1)

    return {
        "parts": len(score_parts),
        "staves": staves_count,
        "bars": bars
    }


def load_catalog() -> List[Dict]:
    """Load catalogue once and cache it."""
    global _catalog_cache
    if _catalog_cache is not None:
        return _catalog_cache

    try:
        with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
            _catalog_cache = json.load(f)
    except Exception as e:
        print(f"Error reading catalog: {e}", file=sys.stderr)
        _catalog_cache = []

    return _catalog_cache


def search_csv(title: str, limit: int = 3) -> List[Dict]:
    """Search PDMX CSV for matching titles."""
    results = []
    needle_title = title.lower()

    try:
        csv.field_size_limit(10_000_000)
        with CSV_PATH.open("r", encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                if not row:
                    continue

                row_title = f"{row.get('song_name', '')} {row.get('title', '')}".lower()

                if needle_title in row_title:
                    results.append(row)
                    if len(results) >= limit:
                        break
    except Exception as e:
        print(f"Error searching CSV: {e}", file=sys.stderr)

    return results


def find_catalog_by_id(catalog_id: str) -> Optional[Dict]:
    """Find a catalogue item by ID."""
    catalog = load_catalog()
    for item in catalog:
        if item.get('id') == catalog_id:
            return item
    return None


def find_catalog_by_title(title: str, limit: int = 3) -> List[Dict]:
    """Find catalogue items by title."""
    results = []
    needle = title.lower()
    catalog = load_catalog()
    for item in catalog:
        item_title = item.get('title', '').lower()
        if needle in item_title:
            results.append(item)
            if len(results) >= limit:
                break
    return results


def extract_and_save(
    cid: str,
    target_letter: str,
    slug_name: str,
    source_type: str = "archive"
) -> Optional[Tuple[str, Dict]]:
    """Extract XML and save to file, return (filename, metadata)."""

    if source_type == "archive":
        path = score_path(cid)
        if not path.exists():
            return None
    else:  # catalog
        catalog_item = find_catalog_by_id(cid)
        if not catalog_item or not catalog_item.get('file'):
            return None
        file_path = catalog_item['file']
        path = PROJECT_ROOT / "app" / "public" / "content" / file_path
        if not path.exists():
            return None

    xml = read_musicxml(path)
    if not xml:
        return None

    # Analyze the XML
    metadata = analyze_xml(xml)

    # Save the XML
    output_file = OUTPUT_DIR / f"{target_letter}-{slug_name}-{cid}.musicxml"
    output_file.write_text(xml, encoding="utf-8")

    return (output_file.name, metadata)


def main():
    """Main extraction process."""

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Data for manifest
    manifest_rows = []
    found_count = {}
    not_found_count = {}

    # Initialize counters
    for letter in "ABCDEFGHIJKLMNO":
        found_count[letter] = 0
        not_found_count[letter] = 0

    # Read and parse the brief
    with open(BRIEF_PATH, 'r', encoding='utf-8') as f:
        brief_text = f.read()

    # Parse each target section
    pattern = r'^([A-O])\.\s+([^\n]+)$'
    sections = {}
    current_target = None
    current_title = None
    current_lines = []

    for line in brief_text.split('\n'):
        match = re.match(pattern, line)
        if match:
            # Save previous section
            if current_target:
                sections[current_target] = (current_title, current_lines)
            current_target = match.group(1)
            current_title = match.group(2)
            current_lines = []
        elif current_target and line.strip() and line.strip()[0].isdigit():
            current_lines.append(line.strip())

    # Save last section
    if current_target:
        sections[current_target] = (current_title, current_lines)

    # Process each target
    for target_letter in "ABCDEFGHIJKLMNO":
        if target_letter not in sections:
            continue

        target_title, item_lines = sections[target_letter]

        for line in item_lines:
            # Parse: number. description
            match = re.match(r'(\d+)\.\s+(.+)$', line)
            if not match:
                continue

            item_num = match.group(1)
            desc = match.group(2)

            # Extract CID if present
            cid = None
            cid_match = re.search(r',\s*cid\s+`([^`]+)`', desc)
            if cid_match:
                cid = cid_match.group(1)

            # Extract catalogue ID if present
            catalog_id = None
            catalog_match = re.search(r',\s*catalogue\s+`([^`]+)`', desc)
            if catalog_match:
                catalog_id = catalog_match.group(1)

            # Extract title (everything before first comma or paren)
            title_match = re.match(r'^([^(,]+)', desc)
            title = title_match.group(1).strip() if title_match else desc.strip()

            # Create slug
            slug_name = slug(title)

            # Try to find and extract
            result = None
            found = False

            # Try direct CID first
            if cid:
                result = extract_and_save(cid, target_letter, slug_name, "archive")
                if result:
                    filename, metadata = result
                    manifest_rows.append({
                        'target': target_letter,
                        'candidate': title,
                        'artist': '',
                        'id': cid,
                        'filename': filename,
                        'arrangement': '',
                        'parts': metadata['parts'],
                        'staves': metadata['staves'],
                        'bars': metadata['bars'],
                        'why': desc,
                        'notes': ''
                    })
                    found = True
                    found_count[target_letter] += 1
                    print(f"[{target_letter}] Found {title} (CID)")

            # Try catalogue ID
            elif catalog_id:
                result = extract_and_save(catalog_id, target_letter, slug_name, "catalog")
                if result:
                    filename, metadata = result
                    manifest_rows.append({
                        'target': target_letter,
                        'candidate': title,
                        'artist': '',
                        'id': catalog_id,
                        'filename': filename,
                        'arrangement': '',
                        'parts': metadata['parts'],
                        'staves': metadata['staves'],
                        'bars': metadata['bars'],
                        'why': desc,
                        'notes': ''
                    })
                    found = True
                    found_count[target_letter] += 1
                    print(f"[{target_letter}] Found {title} (catalogue)")

            # Try title search in CSV
            else:
                csv_results = search_csv(title, limit=3)
                for csv_row in csv_results:
                    row_cid = Path(csv_row.get("mxl", "")).stem
                    if row_cid:
                        result = extract_and_save(row_cid, target_letter, slug_name, "archive")
                        if result:
                            filename, metadata = result
                            artist = csv_row.get('artist_name', '?')
                            manifest_rows.append({
                                'target': target_letter,
                                'candidate': title,
                                'artist': artist,
                                'id': row_cid,
                                'filename': filename,
                                'arrangement': '',
                                'parts': metadata['parts'],
                                'staves': metadata['staves'],
                                'bars': metadata['bars'],
                                'why': desc,
                                'notes': ''
                            })
                            found = True
                            found_count[target_letter] += 1
                            print(f"[{target_letter}] Found {title} (CSV search)")
                            break

            # Try catalogue title search
            if not found:
                cat_results = find_catalog_by_title(title, limit=3)
                for cat_item in cat_results:
                    cat_id = cat_item.get('id', '')
                    result = extract_and_save(cat_id, target_letter, slug_name, "catalog")
                    if result:
                        filename, metadata = result
                        manifest_rows.append({
                            'target': target_letter,
                            'candidate': title,
                            'artist': '',
                            'id': cat_id,
                            'filename': filename,
                            'arrangement': '',
                            'parts': metadata['parts'],
                            'staves': metadata['staves'],
                            'bars': metadata['bars'],
                            'why': desc,
                            'notes': ''
                        })
                        found = True
                        found_count[target_letter] += 1
                        print(f"[{target_letter}] Found {title} (catalogue search)")
                        break

            # Record NOT FOUND
            if not found:
                manifest_rows.append({
                    'target': target_letter,
                    'candidate': title,
                    'artist': '',
                    'id': 'NOT FOUND',
                    'filename': '',
                    'arrangement': '',
                    'parts': '',
                    'staves': '',
                    'bars': '',
                    'why': desc,
                    'notes': ''
                })
                not_found_count[target_letter] += 1
                print(f"[{target_letter}] NOT FOUND: {title}")

    # Write manifest
    manifest_path = OUTPUT_DIR / "MANIFEST.md"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write("# Candidate Packet Manifest\n\n")
        f.write("| target | candidate | artist/composer | archive/catalog id | filename | arrangement/version | parts/staves | bars | why_candidate | notes |\n")
        f.write("|--------|-----------|-----------------|-------------------|----------|---------------------|--------------|------|---------------|-------|\n")

        for row in manifest_rows:
            parts_staves = ""
            if row['parts'] and row['staves']:
                parts_staves = f"{row['parts']}/{row['staves']}"

            # Escape pipe characters in why column
            why = str(row['why']).replace('|', '\\|')

            f.write(f"| {row['target']} | {row['candidate']} | {row['artist']} | {row['id']} | {row['filename']} | {row['arrangement']} | {parts_staves} | {row['bars']} | {why} | {row['notes']} |\n")

    # Print summary
    print("\n=== EXTRACTION COMPLETE ===")
    print(f"Manifest: {manifest_path}")
    print(f"Total rows in manifest: {len(manifest_rows)}")
    print("\nPer-target summary:")
    for letter in "ABCDEFGHIJKLMNO":
        found = found_count.get(letter, 0)
        not_found = not_found_count.get(letter, 0)
        if found + not_found > 0:
            print(f"  {letter}: {found} found, {not_found} not found")

    # Count XML files written
    xml_files = list(OUTPUT_DIR.glob("*.musicxml"))
    print(f"\nXML files written: {len(xml_files)}")


if __name__ == "__main__":
    main()
