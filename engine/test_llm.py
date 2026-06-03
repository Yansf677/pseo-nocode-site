import argparse
import json
import os

try:
    from openai import AzureOpenAI, OpenAI
except ImportError as exc:
    raise SystemExit(f"openai package is required: {exc}")

DEFAULT_ENDPOINT = "https://gpt-i18n.byteintl.net/gpt/openapi/online/v2/crawl"
DEFAULT_API_VERSION = "2024-02-01"
DEFAULT_MODEL = "gpt-5-mini-2025-08-07"
DEFAULT_DEPLOYMENT = "gpt_openapi"


def build_prompt() -> str:
    return "Reply with a compact JSON object like {\"ok\": true, \"source\": \"...\"}."


def make_messages():
    return [{"role": "user", "content": build_prompt()}]


def run_azure(api_key: str, endpoint: str, api_version: str, deployment: str, model: str, timeout: float):
    client = AzureOpenAI(
        api_key=api_key,
        api_version=api_version,
        azure_endpoint=endpoint.rstrip("/"),
        azure_deployment=deployment,
        timeout=timeout,
    )
    return client.chat.completions.create(
        model=model,
        messages=make_messages(),
        max_tokens=128,
    )


def run_openai(api_key: str, base_url: str, model: str, timeout: float):
    client = OpenAI(
        api_key=api_key,
        base_url=base_url.rstrip("/"),
        timeout=timeout,
    )
    return client.chat.completions.create(
        model=model,
        messages=make_messages(),
        max_tokens=128,
    )


def summarize_response(tag: str, response) -> None:
    message = response.choices[0].message
    content = message.content
    if isinstance(content, list):
        content = "\n".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in content
        )
    print(json.dumps({
        "mode": tag,
        "ok": True,
        "id": getattr(response, "id", None),
        "model": getattr(response, "model", None),
        "content": str(content),
    }, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Probe the internal GPT gateway with Azure/OpenAI SDK shapes.")
    parser.add_argument("--api-key", default=os.getenv("AKA_AZURE_OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_API_KEY"))
    parser.add_argument("--endpoint", default=os.getenv("AKA_AZURE_OPENAI_ENDPOINT", DEFAULT_ENDPOINT))
    parser.add_argument("--api-version", default=os.getenv("AKA_AZURE_OPENAI_API_VERSION", DEFAULT_API_VERSION))
    parser.add_argument("--model", default=os.getenv("AKA_AZURE_OPENAI_MODEL", DEFAULT_MODEL))
    parser.add_argument("--deployment", default=os.getenv("AKA_AZURE_OPENAI_DEPLOYMENT", DEFAULT_DEPLOYMENT))
    parser.add_argument("--mode", choices=["azure", "openai", "both"], default="both")
    parser.add_argument("--timeout", type=float, default=30.0)
    args = parser.parse_args()

    if not args.api_key:
        raise SystemExit("Missing API key. Export AKA_AZURE_OPENAI_API_KEY or pass --api-key.")

    endpoint = args.endpoint.rstrip("/")
    openai_base_url = endpoint
    if "/openai/deployments/" not in openai_base_url:
        openai_base_url = f"{endpoint}/openai/deployments/{args.deployment}"

    attempts = []
    if args.mode in {"azure", "both"}:
        attempts.append(("azure", lambda: run_azure(args.api_key, endpoint, args.api_version, args.deployment, args.model, args.timeout)))
    if args.mode in {"openai", "both"}:
        attempts.append(("openai", lambda: run_openai(args.api_key, openai_base_url, args.model, args.timeout)))

    for tag, fn in attempts:
        try:
            response = fn()
            summarize_response(tag, response)
        except Exception as exc:
            print(json.dumps({
                "mode": tag,
                "ok": False,
                "endpoint": endpoint if tag == "azure" else openai_base_url,
                "error_type": type(exc).__name__,
                "error": str(exc),
            }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
