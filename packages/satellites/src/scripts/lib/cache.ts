const DATABASE_NAME = "satellites-data-cache";
const DATABASE_VERSION = 1;
const STORE_NAME = "responses";

const FRESH_TTL_MS =
  2 * 60 * 60 * 1000;

const FAILURE_COOLDOWN_MS =
  2 * 60 * 60 * 1000;

type CacheRecord = {
  url: string;
  body: string;
  storedAt: number;
};

type BlockRecord = {
  url: string;
  status: number;
  blockedUntil: number;
};

type CacheInfo = {
  exists: boolean;
  fresh: boolean;
  stale: boolean;
  blocked: boolean;
  status: number | null;
  ageSeconds: number | null;
};

const memoryCache = new Map<
  string,
  CacheRecord
>();

const blockedUrls = new Map<
  string,
  BlockRecord
>();

const inFlight = new Map<
  string,
  Promise<string>
>();

function hasIndexedDb(): boolean {
  return (
    typeof window !== "undefined" &&
    "indexedDB" in window
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(
        new Error("IndexedDB is unavailable.")
      );
      return;
    }

    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        database.createObjectStore(
          STORE_NAME,
          { keyPath: "url" }
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error("Could not open IndexedDB.")
      );
    };
  });
}

async function readPersistent(
  url: string
): Promise<CacheRecord | null> {
  if (!hasIndexedDb()) {
    return null;
  }

  try {
    const database = await openDatabase();

    return await new Promise(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            STORE_NAME,
            "readonly"
          );

        const store =
          transaction.objectStore(
            STORE_NAME
          );

        const request = store.get(url);

        request.onsuccess = () => {
          resolve(
            (request.result as CacheRecord | undefined) ??
              null
          );
        };

        request.onerror = () => {
          reject(
            request.error ??
              new Error(
                "Could not read IndexedDB."
              )
          );
        };

        transaction.oncomplete = () => {
          database.close();
        };
      }
    );
  } catch {
    return null;
  }
}

async function writePersistent(
  record: CacheRecord
): Promise<void> {
  if (!hasIndexedDb()) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            STORE_NAME,
            "readwrite"
          );

        transaction
          .objectStore(STORE_NAME)
          .put(record);

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };

        transaction.onerror = () => {
          reject(
            transaction.error ??
              new Error(
                "Could not write IndexedDB."
              )
          );
        };
      }
    );
  } catch {
    // Memory cache remains available.
  }
}

async function deletePersistent(
  url: string
): Promise<void> {
  if (!hasIndexedDb()) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            STORE_NAME,
            "readwrite"
          );

        transaction
          .objectStore(STORE_NAME)
          .delete(url);

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };

        transaction.onerror = () => {
          reject(
            transaction.error ??
              new Error(
                "Could not delete IndexedDB record."
              )
          );
        };
      }
    );
  } catch {
    // Ignore cache deletion failures.
  }
}

async function getRecord(
  url: string
): Promise<CacheRecord | null> {
  const inMemory = memoryCache.get(url);

  if (inMemory) {
    return inMemory;
  }

  const persistent =
    await readPersistent(url);

  if (persistent) {
    memoryCache.set(url, persistent);
  }

  return persistent;
}

async function storeRecord(
  url: string,
  body: string
): Promise<CacheRecord> {
  const record: CacheRecord = {
    url,
    body,
    storedAt: Date.now()
  };

  memoryCache.set(url, record);

  await writePersistent(record);

  return record;
}

function isFresh(
  record: CacheRecord | null
): boolean {
  return Boolean(
    record &&
      Date.now() - record.storedAt <
        FRESH_TTL_MS
  );
}

function ageSeconds(
  record: CacheRecord | null
): number | null {
  if (!record) {
    return null;
  }

  return Math.max(
    0,
    Math.round(
      (Date.now() - record.storedAt) /
        1000
    )
  );
}

function getBlock(
  url: string
): BlockRecord | null {
  const block = blockedUrls.get(url);

  if (!block) {
    return null;
  }

  if (
    block.blockedUntil <= Date.now()
  ) {
    blockedUrls.delete(url);
    return null;
  }

  return block;
}

function blockUrl(
  url: string,
  status: number
): void {
  blockedUrls.set(url, {
    url,
    status,
    blockedUntil:
      Date.now() + FAILURE_COOLDOWN_MS
  });
}

function describeStatus(
  status: number
): string {
  if (status === 403) {
    return (
      "CelesTrak rejected the request with HTTP 403. " +
      "Automatic retries are paused."
    );
  }

  if (status === 502) {
    return (
      "The data service returned HTTP 502. " +
      "Automatic retries are paused."
    );
  }

  return (
    `The data service returned HTTP ${status}. ` +
    "Automatic retries are paused."
  );
}

async function requestNetwork(
  url: string
): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "text/plain, text/csv"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    blockUrl(url, response.status);

    throw new Error(
      describeStatus(response.status)
    );
  }

  const body = await response.text();

  if (!body.trim()) {
    blockUrl(url, 502);

    throw new Error(
      "The data service returned an empty response. " +
        "Automatic retries are paused."
    );
  }

  return body;
}

async function load(
  url: string
): Promise<string> {
  const cached = await getRecord(url);

  if (isFresh(cached)) {
    return cached!.body;
  }

  const block = getBlock(url);

  if (block) {
    if (cached) {
      return cached.body;
    }

    throw new Error(
      "Live data is temporarily unavailable. " +
        "Automatic retries are paused."
    );
  }

  try {
    const body = await requestNetwork(url);

    await storeRecord(url, body);

    return body;
  } catch (error) {
    if (cached) {
      return cached.body;
    }

    throw error;
  }
}

/**
 * Fetch text through the browser cache.
 *
 * Requests with the same URL share one in-flight request.
 * Fresh cached data is returned without a network request.
 * Stale cached data is returned when the upstream request fails.
 */
export function cachedFetchText(
  url: string
): Promise<string> {
  const existing = inFlight.get(url);

  if (existing) {
    return existing;
  }

  const request = load(url).finally(() => {
    inFlight.delete(url);
  });

  inFlight.set(url, request);

  return request;
}

/**
 * Inspect cache state for debugging.
 */
export async function getCacheInfo(
  url: string
): Promise<CacheInfo> {
  const record = await getRecord(url);
  const block = getBlock(url);

  return {
    exists: Boolean(record),
    fresh: isFresh(record),
    stale: Boolean(
      record && !isFresh(record)
    ),
    blocked: Boolean(block),
    status: block?.status ?? null,
    ageSeconds: ageSeconds(record)
  };
}

/**
 * Remove one cached URL and clear its cooldown.
 */
export async function clearCache(
  url: string
): Promise<void> {
  memoryCache.delete(url);
  blockedUrls.delete(url);
  inFlight.delete(url);

  await deletePersistent(url);
}

/**
 * Clear all in-memory entries and all IndexedDB entries.
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();
  blockedUrls.clear();
  inFlight.clear();

  if (!hasIndexedDb()) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            STORE_NAME,
            "readwrite"
          );

        transaction
          .objectStore(STORE_NAME)
          .clear();

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };

        transaction.onerror = () => {
          reject(
            transaction.error ??
              new Error(
                "Could not clear IndexedDB."
              )
          );
        };
      }
    );
  } catch {
    // Ignore cache clearing failures.
  }
}

/**
 * Clear only the local cooldown without deleting
 * the cached data. Use sparingly during development.
 */
export function clearRequestCooldown(
  url: string
): void {
  blockedUrls.delete(url);
}
