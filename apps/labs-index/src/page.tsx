import type { FC } from "hono/jsx";
import { css } from "./styles";
import { script } from "./script";
import { GROUPS, REPO, STATUS, LABS } from "./labs";
import type { Lab } from "./labs";
import { Callout } from "./Callout";

const byUpdatedDesc = (a: Lab, b: Lab) =>
  b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title);

const techOptions = [...new Set(LABS.flatMap((t) => t.tech))].sort((a, b) => a.localeCompare(b));
const groups = GROUPS.filter((g) => LABS.some((t) => t.group === g.id));

const LabCard: FC<{ lab: Lab }> = ({ lab }) => (
  <article
    class="card"
    data-card
    data-group={lab.group}
    data-tech={lab.tech.map((t) => t.toLowerCase()).join("|")}
    data-status={lab.status}
    data-updated={lab.updated}
    data-title={lab.title.toLowerCase()}
    data-status-order={String(STATUS[lab.status].order)}
  >
    <div class="card-top">
      <h3>{lab.title}</h3>
      <span class={`status status-${lab.status}`}>{STATUS[lab.status].label}</span>
    </div>
    <p class="desc">{lab.description}</p>
    <ul class="tech" aria-label="Technologies used">
      {lab.tech.map((t) => (
        <li>{t}</li>
      ))}
    </ul>
    <div class="card-links">
      {lab.path ? (
        <a class="btn-primary" href={lab.path}>
          Open lab <span aria-hidden="true">→</span>
        </a>
      ) : (
        <span class="btn-disabled">Coming soon</span>
      )}
      {lab.source && (
        <a class="btn-secondary" href={`${REPO}/tree/main/${lab.source}`} target="_blank" rel="noopener">
          Source
        </a>
      )}
    </div>
    <p class="updated">
      Updated <time datetime={lab.updated}>{lab.updated}</time>
    </p>
  </article>
);

export const IndexPage: FC = () => (
  <html lang="en-GB">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Labs · labs.rjmlaird.co.uk</title>
      <meta
        name="description"
        content="Interactive physics demonstrations, climate explorations and small experiments from rjmlaird.co.uk."
      />
      <meta name="theme-color" content="#0b0f1a" />
      <meta name="color-scheme" content="dark" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </head>
    <body>
      <header class="hero wrap">
        <div class="orbit-line" aria-hidden="true"></div>
        <p class="eyebrow">rjmlaird.co.uk / labs</p>
        <h1>Experiments that make ideas easier to explore.</h1>
        <p class="sub">
          Interactive demonstrations, experiments and prototypes. Each lab runs
          separately; this is the shared index for finding them.
        </p>
      </header>

      <main class="wrap">
        <section class="filters" aria-labelledby="filter-heading">
          <div class="filter-intro">
            <p class="section-kicker">Browse labs</p>
            <h2 id="filter-heading">Find a lab</h2>
            <p>Narrow the collection by subject area, technology and status, then choose how the results are ordered.</p>
          </div>
          <div class="filter-controls">
            <div class="filter-field">
              <label for="group-filter">Subject area</label>
              <select id="group-filter" name="group">
                <option value="all">All subject areas</option>
                {groups.map((g) => (
                  <option value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div class="filter-field">
              <label for="tech-filter">Technology</label>
              <select id="tech-filter" name="technology">
                <option value="all">All technologies</option>
                {techOptions.map((t) => (
                  <option value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div class="filter-field">
              <label for="status-filter">Status</label>
              <select id="status-filter" name="status">
                <option value="all">All statuses</option>
                {Object.entries(STATUS).map(([id, s]) => (
                  <option value={id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div class="filter-field">
              <label for="sort-filter">Sort by</label>
              <select id="sort-filter" name="sort">
                <option value="updated-desc">Recently updated</option>
                <option value="updated-asc">Oldest update</option>
                <option value="title-asc">Title, A to Z</option>
                <option value="title-desc">Title, Z to A</option>
                <option value="status">Status</option>
              </select>
            </div>
            <button class="clear-filter" id="clear-filter" type="button" hidden>
              Clear filters
            </button>
          </div>
          <p class="filter-summary" id="filter-summary" aria-live="polite">
            Showing all {LABS.length} labs, recently updated first.
          </p>
        </section>

        <div id="labs-content">
          {groups.map((g) => (
            <section
              class="lab-group"
              id={g.id}
              data-group-section
              aria-labelledby={`${g.id}-heading`}
            >
              <div class="section-heading">
                <p class="section-kicker">{g.name}</p>
                <h2 id={`${g.id}-heading`}>{g.blurb}</h2>
              </div>
              <div class="grid" data-grid>
                {LABS.filter((t) => t.group === g.id)
                  .sort(byUpdatedDesc)
                  .map((t) => (
                    <LabCard lab={t} />
                  ))}
              </div>
            </section>
          ))}
        </div>

        <p class="no-results" id="no-results" hidden role="status">
          No labs match those filters. Try changing a selection or clear the filters.
        </p>
        <Callout />
      </main>

      <footer class="wrap footer">
        <a href="https://rjmlaird.co.uk">← Back to rjmlaird.co.uk</a>
      </footer>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </body>
  </html>
);
