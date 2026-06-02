# pSEO A vs B 生成器

这个目录包含两部分：

1. `page_spec_template.json`：适用于 Next.js 批量对比页的 Page Spec 模板。
2. `generate_avsb_pages.py`：读取 CSV，自动交叉组合工具并生成前端可直接消费的 JSON 页面数据。

## 输入 CSV 约定

默认按以下列读取：

- `Name`
- `Category`
- `Commission`
- `Link`

## 生成逻辑

- 默认使用 `same-category` 模式：优先只生成同类工具对比页，例如 `Webflow vs Framer`。
- 可切换到 `all` 模式：生成任意两两组合。
- 每个页面会输出：
  - SEO 字段
  - hero 模块
  - summary 模块
  - entities 数据
  - comparison table
  - sections（intro / highlights / faq / related comparisons）
  - taxonomy / render hints / metadata

## 运行示例

```bash
python3 pseo_avsb_engine/generate_avsb_pages.py \
  --csv ".aime/artifacts/assistants/f5cf5c7e-dd19-48ed-828d-b1a914e7c704/3cd992bf-940d-46fc-b2ac-df0c09c1e71c/v1/top_50_nocode_affiliate_programs.csv" \
  --output-dir pseo_avsb_engine/output
```

## 推荐接入 Next.js 的方式

- 在构建期或 ISR 任务中读取 `manifest.json`
- 路由层按 `url_path` 映射到对应 JSON 文件
- 页面组件以 `sections` 为中心做 schema-driven 渲染

这样前端只管渲染，批量生产逻辑留在 Python，比较丝滑。——胖哥
