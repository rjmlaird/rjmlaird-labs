type LaunchSiteProps = {
  code?: string;
  name?: string;
  country?: string;
  type?: string;
  status?: string;
};

type LaunchSiteFeature = GeoJSON.Feature<GeoJSON.Point, LaunchSiteProps>;
type LaunchSiteCollection = GeoJSON.FeatureCollection<GeoJSON.Point, LaunchSiteProps>;

const typeStyles: Record<string, { color: string; fillColor: string }> = {
  spaceport: { color: '#16a34a', fillColor: '#22c55e' },
  cosmodrome: { color: '#7c3aed', fillColor: '#8b5cf6' },
  range: { color: '#dc2626', fillColor: '#ef4444' },
  military: { color: '#475569', fillColor: '#64748b' },
  commercial: { color: '#0284c7', fillColor: '#0ea5e9' },
  sea: { color: '#059669', fillColor: '#10b981' },
  mobile: { color: '#9333ea', fillColor: '#a855f7' },
  airspace: { color: '#ea580c', fillColor: '#f97316' },
  unknown: { color: '#334155', fillColor: '#475569' },
};

function markerIcon(L: typeof import('leaflet'), fillColor: string) {
  return L.divIcon({
    className: 'launch-site-marker',
    html: `<div style="background-color:${fillColor};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function popupHtml(props: LaunchSiteProps) {
  const style = typeStyles[props.type ?? 'unknown'] ?? typeStyles.unknown;

  return `
    <div style="font-family:sans-serif;color:#1e293b;min-width:220px;">
      <h3 style="margin:0 0 4px 0;font-size:1rem;font-weight:700;">
        ${props.name ?? 'Unknown Launch Site'}
        ${props.code ? `<span style="font-weight:400;color:#64748b;">(${props.code})</span>` : ''}
      </h3>
      <p style="margin:0 0 4px 0;font-size:.8rem;text-transform:uppercase;font-weight:700;color:${style.color};">
        ${props.type ?? 'unknown'} • ${props.status ?? 'unknown'}
      </p>
      <p style="margin:0;font-size:.9rem;color:#334155;">${props.country ?? ''}</p>
    </div>
  `;
}

export async function initLaunchSitesMap() {
  if (typeof window === 'undefined') return;

  const L = await import('leaflet');

  const response = await fetch('/data/launch-sites.json');
  const data = (await response.json()) as LaunchSiteCollection | LaunchSiteFeature[];

  const geojson: LaunchSiteCollection = Array.isArray(data)
    ? { type: 'FeatureCollection', features: data }
    : data;

  const map = L.map('map').setView([30, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  }).addTo(map);

  const layer = L.geoJSON(geojson as any, {
    pointToLayer: (feature, latlng) => {
      const props = (feature as LaunchSiteFeature).properties || {};
      const style = typeStyles[props.type ?? 'unknown'] ?? typeStyles.unknown;
      return L.marker(latlng, { icon: markerIcon(L, style.fillColor) });
    },
    onEachFeature: (feature, layer) => {
      const props = (feature as LaunchSiteFeature).properties || {};
      layer.bindPopup(popupHtml(props));
    },
  }).addTo(map);

  const bounds = layer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.15));
  }
}
