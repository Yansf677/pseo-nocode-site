import argparse
import csv
import itertools
import json
import os
import re
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

DEFAULT_AZURE_API_VERSION = "2024-02-01"
DEFAULT_AZURE_ENDPOINT = "https://aidp-i18ntt-sg.byteintl.net/api/modelhub/online/v2/crawl"
DEFAULT_AZURE_FALLBACK_ENDPOINT = "https://aidp-i18ntt-sg.tiktok-row.net/api/modelhub/online/v2/crawl"
DEFAULT_AZURE_MODEL = "gpt-5-mini-2025-08-07"
DEFAULT_MAX_TOKENS = 3000
DEFAULT_REQUEST_TIMEOUT = 60

PROMPT_TEMPLATE = (
    "You are generating unique, conversion-oriented comparison copy for a programmatic SEO page comparing two affiliate tools.\n"
    "Return JSON only. No markdown fences. No extra commentary. All values should be strings or lists of strings as specified.\n\n"
    "Tool A: {tool_a_name} ({tool_a_category})\n"
    "Tool B: {tool_b_name} ({tool_b_category})\n\n"
    "Required JSON structure:\n"
    "{{\n"
    "  \"winner_hint\": \"short phrase\",\n"
    "  \"best_for_a\": \"sentence\",\n"
    "  \"best_for_b\": \"sentence\",\n"
    "  \"quick_take\": \"paragraph\",\n"
    "  \"verdict\": {{ \"headline\": \"string\", \"summary\": \"string\" }},\n"
    "  \"intro\": [\"para1\", \"para2\"],\n"
    "  \"pros_cons\": {{\n"
    "    \"tool_a_pros\": [\"string\", \"string\"],\n"
    "    \"tool_a_cons\": [\"string\", \"string\"],\n"
    "    \"tool_b_pros\": [\"string\", \"string\"],\n"
    "    \"tool_b_cons\": [\"string\", \"string\"]\n"
    "  }},\n"
    "  \"highlights\": {{ \"tool_a\": [\"string\"], \"tool_b\": [\"string\"] }},\n"
    "  \"comparison_rows\": [ {{ \"dimension\": \"string\", \"tool_a\": \"string\", \"tool_b\": \"string\" }} ],\n"
    "  \"faq\": [ {{ \"question\": \"string\", \"answer\": \"string\" }} ],\n"
    "  \"seo\": {{ \"title\": \"string\", \"meta_description\": \"string\" }}\n"
    "}}"
)


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


def load_template(template_path: Path) -> Dict[str, Any]:
    with template_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def category_bucket(category: str) -> str:
    lowered = (category or "").lower()
    if "website builder" in lowered:
        return "Website Builder"
    if "no-code app builder" in lowered:
        return "No-code App Builder"
    if "automation" in lowered:
        return "Automation"
    if "email" in lowered:
        return "Email Marketing"
    if "e-commerce" in lowered:
        return "E-commerce"
    return category.strip() or "Software"


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def commission_profile(commission: str) -> Dict[str, str]:
    lowered = (commission or "").lower()
    if "lifetime" in lowered and "recurring" in lowered:
        return {"payout_model": "Recurring lifetime payouts", "affiliate_hook": "long-term recurring revenue"}
    if "recurring" in lowered:
        return {"payout_model": "Recurring payouts", "affiliate_hook": "repeat commissions over time"}
    if "one-time" in lowered or "bounty" in lowered or "per sale" in lowered:
        return {"payout_model": "One-time payouts", "affiliate_hook": "higher upfront payout per conversion"}
    return {"payout_model": "Mixed payout terms", "affiliate_hook": "partner economics"}


def estimate_best_for(row: Dict[str, str]) -> str:
    profile = commission_profile(row.get("Commission", ""))
    category = (row.get("Category") or "software").lower()
    name = row.get("Name", "This tool")
    hook = profile["affiliate_hook"]
    return f"{name} suits teams comparing {category} options and affiliate-focused operators who care about {hook}."


def estimate_winner_hint(a: Dict[str, str], b: Dict[str, str]) -> str:
    a_name = a["Name"]
    b_name = b["Name"]
    a_comm = (a.get("Commission") or "").lower()
    b_comm = (b.get("Commission") or "").lower()
    if "lifetime" in a_comm and "lifetime" not in b_comm:
        return f"{a_name} for longer-tail affiliate upside"
    if "lifetime" in b_comm and "lifetime" not in a_comm:
        return f"{b_name} for longer-tail affiliate upside"
    if "50%" in a_comm and "50%" not in b_comm:
        return f"{a_name} for payout strength"
    if "50%" in b_comm and "50%" not in a_comm:
        return f"{b_name} for payout strength"
    return "Winner depends on your growth motion"


def quick_take(a: Dict[str, str], b: Dict[str, str], bucket: str) -> str:
    a_name = a["Name"]
    b_name = b["Name"]
    a_model = commission_profile(a.get("Commission", ""))["payout_model"].lower()
    b_model = commission_profile(b.get("Commission", ""))["payout_model"].lower()
    return f"{a_name} and {b_name} both sit in the broader {bucket.lower()} landscape, but they appeal to slightly different buying motions. {a_name} leans into {a_model}, while {b_name} leans into {b_model}. The better fit depends on whether you want the cleaner affiliate story, the broader positioning angle, or both."


def fill_placeholders(obj: Any, replacements: Dict[str, str]):
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


def make_related_links(all_pairs: List[Dict[str, str]], current_pair: Dict[str, str], limit: int = 3) -> List[Dict[str, str]]:
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
            links.append({"label": pair["tool_a_name"] + " vs " + pair["tool_b_name"], "href": pair["url_path"]})
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
        pairs.append({
            "tool_a_name": a["Name"], "tool_a_slug": a["slug"], "tool_a_category": a["Category"], "tool_a_commission": a["Commission"], "tool_a_link": a["Link"],
            "tool_b_name": b["Name"], "tool_b_slug": b["slug"], "tool_b_category": b["Category"], "tool_b_commission": b["Commission"], "tool_b_link": b["Link"],
            "comparison_category": comparison_category, "comparison_angle": "affiliate-program comparison", "winner_hint": estimate_winner_hint(a, b),
            "tool_a_best_for": estimate_best_for(a), "tool_b_best_for": estimate_best_for(b), "quick_take": quick_take(a, b, comparison_category), "url_path": "/compare/" + a["slug"] + "-vs-" + b["slug"]
        })
    return pairs


def fallback_copy(record: Dict[str, str]) -> Dict[str, Any]:
    a_name = record["tool_a_name"]
    b_name = record["tool_b_name"]
    a_category = record["tool_a_category"]
    b_category = record["tool_b_category"]
    a_comm = record["tool_a_commission"]
    b_comm = record["tool_b_commission"]
    a_link = record["tool_a_link"]
    b_link = record["tool_b_link"]
    comparison_category = record["comparison_category"]
    a_profile = commission_profile(a_comm)
    b_profile = commission_profile(b_comm)
    best_for_a = record["tool_a_best_for"]
    best_for_b = record["tool_b_best_for"]
    return {
        "winner_hint": record["winner_hint"],
        "best_for_a": best_for_a,
        "best_for_b": best_for_b,
        "quick_take": record["quick_take"],
        "verdict": {"headline": f"{a_name} vs {b_name}: two viable routes, different monetization stories", "summary": f"{a_name} and {b_name} both belong in a {comparison_category.lower()} conversation, but they are easier to recommend for different reasons. {a_name} is the stronger pick if you want {a_profile['affiliate_hook']}, while {b_name} stands out if you want {b_profile['affiliate_hook']}."},
        "intro": [f"{a_name} and {b_name} both target buyers exploring {comparison_category.lower()} options, yet they frame the decision differently.", f"This comparison focuses on positioning, affiliate economics, and which tool is easier to back depending on whether you value {a_profile['payout_model'].lower()} or {b_profile['payout_model'].lower()}."],
        "pros_cons": {"tool_a_pros": [f"Clear {a_category.lower()} positioning for focused evaluation.", f"Commission-led offer ({a_comm}) creates a straightforward affiliate narrative.", f"Useful when the buying motion matches {a_name} category framing."], "tool_a_cons": [f"Positioning may feel narrower if you want a broader {comparison_category.lower()} angle.", "Commission terms alone do not explain product depth or implementation fit."], "tool_b_pros": [f"Strong fit for buyers scanning {b_category.lower()} alternatives.", f"Commission-led offer ({b_comm}) gives it a distinct partner story.", "Adds a credible alternative when you want contrast inside the same page."], "tool_b_cons": [f"May be less compelling if your primary filter is {a_profile['payout_model'].lower()}.", "Category-level inputs still leave deeper product trade-offs unresolved."]},
        "highlights": {"tool_a": [f"Category: {a_category}.", f"Affiliate structure: {a_comm}.", f"Best framed around {a_profile['affiliate_hook']}."], "tool_b": [f"Category: {b_category}.", f"Affiliate structure: {b_comm}.", f"Best framed around {b_profile['affiliate_hook']}."]},
        "comparison_rows": [{"dimension": "Best for", "tool_a": best_for_a, "tool_b": best_for_b}, {"dimension": "Affiliate commission", "tool_a": a_comm, "tool_b": b_comm}, {"dimension": "Monetization style", "tool_a": a_profile["payout_model"], "tool_b": b_profile["payout_model"]}, {"dimension": "Official link", "tool_a": a_link, "tool_b": b_link}],
        "faq": [{"question": f"What is the main difference between {a_name} and {b_name}?", "answer": f"{a_name} is framed around {a_category.lower()} positioning and {a_profile['affiliate_hook']}, while {b_name} is framed around {b_category.lower()} positioning and {b_profile['affiliate_hook']}."}, {"question": f"Who should choose {a_name} over {b_name}?", "answer": best_for_a}, {"question": f"Who should choose {b_name} over {a_name}?", "answer": best_for_b}],
        "seo": {"title": f"{a_name} vs {b_name}: Verdict, Pros & Cons", "meta_description": f"Compare {a_name} vs {b_name} with verdict, buyer fit, affiliate terms, pros and cons, and FAQ in one page."}
    }


def extract_json_object(text: str) -> Dict[str, Any]:
    cleaned = (text or "").strip()
    # Explicitly strip markdown code blocks if present
    if cleaned.startswith("```"):
        import re
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    
    cleaned = cleaned.strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        print(f"DEBUG: Raw LLM text before JSON extraction: {text}")
        raise ValueError("No JSON object found in LLM response")
    json_text = cleaned[start : end + 1]
    try:
        return json.loads(json_text)
    except json.JSONDecodeError:
        print(f"DEBUG: Raw LLM text before JSON decode error: {text}")
        print(f"DEBUG: Extracted JSON text before JSON decode error: {json_text}")
        raise


def resolve_llm_endpoint(raw_endpoint: str) -> str:
    cleaned = (raw_endpoint or "").strip().strip("‌​‍﻿").rstrip("/")
    if not cleaned:
        return DEFAULT_AZURE_ENDPOINT
    if "gpt-i18n.byteintl.net/gpt/openapi/online/v2/crawl" in cleaned:
        return DEFAULT_AZURE_ENDPOINT
    if "/openai/deployments/" in cleaned:
        cleaned = cleaned.split("/openai/deployments/", 1)[0]
    return cleaned


def create_llm_client(api_key: Optional[str], api_version: str, azure_endpoint: str, azure_deployment: Optional[str] = None):
    del api_version, azure_deployment
    cleaned_api_key = (api_key or "").strip()
    if not cleaned_api_key:
        return None
    return {
        "api_key": cleaned_api_key,
        "endpoint": resolve_llm_endpoint(azure_endpoint),
        "fallback_endpoint": DEFAULT_AZURE_FALLBACK_ENDPOINT,
        "timeout": DEFAULT_REQUEST_TIMEOUT,
    }


def generate_llm_copy(record: Dict[str, str], client: Any, model: str, max_tokens: int) -> Optional[Dict[str, Any]]:
    if client is None:
        return None
    prompt = PROMPT_TEMPLATE.format(**record)
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
    }
    headers = {"Content-Type": "application/json"}
    endpoints = []
    for endpoint in [client.get("endpoint"), client.get("fallback_endpoint")]:
        if endpoint and endpoint not in endpoints:
            endpoints.append(endpoint)
    last_error = None
    for endpoint in endpoints:
        response = None
        try:
            print(f"DEBUG: Request endpoint {endpoint}")
            print(f"DEBUG: Request payload {payload}")
            response = requests.post(
                endpoint,
                params={"ak": client["api_key"]},
                headers=headers,
                json=payload,
                timeout=client.get("timeout", DEFAULT_REQUEST_TIMEOUT),
            )
            if response.status_code != 200:
                print(f"DEBUG: Response status {response.status_code}, text: {response.text}")
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            if isinstance(content, list):
                content = chr(10).join(item.get("text", "") if isinstance(item, dict) and item.get("type") == "text" else str(item) for item in content)
            return extract_json_object(str(content))
        except Exception as exc:
            if response is not None:
                print(f"DEBUG: Response status {response.status_code}, text: {response.text}")
            print(f"DEBUG: Request payload {payload}")
            last_error = f"{endpoint}?ak=<redacted> -> {exc}"
    if last_error is not None:
        raise RuntimeError(last_error)
    return None


def build_content_bundle(record: Dict[str, str], llm_payload: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    fallback = fallback_copy(record)
    payload = llm_payload or {}
    verdict = payload.get("verdict") if isinstance(payload.get("verdict"), dict) else fallback["verdict"]
    pros_cons = payload.get("pros_cons") if isinstance(payload.get("pros_cons"), dict) else fallback["pros_cons"]
    highlights = payload.get("highlights") if isinstance(payload.get("highlights"), dict) else fallback["highlights"]
    seo = payload.get("seo") if isinstance(payload.get("seo"), dict) else fallback["seo"]
    return {
        "winner_hint": normalize_space(str(payload.get("winner_hint", fallback["winner_hint"])))[:90],
        "best_for_a": normalize_space(str(payload.get("best_for_a", fallback["best_for_a"]))),
        "best_for_b": normalize_space(str(payload.get("best_for_b", fallback["best_for_b"]))),
        "quick_take": normalize_space(str(payload.get("quick_take", fallback["quick_take"]))),
        "verdict": {"headline": normalize_space(str(verdict.get("headline", fallback["verdict"]["headline"]))), "summary": normalize_space(str(verdict.get("summary", fallback["verdict"]["summary"])))},
        "intro": payload.get("intro") if isinstance(payload.get("intro"), list) else fallback["intro"],
        "pros_cons": pros_cons,
        "highlights": highlights,
        "comparison_rows": payload.get("comparison_rows") if isinstance(payload.get("comparison_rows"), list) else fallback["comparison_rows"],
        "faq": payload.get("faq") if isinstance(payload.get("faq"), list) else fallback["faq"],
        "seo": {"title": normalize_space(str(seo.get("title", fallback["seo"]["title"])))[:65], "meta_description": normalize_space(str(seo.get("meta_description", fallback["seo"]["meta_description"])))[:160]}
    }


def generate_specs(csv_path: Path, template_path: Path, output_dir: Path, mode: str, limit: Optional[int], llm_client: Any, llm_model: str, llm_max_tokens: int):
    rows = load_csv(csv_path)
    template = load_template(template_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    pair_records = build_pair_records(rows, mode)
    if limit is not None:
        pair_records = pair_records[:limit]
    generated_at = datetime.now(timezone.utc).isoformat()
    specs = []
    pair_lookup = []
    llm_counts = {"llm": 0, "fallback": 0}
    for record in pair_records:
        llm_payload = None
        llm_status = "fallback"
        llm_error = None
        try:
            llm_payload = generate_llm_copy(record, llm_client, llm_model, llm_max_tokens)
            if llm_payload is not None:
                llm_status = "llm"
        except Exception as exc:
            llm_error = str(exc)
        llm_counts[llm_status] += 1
        content = build_content_bundle(record, llm_payload)
        replacements = deepcopy(record)
        replacements["source_csv"] = str(csv_path)
        replacements["generated_at"] = generated_at
        spec = fill_placeholders(template, replacements)
        spec["seo"]["title"] = content["seo"]["title"]
        spec["seo"]["meta_description"] = content["seo"]["meta_description"]
        spec["summary"] = {"winner_hint": content["winner_hint"], "best_for_a": content["best_for_a"], "best_for_b": content["best_for_b"], "quick_take": content["quick_take"]}
        spec["comparison_table"] = {"columns": ["Dimension", record["tool_a_name"], record["tool_b_name"]], "rows": content["comparison_rows"]}
        spec["sections"] = [
            {"type": "intro", "data": {"paragraphs": content.get("intro", [])}},
            {"type": "verdict", "data": content.get("verdict", {})},
            {"type": "pros_cons", "data": {
                "tool_a": {
                    "pros": content.get("pros_cons", {}).get("tool_a_pros", []),
                    "cons": content.get("pros_cons", {}).get("tool_a_cons", [])
                },
                "tool_b": {
                    "pros": content.get("pros_cons", {}).get("tool_b_pros", []),
                    "cons": content.get("pros_cons", {}).get("tool_b_cons", [])
                }
            }},
            {"type": "highlights", "data": content.get("highlights", {})},
            {"type": "faq", "data": {"items": content.get("faq", [])}},
            {"type": "related_comparisons", "data": {"links": []}}
        ]
        spec["metadata"] = {**spec.get("metadata", {}), "source_csv": str(csv_path), "generated_at": generated_at, "generator": "generate_avsb_pages.py", "llm_status": llm_status, "llm_model": llm_model if llm_client is not None else None}
        if llm_error:
            spec["metadata"]["llm_error"] = llm_error
        specs.append(spec)
        pair_lookup.append({"tool_a_name": record["tool_a_name"], "tool_a_slug": record["tool_a_slug"], "tool_b_name": record["tool_b_name"], "tool_b_slug": record["tool_b_slug"], "comparison_category": record["comparison_category"], "url_path": record["url_path"]})
    for spec, pair in zip(specs, pair_lookup):
        spec["sections"][-1]["data"]["links"] = make_related_links(pair_lookup, pair)
        with (output_dir / (spec["page_key"] + ".json")).open("w", encoding="utf-8") as f:
            json.dump(spec, f, ensure_ascii=False, indent=2)
    manifest = {"source_csv": str(csv_path), "template": str(template_path), "mode": mode, "generated_at": generated_at, "page_count": len(specs), "llm": {"enabled": llm_client is not None, "model": llm_model if llm_client is not None else None, "counts": llm_counts}, "pages": [{"page_key": spec["page_key"], "url_path": spec["url_path"], "title": spec["seo"]["title"], "file": spec["page_key"] + ".json", "llm_status": spec["metadata"]["llm_status"]} for spec in specs]}
    with (output_dir / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(json.dumps({"generated": len(specs), "output_dir": str(output_dir), "llm": manifest["llm"]}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate A vs B pSEO page specs from a CSV file.")
    parser.add_argument("--csv", required=True, help="Path to input CSV")
    parser.add_argument("--template", default="engine/page_spec_template.json", help="Path to JSON template")
    parser.add_argument("--output-dir", default="engine/output", help="Directory to store generated JSON files")
    parser.add_argument("--mode", choices=["same-category", "all"], default="same-category", help="How to pair tools")
    parser.add_argument("--limit", type=int, default=None, help="Optional limit on generated pages")
    parser.add_argument("--azure-api-key", default=os.getenv("AKA_AZURE_OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_API_KEY"), help="ModelHub AK")
    parser.add_argument("--azure-endpoint", default=os.getenv("AKA_AZURE_OPENAI_ENDPOINT") or os.getenv("AZURE_OPENAI_ENDPOINT") or DEFAULT_AZURE_ENDPOINT, help="ModelHub crawl endpoint; old gpt-i18n crawl URL will be auto-mapped to the ModelHub endpoint")
    parser.add_argument("--azure-api-version", default=os.getenv("AKA_AZURE_OPENAI_API_VERSION", DEFAULT_AZURE_API_VERSION), help="Reserved for backward compatibility; requests mode does not use api-version")
    parser.add_argument("--azure-model", default=os.getenv("AKA_AZURE_OPENAI_MODEL", DEFAULT_AZURE_MODEL), help="Model name sent in ModelHub request body")
    parser.add_argument("--azure-deployment", default=os.getenv("AKA_AZURE_OPENAI_DEPLOYMENT", ""), help="Reserved for backward compatibility; requests mode does not use deployment")
    parser.add_argument("--max-tokens", type=int, default=int(os.getenv("AKA_AZURE_OPENAI_MAX_TOKENS", str(DEFAULT_MAX_TOKENS))), help="Max tokens for each LLM request")
    args = parser.parse_args()
    client = create_llm_client(args.azure_api_key, args.azure_api_version, args.azure_endpoint, args.azure_deployment)
    generate_specs(Path(args.csv), Path(args.template), Path(args.output_dir), args.mode, args.limit, client, args.azure_model, args.max_tokens)
