import "./article-card.css";

export interface ArticleCardProps {
  title?: string;
  /** Topic and reading time, e.g. "Earth observation, 6 min read". */
  meta?: string;
  summary?: string;
  tags?: string[];
  href?: string;
  imageSrc?: string;
  /** Empty string marks the image as decorative. */
  imageAlt?: string;
  headingLevel?: 2 | 3 | 4;
}

/** Handles long titles, missing images and missing tags without breaking layout. */
export function ArticleCard({
  title,
  meta,
  summary,
  tags = [],
  href,
  imageSrc,
  imageAlt = "",
  headingLevel = 3,
}: ArticleCardProps) {
  const Heading = `h${headingLevel}` as const;
  const label = title?.trim() || "Untitled draft";
  return (
    <article className="card">
      {imageSrc ? (
        <img className="card__img" src={imageSrc} alt={imageAlt} loading="lazy" />
      ) : (
        <div className="card__ph" role="img" aria-label="Image placeholder">
          No image
        </div>
      )}
      {meta && <span className="card__meta">{meta}</span>}
      <Heading className="card__title">{href ? <a href={href}>{label}</a> : label}</Heading>
      {summary && <p className="card__summary">{summary}</p>}
      {tags.length > 0 && (
        <ul className="card__tags">
          {tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
