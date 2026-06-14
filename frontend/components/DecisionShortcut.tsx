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

function getBuyerLabel(copy?: string) {
  if (!copy) {
    return "Best when your team values a straightforward buying path and wants to validate the fit quickly.";
  }

  return copy;
}

export default function DecisionShortcut({ entities, summary }: DecisionShortcutProps) {
  const cards = [
    {
      title: `Choose ${entities.tool_a.name}`,
      eyebrow: "Shortcut A",
      body: getBuyerLabel(summary.best_for_a),
      href: getSafeHref(entities.tool_a.link),
      cta: `Open ${entities.tool_a.name}`,
      className: "decision-shortcut-card-a"
    },
    {
      title: `Choose ${entities.tool_b.name}`,
      eyebrow: "Shortcut B",
      body: getBuyerLabel(summary.best_for_b),
      href: getSafeHref(entities.tool_b.link),
      cta: `Open ${entities.tool_b.name}`,
      className: "decision-shortcut-card-b"
    }
  ];

  return (
    <section className="glass-panel decision-shortcut-panel" aria-labelledby="decision-shortcut-title">
      <div className="decision-shortcut-copy">
        <p className="badge">Buyer shortcut</p>
        <h2 id="decision-shortcut-title" className="section-heading">
          Pick your tool in under 30 seconds
        </h2>
        <p className="section-body">
          Use this quick route when you already know your buying priority. It reduces comparison fatigue and sends ready-to-buy visitors straight to the matching vendor.
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
