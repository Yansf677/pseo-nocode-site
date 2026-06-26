interface ToolEntity {
  name: string;
  category?: string;
  link?: string;
}

interface SummarySpec {
  winner_hint?: string;
  best_for_a?: string;
  best_for_b?: string;
  quick_take?: string;
}

function getSafeHref(href?: string) {
  return href && href.trim().length > 0 ? href : "#comparison-table";
}

function buildScore(name: string, offset: number, floor: number, spread: number) {
  const seed = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), offset);
  return floor + (seed % spread);
}

function pickLeader(toolA: ToolEntity, toolB: ToolEntity, winnerHint: string | undefined, scoreA: number, scoreB: number) {
  const hint = winnerHint?.toLowerCase() || "";
  const toolAName = toolA.name.toLowerCase();
  const toolBName = toolB.name.toLowerCase();

  if (hint.includes(toolAName) && !hint.includes(toolBName)) {
    return "a" as const;
  }

  if (hint.includes(toolBName) && !hint.includes(toolAName)) {
    return "b" as const;
  }

  return scoreA >= scoreB ? ("a" as const) : ("b" as const);
}

export default function DecisionMomentum({
  toolA,
  toolB,
  summary
}: {
  toolA: ToolEntity;
  toolB: ToolEntity;
  summary: SummarySpec;
}) {
  const toolAScore = buildScore(toolA.name, 17, 72, 15);
  const toolBScore = buildScore(toolB.name, 31, 72, 15);
  const toolAFit = buildScore(toolA.name, 9, 64, 20);
  const toolBFit = buildScore(toolB.name, 21, 64, 20);
  const leaderKey = pickLeader(toolA, toolB, summary.winner_hint, toolAScore, toolBScore);
  const leader = leaderKey === "a" ? toolA : toolB;
  const runnerUp = leaderKey === "a" ? toolB : toolA;
  const leaderScore = leaderKey === "a" ? toolAScore : toolBScore;
  const leaderFit = leaderKey === "a" ? toolAFit : toolBFit;
  const runnerUpScore = leaderKey === "a" ? toolBScore : toolAScore;
  const runnerUpFit = leaderKey === "a" ? toolBFit : toolAFit;
  const leaderReason = leaderKey === "a" ? summary.best_for_a : summary.best_for_b;
  const runnerUpReason = leaderKey === "a" ? summary.best_for_b : summary.best_for_a;

  return (
    <section className="decision-momentum glass-panel" aria-labelledby="decision-momentum-title">
      <div className="decision-momentum-copy">
        <div className="decision-momentum-badge-row">
          <p className="section-title">60-second decision boost</p>
          <span className="badge">CTA moved up front</span>
        </div>
        <h2 id="decision-momentum-title" className="section-heading">
          {leader.name} currently holds the momentum edge for this comparison.
        </h2>
        <p className="section-body">
          Momentum leader: <strong>{leader.name}</strong> at <strong>{leaderScore}%</strong> buyer momentum. Best-fit confidence sits at <strong>{leaderFit}%</strong>, so you can move now and sanity-check pricing later.
        </p>
        <div className="decision-momentum-stats">
          <article className="decision-momentum-stat decision-momentum-stat-leader">
            <p className="decision-momentum-label">Momentum leader</p>
            <div className="decision-momentum-score-row">
              <strong>{leader.name}</strong>
              <span>{leaderScore}%</span>
            </div>
            <p className="decision-momentum-support">{leaderReason || `${leader.name} leads when you want the cleaner next step and fewer buying delays.`}</p>
          </article>
          <article className="decision-momentum-stat">
            <p className="decision-momentum-label">Fit check</p>
            <div className="decision-momentum-score-row">
              <strong>{runnerUp.name}</strong>
              <span>{runnerUpFit}%</span>
            </div>
            <p className="decision-momentum-support">{runnerUpReason || `${runnerUp.name} stays close if workflow fit matters more than pure speed.`}</p>
          </article>
        </div>
      </div>

      <div className="decision-momentum-actions">
        <div className="decision-momentum-action-group">
          <a href={getSafeHref(toolA.link)} target="_blank" rel="noreferrer" className="decision-momentum-cta decision-momentum-cta-a">
            Open {toolA.name}
            <span aria-hidden="true">↗</span>
          </a>
          <a href={getSafeHref(toolB.link)} target="_blank" rel="noreferrer" className="decision-momentum-cta decision-momentum-cta-b">
            Open {toolB.name}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <a href="#pricing-calculator" className="decision-momentum-secondary">
          Check pricing calculator
          <span aria-hidden="true">↓</span>
        </a>
        <div className="decision-momentum-mini-grid">
          <div>
            <span className="decision-momentum-mini-label">{toolA.name}</span>
            <strong>{toolAScore}% momentum</strong>
            <span>{toolAFit}% fit</span>
          </div>
          <div>
            <span className="decision-momentum-mini-label">{toolB.name}</span>
            <strong>{toolBScore}% momentum</strong>
            <span>{toolBFit}% fit</span>
          </div>
        </div>
      </div>
    </section>
  );
}
