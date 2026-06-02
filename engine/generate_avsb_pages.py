import argparse
import csv
import itertools
import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "tool"


def load_csv(csv_path: Path) -> List[Dict[str, str]]:
    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            normalized = {k.strip(): (v or "").strip() for k, v in row.items()}
            normalized["slug"] = slugify(normalized.get("Name", ""))
            rows.append(normalized)
        return rows


def load_template(template_path: Path) -> Dict:
    with template_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def category_bucket(category: str) -> str:
    category_lower = (category or "").lower()
    if "website builder" in category_lower:
        return "Website Builder"
    if "no-code app builder" in category_lower:
        return "No-code App Builder"
    if "automation" in category_lower:
        return "Automation"
    if "email" in category_lower:
        return "Email Marketing"
    if "e-commerce" in category_lower:
        return "E-commerce"
    return category.strip() or "Software"


def estimate_best_for(row: Dict[str, str]) -> str:
    category = row.get("Category", "this category")
    name = row.get("Name", "This tool")
    commission = row.get("Commission", "its affiliate terms")
    return f"{name} is a strong fit for users evaluating {category.lower()} options and affiliates who care about {commission.lower()}."


def estimate_winner_hint(a: Dict[str, str], b: Dict[str, str]) -> str:
    a_comm = a.get("Commission", "")
    b_comm = b.get("Commission", "")
    if "50%" in a_comm and "50%" not in b_comm:
        return a["Name"]
    if "50%" in b_comm and "50%" not in a_comm:
        return b["Name"]
    if "lifetime" in a_comm.lower() and "lifetime" not in b_comm.lower():
        return a["Name"]
    if "lifetime" in b_comm.lower() and "lifetime" not in a_comm.lower():
        return b["Name"]
    return "Tie / depends on use case"


def quick_take(a: Dict[str, str], b: Dict[str, str], bucket: str) -> str:
    return (
        f"Choose {a['Name']} if you prefer a {a['Category'].lower()} angle; "
        f"choose {b['Name']} if you prefer a {b['Category'].lower()} angle. "
        f"Both sit in the broader {bucket.lower()} comparison set."
    )


def fill_placeholders(obj, replacements: Dict[str, str]):
    if isinstance(obj, dict):
        return {k: fill_placeholders(v, replacements) for k, v in obj.items()}
    if isinstance(obj, list):
        return [fill_placeholders(item, replacements) for item in obj]
    if isinstance(obj, str):
        result = obj
        for key, value in replacements.items():
            result = result.replace(f"{{{{{key}}}}}", value)
        return result
    return obj


def make_related_links(all_pairs: List[Dict], current_pair: Dict, limit: int = 3) -> List[Dict[str, str]]:
    links = []
    current_bucket = current_pair["comparison_category"]
    current_slugs = {current_pair["tool_a_slug"], current_pair["tool_b_slug"]}
    for pair in all_pairs:
        if pair["comparison_category"] != current_bucket:
            continue
        pair_slugs = {pair["tool_a_slug"], pair["tool_b_slug"]}
        if pair_slugs == current_slugs:
            continue
        if current_slugs.intersection(pair_slugs):
            links.append(
                {
                    "label": f"{pair['tool_a_name']} vs {pair['tool_b_name']}",
                    "href": pair["url_path"],
                }
            )
        if len(links) >= limit:
            break
    return links


def build_pair_records(rows: List[Dict[str, str]], mode: str) -> List[Dict[str, str]]:
    pairs = []
    for a, b in itertools.combinations(rows, 2):
        bucket_a = category_bucket(a.get("Category", ""))
        bucket_b = category_bucket(b.get("Category", ""))
        if mode == "same-category" and bucket_a != bucket_b:
            continue
        comparison_category = bucket_a if bucket_a == bucket_b else f"{bucket_a} vs {bucket_b}"
        record = {
            "tool_a_name": a["Name"],
            "tool_a_slug": a["slug"],
            "tool_a_category": a["Category"],
            "tool_a_commission": a["Commission"],
            "tool_a_link": a["Link"],
            "tool_b_name": b["Name"],
            "tool_b_slug": b["slug"],
            "tool_b_category": b["Category"],
            "tool_b_commission": b["Commission"],
            "tool_b_link": b["Link"],
            "comparison_category": comparison_category,
            "comparison_angle": "affiliate-program comparison",
            "winner_hint": estimate_winner_hint(a, b),
            "tool_a_best_for": estimate_best_for(a),
            "tool_b_best_for": estimate_best_for(b),
            "quick_take": quick_take(a, b, comparison_category),
            "url_path": f"/compare/{a['slug']}-vs-{b['slug']}",
        }
        pairs.append(record)
    return pairs


def generate_specs(csv_path: Path, template_path: Path, output_dir: Path, mode: str, limit: int | None):
    rows = load_csv(csv_path)
    template = load_template(template_path)
    output_dir.mkdir(parents=True, exist_ok=True)

    pair_records = build_pair_records(rows, mode)
    if limit is not None:
        pair_records = pair_records[:limit]

    generated_at = datetime.now(timezone.utc).isoformat()
    specs = []

    for record in pair_records:
        replacements = deepcopy(record)
        replacements["source_csv"] = str(csv_path)
        replacements["generated_at"] = generated_at
        spec = fill_placeholders(template, replacements)
        spec["sections"][-1]["data"]["links"] = []
        specs.append(spec)

    pair_lookup = []
    for spec in specs:
        pair_lookup.append(
            {
                "tool_a_name": spec["entities"]["tool_a"]["name"],
                "tool_a_slug": spec["entities"]["tool_a"]["slug"],
                "tool_b_name": spec["entities"]["tool_b"]["name"],
                "tool_b_slug": spec["entities"]["tool_b"]["slug"],
                "comparison_category": spec["hero"]["badges"][0],
                "url_path": spec["url_path"],
            }
        )

    for spec, pair in zip(specs, pair_lookup):
        spec["sections"][-1]["data"]["links"] = make_related_links(pair_lookup, pair)
        file_name = f"{spec['page_key']}.json"
        with (output_dir / file_name).open("w", encoding="utf-8") as f:
            json.dump(spec, f, ensure_ascii=False, indent=2)

    manifest = {
        "source_csv": str(csv_path),
        "template": str(template_path),
        "mode": mode,
        "generated_at": generated_at,
        "page_count": len(specs),
        "pages": [
            {
                "page_key": spec["page_key"],
                "url_path": spec["url_path"],
                "title": spec["seo"]["title"],
                "file": f"{spec['page_key']}.json",
            }
            for spec in specs
        ],
    }
    with (output_dir / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(json.dumps({"generated": len(specs), "output_dir": str(output_dir)}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate A vs B pSEO page specs from a CSV file.")
    parser.add_argument("--csv", required=True, help="Path to input CSV")
    parser.add_argument("--template", default="pseo_avsb_engine/page_spec_template.json", help="Path to JSON template")
    parser.add_argument("--output-dir", default="pseo_avsb_engine/output", help="Directory to store generated JSON files")
    parser.add_argument("--mode", choices=["same-category", "all"], default="same-category", help="How to pair tools")
    parser.add_argument("--limit", type=int, default=None, help="Optional limit on generated pages")
    args = parser.parse_args()

    generate_specs(
        csv_path=Path(args.csv),
        template_path=Path(args.template),
        output_dir=Path(args.output_dir),
        mode=args.mode,
        limit=args.limit,
    )
