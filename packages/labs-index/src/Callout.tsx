import type { FC } from "hono/jsx";

export interface CalloutProps {
  appsHref?: string;
  toolsHref?: string;
}

const CARDS = [
  {
    key: "apps",
    icon: "A",
    label: "Apps",
    title: "Interactive applications",
    text: "More complete, user-facing experiences for exploring data, solving problems and working with information over time.",
    cta: "Explore apps",
  },
  {
    key: "tools",
    icon: "T",
    label: "Tools",
    title: "Focused utilities",
    text: "Smaller, task-specific utilities, calculators and templates designed to make a particular job quicker, clearer or easier.",
    cta: "Explore tools",
  },
] as const;

// Styles live in ./callout-styles and are appended to the page CSS string.
// The heading id is fixed, so render at most one Callout per page.
export const Callout: FC<CalloutProps> = ({
  appsHref = "https://apps.rjmlaird.co.uk/",
  toolsHref = "https://tools.rjmlaird.co.uk/",
}) => {
  const hrefs = { apps: appsHref, tools: toolsHref };

  return (
    <section class="apps-tools" aria-labelledby="apps-tools-title">
      <div class="apps-tools__intro">
        <p class="apps-tools__eyebrow">Digital projects</p>
        <h2 id="apps-tools-title">Apps and tools</h2>
        <p>
          Explore practical software, focused utilities and small digital systems built for useful
          tasks, clearer information and better decisions.
        </p>
      </div>

      <ul class="apps-tools__grid" role="list">
        {CARDS.map((card) => (
          <li class={`project-card project-card--${card.key}`}>
            <div class="project-card__icon" aria-hidden="true">
              {card.icon}
            </div>
            <div>
              <p class="project-card__label">{card.label}</p>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
            <a class="project-card__link" href={hrefs[card.key]}>
              {card.cta} <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Callout;
