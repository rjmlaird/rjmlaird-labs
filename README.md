# rjmlaird-labs

Monorepo for `labs.rjmlaird.co.uk`. Separates the labs catalog (Astro) from
individual experiments (any stack), so the main portfolio stays untouched by
whatever's being prototyped.

## Structure

```
labs-monorepo/
├── package.json              # pnpm workspace root
├── pnpm-workspace.yaml
├── scripts/
│   └── new-experiment.mjs    # scaffolds a new experiment + registers it
└── packages/
    ├── labs-index/           # Astro catalog site → labs.rjmlaird.co.uk
    │   └── src/data/experiments.json   # manifest the index page reads
    └── exp-example/          # React + Vite template experiment
```

## Getting started

```bash
pnpm install
pnpm dev:index        # runs the labs-index catalog locally
pnpm dev:exp-example   # runs the sample experiment locally
```

## Adding a new experiment

```bash
pnpm new:experiment my-new-thing
```

This copies `packages/exp-example` into `packages/my-new-thing`, renames it,
and adds a `planned` entry to `experiments.json` so it shows up on the index
page immediately (edit the description/status once it's real).

## Deployment model

- **labs-index** deploys as a static Astro build to Cloudflare Pages, mapped
  to `labs.rjmlaird.co.uk`.
- Each experiment deploys **independently** as its own Cloudflare Pages
  project (or Vercel/Netlify if that's a better fit for a given stack), mapped
  via CNAME to `<slug>.labs.rjmlaird.co.uk`.
- The catalog only links out to experiments — it never imports their code —
  so any experiment can use a completely different framework without
  touching the index build.

### DNS (Cloudflare)

| Type  | Name                        | Target                          |
|-------|-----------------------------|----------------------------------|
| CNAME | labs                        | labs-index.pages.dev             |
| CNAME | exp-example.labs            | exp-example.pages.dev            |

Add one CNAME per experiment as it goes live. Wildcard (`*.labs`) is possible
later via a Cloudflare Worker if you want to avoid manual DNS per experiment.

### CI

Recommended: one GitHub Actions workflow per package, triggered on path
filters (`packages/labs-index/**`, `packages/exp-example/**`), so pushing to
one experiment doesn't rebuild the whole monorepo. A starter workflow can be
added at `.github/workflows/deploy-labs-index.yml` once you're ready to wire
up Cloudflare Pages' GitHub integration (which handles most of this without
custom Actions if you connect the repo directly per-project).
