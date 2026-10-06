import {
  CACHE_CONTROL,
  CDN_CACHE_CONTROL,
  errorResponse,
  getCachedGroup,
  parseCSVRecordCount,
  readGroup,
  UpstreamError
} from "./_lib/celestrak.js";

export default async function handler(request) {
  if (request.method !== "GET") {
    return errorResponse(
      405,
      "Method not allowed."
    );
  }

  const group = readGroup(request);

  if (group instanceof Response) {
    return group;
  }

  try {
    const result = await getCachedGroup(
      group,
      "CSV"
    );

    const recordCount =
      parseCSVRecordCount(result.text);

    if (recordCount === 0) {
      return errorResponse(
        502,
        `CelesTrak returned no element sets for "${group}".`,
        {
          group,
          format: "CSV",
          cached: result.stale === true
        }
      );
    }

    return new Response(result.text, {
      status: 200,
      headers: {
        "content-type":
          "text/csv; charset=utf-8",
        "cache-control": CACHE_CONTROL,
        "cdn-cache-control": CDN_CACHE_CONTROL,
        "x-celestrak-group": group,
        "x-celestrak-format": "CSV",
        "x-celestrak-record-count": String(
          recordCount
        ),
        "x-data-age-seconds": String(
          result.ageSeconds ?? ""
        ),
        "x-data-stale": result.stale
          ? "true"
          : "false"
      }
    });
  } catch (error) {
    console.error(
      "CelesTrak GP route failed",
      {
        group,
        error
      }
    );

    if (error instanceof UpstreamError) {
      return errorResponse(
        error.status || 503,
        error.message,
        {
          group,
          cached: false
        }
      );
    }

    return errorResponse(
      503,
      "Live CelesTrak data is unavailable and no cached copy exists.",
      {
        group,
        cached: false
      }
    );
  }
}
