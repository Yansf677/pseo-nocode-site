"use client";

import { useEffect, useMemo, useState } from "react";

interface VoteBattleProps {
  slug: string;
  toolAName: string;
  toolBName: string;
}

type VoteSide = "a" | "b";

interface VoteState {
  a: number;
  b: number;
  votedFor: VoteSide | null;
}

const STORAGE_PREFIX = "vote-battle";

function hashString(input: string) {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function createInitialVotes(slug: string) {
  const seed = hashString(slug);
  const a = 40 + (seed % 61);
  const b = 40 + ((Math.floor(seed / 7) + 17) % 61);

  return { a, b };
}

function getStorageKey(slug: string) {
  return `${STORAGE_PREFIX}:${slug}`;
}

export default function VoteBattle({ slug, toolAName, toolBName }: VoteBattleProps) {
  const [voteState, setVoteState] = useState<VoteState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storageKey = getStorageKey(slug);
    const fallbackVotes = createInitialVotes(slug);

    try {
      const raw = window.localStorage.getItem(storageKey);

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<VoteState>;
        setVoteState({
          a: typeof parsed.a === "number" ? parsed.a : fallbackVotes.a,
          b: typeof parsed.b === "number" ? parsed.b : fallbackVotes.b,
          votedFor: parsed.votedFor === "a" || parsed.votedFor === "b" ? parsed.votedFor : null
        });
      } else {
        setVoteState({
          ...fallbackVotes,
          votedFor: null
        });
      }
    } catch {
      setVoteState({
        ...fallbackVotes,
        votedFor: null
      });
    }

    setIsHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!voteState) {
      return;
    }

    window.localStorage.setItem(getStorageKey(slug), JSON.stringify(voteState));
  }, [slug, voteState]);

  const metrics = useMemo(() => {
    const aVotes = voteState?.a ?? 0;
    const bVotes = voteState?.b ?? 0;
    const totalVotes = aVotes + bVotes;
    const aPercent = totalVotes > 0 ? (aVotes / totalVotes) * 100 : 50;
    const bPercent = totalVotes > 0 ? (bVotes / totalVotes) * 100 : 50;

    return {
      totalVotes,
      aVotes,
      bVotes,
      aPercent,
      bPercent,
      leadLabel:
        aVotes === bVotes ? "It's a tie! Every vote counts." : `${aVotes > bVotes ? toolAName : toolBName} is in the lead`
    };
  }, [toolAName, toolBName, voteState]);

  function handleVote(side: VoteSide) {
    setVoteState((current) => {
      if (!current || current.votedFor) {
        return current;
      }

      return {
        a: current.a + (side === "a" ? 1 : 0),
        b: current.b + (side === "b" ? 1 : 0),
        votedFor: side
      };
    });
  }

  return (
    <section className="glass-panel vote-battle-panel">
      <div className="vote-battle-header">
        <div>
          <p className="section-title">Vote battle</p>
          <h2 className="section-heading">Who&apos;s your winner?</h2>
        </div>
        <span className="vote-battle-status">⚡ {metrics.leadLabel}</span>
      </div>

      <div className="vote-battle-arena" aria-live="polite">
        <div className="vote-battle-progress-shell" aria-hidden="true">
          <div className="vote-battle-progress vote-battle-progress-a" style={{ width: `${metrics.aPercent}%` }} />
          <div className="vote-battle-progress vote-battle-progress-b" style={{ width: `${metrics.bPercent}%` }} />
          <div className="vote-battle-scanline" />
        </div>

        <div className="vote-battle-scoreboard">
          <div className="vote-score-card vote-score-card-a">
            <span className="vote-score-label">{toolAName}</span>
            <strong className="vote-score-value">{metrics.aPercent.toFixed(1)}%</strong>
            <span className="vote-score-meta">{metrics.aVotes} votes</span>
          </div>
          <div className="vote-score-divider">VS</div>
          <div className="vote-score-card vote-score-card-b">
            <span className="vote-score-label">{toolBName}</span>
            <strong className="vote-score-value">{metrics.bPercent.toFixed(1)}%</strong>
            <span className="vote-score-meta">{metrics.bVotes} votes</span>
          </div>
        </div>
      </div>

      <div className="vote-battle-actions">
        <button
          type="button"
          className={`vote-battle-button vote-battle-button-a ${voteState?.votedFor === "a" ? "is-selected" : ""}`}
          onClick={() => handleVote("a")}
          disabled={Boolean(voteState?.votedFor)}
        >
          <span className="vote-battle-button-kicker">Support Side A</span>
          <span className="vote-battle-button-name">{toolAName}</span>
        </button>
        <button
          type="button"
          className={`vote-battle-button vote-battle-button-b ${voteState?.votedFor === "b" ? "is-selected" : ""}`}
          onClick={() => handleVote("b")}
          disabled={Boolean(voteState?.votedFor)}
        >
          <span className="vote-battle-button-kicker">Support Side B</span>
          <span className="vote-battle-button-name">{toolBName}</span>
        </button>
      </div>

      <div className="vote-battle-footer">
        <p className="section-body vote-battle-caption">
          {voteState?.votedFor
            ? `You've voted for ${voteState.votedFor === "a" ? toolAName : toolBName}. We'll remember your choice on this device.`
            : "Beta: Lightweight voting with randomized initial counts + localStorage to save your choice."}
        </p>
        <span className="vote-battle-total">Total votes: {metrics.totalVotes}</span>
      </div>

      {!isHydrated ? <div className="vote-battle-loading">Loading battle status...</div> : null}
    </section>
  );
}
