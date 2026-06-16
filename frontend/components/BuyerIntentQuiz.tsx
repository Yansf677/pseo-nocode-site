import Link from "next/link";

interface QuizPage {
  page_key: string;
  url_path: string;
  title: string;
}

function pickPage(pages: QuizPage[], offset: number) {
  return pages[offset % pages.length];
}

export default function BuyerIntentQuiz({ pages }: { pages: QuizPage[] }) {
  if (pages.length === 0) {
    return null;
  }

  const routes = [
    {
      label: "I need an AI workflow upgrade",
      signal: "Best for high-intent AI buyers",
      page: pickPage(pages, 0),
      badge: "AI Stack"
    },
    {
      label: "I want a no-code site or app builder",
      signal: "Best for creator and startup traffic",
      page: pickPage(pages, 1),
      badge: "No-Code"
    },
    {
      label: "I am comparing productivity tools",
      signal: "Best for teams ready to switch",
      page: pickPage(pages, 2),
      badge: "Productivity"
    }
  ];

  return (
    <section className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-7 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-950 p-5 shadow-lg shadow-emerald-500/10">
          <span className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
            30-second buyer shortcut
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
            Not sure where to start? Pick your buying intent.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This quick chooser sends visitors directly into the comparison most likely to match their job-to-be-done, reducing homepage hesitation and lifting internal CTR.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
            <div className="rounded-xl bg-slate-900/70 p-2"><b className="block text-emerald-200">1</b>Choose goal</div>
            <div className="rounded-xl bg-slate-900/70 p-2"><b className="block text-amber-200">2</b>Open battle</div>
            <div className="rounded-xl bg-slate-900/70 p-2"><b className="block text-sky-200">3</b>Compare faster</div>
          </div>
        </div>

        <div className="grid gap-3">
          {routes.map((route, index) => (
            <Link
              key={route.badge}
              href={route.page.url_path}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/70 hover:bg-slate-900 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  <span className="rounded-full bg-emerald-400/10 px-2 py-0.5">{route.badge}</span>
                  <span>Path {index + 1}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-50 md:text-base">{route.label}</p>
                <p className="mt-1 text-xs text-slate-400">{route.signal}</p>
                <p className="mt-2 line-clamp-1 text-xs text-slate-500">Recommended: {route.page.title}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold text-slate-950 transition group-hover:bg-amber-300">
                Start →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
