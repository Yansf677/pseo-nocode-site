interface EntitiesSpec {
  tool_a: {
    name: string;
    category?: string;
    commission?: string;
    link?: string;
  };
  tool_b: {
    name: string;
    category?: string;
    commission?: string;
    link?: string;
  };
}

interface SummarySpec {
  winner_hint?: string;
  best_for_a?: string;
  best_for_b?: string;
  quick_take?: string;
}

interface DecisionShortcutProps {
  entities: EntitiesSpec;
  summary: SummarySpec;
}

function getSafeHref(href?: string) {
  return href && href.trim().length > 0 ? href : "#comparison-table";
}

function resolveRecommendedTool(entities: EntitiesSpec, winnerHint?: string) {
  const hint = winnerHint?.toLowerCase() || "";
  const toolAName = entities.tool_a.name.toLowerCase();
  const toolBName = entities.tool_b.name.toLowerCase();

  if (hint.includes(toolAName) && !hint.includes(toolBName)) {
    return entities.tool_a;
  }

  if (hint.includes(toolBName) && !hint.includes(toolAName)) {
    return entities.tool_b;
  }

  return entities.tool_a;
}

function buildRecommendationCopy(summary: SummarySpec, recommendedName: string) {
  if (summary.winner_hint) {
    return summary.winner_hint;
  }

  if (summary.quick_take) {
    return `${summary.quick_take} Start with ${recommendedName} if you want the clearest next step.`;
  }

  return `Use the current comparison signal as your tiebreaker and start with ${recommendedName}.`;
}

export default function DecisionShortcut({ entities, summary }: DecisionShortcutProps) {
  const recommendedTool = resolveRecommendedTool(entities, summary.winner_hint);
  const cards = [
    {
      title: "🟢 Lowest friction",
      eyebrow: `Fast path → ${entities.tool_a.name}`,
      body: `For buyers who already know they want momentum now. Open ${entities.tool_a.name} directly and keep the decision moving.`,
      href: getSafeHref(entities.tool_a.link),
      cta: `Open ${entities.tool_a.name}`,
      className: "decision-shortcut-card-a"
    },
    {
      title: "🔵 Best fit check",
      eyebrow: `Deeper check → ${entities.tool_b.name}`,
      body: `For teams that want to validate workflow fit before committing. Open ${entities.tool_b.name} and inspect the details that matter.`,
      href: getSafeHref(entities.tool_b.link),
      cta: `Open ${entities.tool_b.name}`,
      className: "decision-shortcut-card-b"
    },
    {
      title: "🤔 Still unsure",
      eyebrow: `Winner hint → ${recommendedTool.name}`,
      body: buildRecommendationCopy(summary, recommendedTool.name),
      href: getSafeHref(recommendedTool.link),
      cta: `Go with ${recommendedTool.name}`,
      className: "decision-shortcut-card-neutral"
    }
  ];

  return (
    <section className="glass-panel decision-shortcut-panel" aria-labelledby="decision-shortcut-title">
      <div className="decision-shortcut-copy">
        <p className="badge">Switcher intent shortlist</p>
        <h2 id="decision-shortcut-title" className="section-heading">
          Route high-intent visitors by buying mode
        </h2>
        <p className="section-body">
          Three quick paths for switchers: take the fastest route, pressure-test the fit, or follow the winner hint when the call still feels close.
        </p>
      </div>

      <div className="decision-shortcut-grid">
        {cards.map((card) => (
          <a key={card.title} href={card.href} className={`decision-shortcut-card ${card.className}`}>
            <span className="decision-shortcut-eyebrow">{card.eyebrow}</span>
            <strong>{card.title}</strong>
            <span>{card.body}</span>
            <em>
              {card.cta}
              <span aria-hidden="true">↗</span>
            </em>
          </a>
        ))}
      </div>
    </section>
  );
}
