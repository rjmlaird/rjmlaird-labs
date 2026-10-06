// Shared helpers for:
//   api/gp.js
//   api/satcat.js
//
// This file is deliberately under api/_lib so it is not exposed as a
// Vercel route.

export const SATCAT_UPSTREAM =
  "https://celestrak.org/pub/satcat.csv";

const GP_ENDPOINT =
  "https://celestrak.org/NORAD/elements/gp.php";

const USER_AGENT =
  "rjmlaird-labs-satellites/1.0 " +
  "(+https://satellites.labs.rjmlaird.co.uk)";

const GP_REFRESH_MS =
  2 * 60 * 60 * 1000;

const REQUEST_TIMEOUT_MS = 25_000;

const BASE_GROUPS = [
  "active",
  "stations",
  "visual",
  "gps-ops",
  "starlink",
  "oneweb",
  "weather",
  "science",
  "geo",
  "last-30-days"
];

const EXTRA_GROUPS = (
  process.env.EXTRA_GROUPS || ""
)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const GROUPS = new Set([
  ...BASE_GROUPS,
  ...EXTRA_GROUPS
]);

// Browser-facing cache policy.
export const CACHE_CONTROL =
  "public, max-age=300, " +
  "stale-while-revalidate=86400, " +
  "stale-if-error=604800";

// Vercel-specific shared-CDN policy.
// CDN-Cache-Control is retained by Vercel's CDN.
export const CDN_CACHE_CONTROL =
  "public, s-maxage=7200, " +
  "stale-while-revalidate=86400, " +
  "stale-if-error=604800";

export const NO_STORE_CACHE_CONTROL =
  "no-store";

const memoryCache = new Map();
const inflightRequests = new Map();

export class UpstreamError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

export function gpUpstream(
  group,
  format = "CSV"
) {
  const url = new URL(GP_ENDPOINT);

  url.searchParams.set("GROUP", group);
  url.searchParams.set(
    "FORMAT",
    format.toUpperCase()
  );

  return url.toString();
}

export function upstreamHeaders() {
  return {
    "user-agent": USER_AGENT
  };
}

export async function fetchUpstream(
  url,
  timeoutMs = REQUEST_TIMEOUT_MS
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: upstreamHeaders(),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new UpstreamError(
          "CelesTrak rejected the request with HTTP 403. " +
            "Automatic retries are disabled; cached data should be used.",
          403
        );
      }

      if (response.status === 406) {
        throw new UpstreamError(
          "CelesTrak rejected the requested response format with HTTP 406.",
          406
        );
      }

      throw new UpstreamError(
        `CelesTrak responded with HTTP ${response.status}.`,
        502
      );
    }

    const text = await response.text();

    if (!text.trim()) {
      throw new UpstreamError(
        "CelesTrak returned an empty response.",
        502
      );
    }

    return text;
  } catch (error) {
    if (error instanceof UpstreamError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new UpstreamError(
        "CelesTrak timed out.",
        504
      );
    }

    throw new UpstreamError(
      "Could not reach CelesTrak.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }
}

function cacheKey(group, format) {
  return `${format.toUpperCase()}:${group}`;
}

function readCache(group, format) {
  return memoryCache.get(
    cacheKey(group, format)
  );
}

function writeCache(group, format, text) {
  const entry = {
    group,
    format: format.toUpperCase(),
    text,
    fetchedAt: Date.now()
  };

  memoryCache.set(
    cacheKey(group, format),
    entry
  );

  return entry;
}

function isFresh(entry) {
  return Boolean(
    entry &&
      Date.now() - entry.fetchedAt <
        GP_REFRESH_MS
  );
}

function ageSeconds(entry) {
  if (!entry) {
    return null;
  }

  return Math.max(
    0,
    Math.round(
      (Date.now() - entry.fetchedAt) / 1000
    )
  );
}

async function fetchOnce(group, format) {
  const key = cacheKey(group, format);
  const existing = inflightRequests.get(key);

  if (existing) {
    return existing;
  }

  const request = fetchUpstream(
    gpUpstream(group, format)
  )
    .then((text) => {
      return writeCache(group, format, text);
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);

  return request;
}

/**
 * Return the latest allowed data for a group.
 *
 * Behaviour:
 * - fresh in-memory data: return it;
 * - stale in-memory data: make one refresh request;
 * - successful refresh: replace the cache;
 * - failed refresh with stale data: return stale data;
 * - failed refresh without data: throw.
 */
export async function getCachedGroup(
  group,
  format = "CSV"
) {
  const normalisedGroup = String(group)
    .trim()
    .toLowerCase();

  const normalisedFormat = String(format)
    .trim()
    .toUpperCase();

  if (!GROUPS.has(normalisedGroup)) {
    throw new Error(
      `Unknown CelesTrak group "${normalisedGroup}".`
    );
  }

  const existing = readCache(
    normalisedGroup,
    normalisedFormat
  );

  if (isFresh(existing)) {
    return {
      ...existing,
      stale: false,
      ageSeconds: ageSeconds(existing)
    };
  }

  try {
    const refreshed = await fetchOnce(
      normalisedGroup,
      normalisedFormat
    );

    return {
      ...refreshed,
      stale: false,
      ageSeconds: ageSeconds(refreshed)
    };
  } catch (error) {
    if (existing) {
      return {
        ...existing,
        stale: true,
        ageSeconds: ageSeconds(existing),
        upstreamError:
          error instanceof Error
            ? error.message
            : "CelesTrak refresh failed."
      };
    }

    throw error;
  }
}

export function clearGroupCache(group, format = "CSV") {
  memoryCache.delete(
    cacheKey(
      String(group).trim().toLowerCase(),
      String(format).trim().toUpperCase()
    )
  );
}

export function clearAllCache() {
  memoryCache.clear();
}

export function errorResponse(
  status,
  message,
  extra = {}
) {
  return new Response(
    JSON.stringify({
      error: message,
      ...extra
    }),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control":
          NO_STORE_CACHE_CONTROL
      }
    }
  );
}

export function readGroup(request) {
  const requestUrl = getRequestUrl(request);

  const raw = requestUrl.searchParams.get("group");

  const group = (raw || "")
    .trim()
    .toLowerCase();

  if (!group) {
    return errorResponse(
      400,
      "Missing ?group= parameter."
    );
  }

  if (!GROUPS.has(group)) {
    return errorResponse(
      400,
      `Unknown group "${group}".`
    );
  }

  return group;
}

function getRequestUrl(request) {
  const rawUrl =
    typeof request?.url === "string"
      ? request.url
      : "/";

  if (/^[a-z][a-z\d+\-.]*:/i.test(rawUrl)) {
    return new URL(rawUrl);
  }

  const host =
    request?.headers?.get?.("host") ||
    request?.headers?.host ||
    "localhost";

  const protocol =
    request?.headers?.get?.("x-forwarded-proto") ||
    request?.headers?.["x-forwarded-proto"] ||
    "http";

  return new URL(
    rawUrl,
    `${protocol}://${host}`
  );
}


export function splitCSVLine(line) {
  const result = [];
  let current = "";
  let quoted = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character = line[index];

    if (character === '"') {
      if (
        quoted &&
        line[index + 1] === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      character === "," &&
      !quoted
    ) {
      result.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  result.push(current);

  return result;
}

export function csvCell(value) {
  const text = String(value ?? "");

  return /[",\n\r]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export function parseTleNoradIds(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const ids = [];

  for (
    let index = 0;
    index + 2 < lines.length;
    index += 3
  ) {
    const line1 = lines[index + 1];
    const line2 = lines[index + 2];

    if (
      !line1.startsWith("1 ") ||
      !line2.startsWith("2 ")
    ) {
      continue;
    }

    const id1 = Number(
      line1.slice(2, 7).trim()
    );

    const id2 = Number(
      line2.slice(2, 7).trim()
    );

    if (
      Number.isInteger(id1) &&
      id1 > 0 &&
      id1 === id2 &&
      !ids.includes(id1)
    ) {
      ids.push(id1);
    }
  }

  return ids;
}

export function parseCSVRecordCount(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  return Math.max(0, lines.length - 1);
}
