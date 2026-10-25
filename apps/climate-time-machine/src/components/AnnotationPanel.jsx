import { describe } from '../lib/narrative.js';
import { eventFor } from '../lib/annotations.js';

export default function AnnotationPanel({ P, year }) {
  const { kind, lines } = describe(P, year);
  const event = eventFor(year);
  const [lead, ...rest] = lines;

  return (
    <aside className="panel" aria-live="polite">
      <div className="panel-year">
        <span className="year">{year}</span>
        <span className={`badge ${kind}`}>{kind === 'measured' ? 'Measured' : 'Model projection'}</span>
      </div>
      <p className="lead">{lead}</p>
      {rest.map((l, i) => <p key={i}>{l}</p>)}

      {event && (
        <div className="event">
          <h3>{event.title}</h3>
          <p>{event.text}</p>
          <small>UK-wide event; local effects varied.</small>
        </div>
      )}

      {kind === 'projected' && (
        <p className="caveat">
          Projections come from {P.models.length} global climate models run under a high-emissions pathway (SSP5-8.5),
          adjusted to match the Met Office record for 1991–2020. They show what that pathway implies, not a forecast for any one year.
        </p>
      )}
    </aside>
  );
}
