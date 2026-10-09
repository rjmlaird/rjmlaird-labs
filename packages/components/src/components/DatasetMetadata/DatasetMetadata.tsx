import "./dataset-metadata.css";

export interface DatasetMetadataProps {
  source: string;
  coverage?: string;
  licence?: string;
  processing?: string;
}

/** Source, coverage, licence and processing notes in one predictable block. */
export function DatasetMetadata({ source, coverage, licence, processing }: DatasetMetadataProps) {
  return (
    <dl className="meta-list">
      <dt>Source</dt>
      <dd>{source}</dd>
      <dt>Coverage</dt>
      <dd>{coverage || "Not stated"}</dd>
      <dt>Licence</dt>
      <dd>{licence || "Not stated"}</dd>
      <dt>Processing</dt>
      <dd>{processing || "None recorded"}</dd>
    </dl>
  );
}
