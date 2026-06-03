# pSEO A vs B 生成器

这个目录现在包含三块核心能力：

1. page_spec_template.json：适用于 Next.js 批量对比页的 Page Spec 模板。
2. generate_avsb_pages.py：读取 CSV，自动交叉组合工具并生成前端可直接消费的 JSON 页面数据。
3. Azure OpenAI 增强生成：为每一对 A vs B 自动生成更自然的 Verdict / Pros & Cons / FAQ / SEO 文案，而不是只靠固定模板。

## 输入 CSV 约定

默认按以下列读取：
- Name
- Category
- Commission
- Link

## 生成逻辑

- 默认使用 same-category 模式：优先只生成同类工具对比页，例如 Webflow vs Framer。
- 可切换到 all 模式：生成任意两两组合。
- 每个页面会输出：SEO、hero、summary、entities、comparison table、sections、taxonomy、render hints、metadata。
- 如果配置了 Azure OpenAI，会为每个页面生成差异化文案。
- 如果没有配置 API Key，或某个页面的 LLM 请求失败，会自动回退到规则生成，整个批量任务不会中断。

## Azure OpenAI 配置

支持以下参数或环境变量：
- --azure-api-key / AKA_AZURE_OPENAI_API_KEY
- --azure-endpoint / AKA_AZURE_OPENAI_ENDPOINT
- --azure-api-version / AKA_AZURE_OPENAI_API_VERSION
- --azure-model / AKA_AZURE_OPENAI_MODEL
- --max-tokens / AKA_AZURE_OPENAI_MAX_TOKENS

默认值：
- API Version: 2024-02-01
- Endpoint: https://gpt-i18n.byteintl.net/gpt/openapi/online/v2/crawl
- Model: gpt-5-mini-2025-08-07

建议把 API Key 放环境变量里，不要直接硬编码进仓库。

## 运行示例

规则回退模式：
python3 aka/engine/generate_avsb_pages.py --csv aka/engine/top_50_nocode_affiliate_programs.csv --output-dir aka/engine/output --limit 5

Azure OpenAI 增强模式：
AKA_AZURE_OPENAI_API_KEY=<your_key> python3 aka/engine/generate_avsb_pages.py --csv aka/engine/top_50_nocode_affiliate_programs.csv --output-dir aka/engine/output --azure-endpoint https://gpt-i18n.byteintl.net/gpt/openapi/online/v2/crawl --azure-api-version 2024-02-01 --azure-model gpt-5-mini-2025-08-07

## 输出说明

- 每个页面 JSON 的 metadata.llm_status 会标记来源：llm 或 fallback。
- manifest.json 会汇总整体的 LLM 命中情况。

## 推荐接入 Next.js 的方式

- 在构建期或 ISR 任务中读取 manifest.json。
- 路由层按 url_path 映射到对应 JSON 文件。
- 页面组件以 sections 为中心做 schema-driven 渲染。
- 当前前端已经兼容新增的 verdict 和 pros_cons section。

这样前端只管渲染，批量生产逻辑留在 Python，比较丝滑。——胖哥
