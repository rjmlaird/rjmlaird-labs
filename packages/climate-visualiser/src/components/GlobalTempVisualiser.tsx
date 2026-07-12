import GlobalTempChart from './GlobalTempChart';

export default function GlobalTempVisualiser() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-slate-200">
      <header className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 shadow-2xl shadow-black/30">
        <p className="font-['IBM_Plex_Mono'] text-sm uppercase tracking-[0.2em] text-cyan-300/80">
          Science communication showcase
        </p>
        <h1 className="mt-3 font-['Space_Grotesk'] text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Climate Visualiser
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
          A clean, accessible temperature anomaly dashboard for labs, talks, and public-facing research.
        </p>
      </header>

      <div className="min-h-[760px] rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <GlobalTempChart />
      </div>
    </section>
  );
}