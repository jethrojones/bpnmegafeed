const TRANSISTOR_SHOWS_URL = "https://api.transistor.fm/v1/shows";

export async function fetchTransistorShows({
  apiKey,
  includePrivate = false,
  perPage = 100,
  fetcher = fetch
}) {
  if (!apiKey) {
    throw new Error("TRANSISTOR_API_KEY is required");
  }

  const shows = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = new URL(TRANSISTOR_SHOWS_URL);
    url.searchParams.set("pagination[page]", String(page));
    url.searchParams.set("pagination[per]", String(perPage));
    url.searchParams.append("fields[show][]", "title");
    url.searchParams.append("fields[show][]", "feed_url");

    if (!includePrivate) {
      url.searchParams.set("private", "false");
    }

    const response = await fetcher(url, {
      headers: {
        "x-api-key": apiKey,
        "user-agent": "bpn-mega-feed/0.1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Transistor API request failed: HTTP ${response.status}`);
    }

    const body = await response.json();
    shows.push(...(body.data || []));
    totalPages = Number(body.meta?.totalPages || page);
    page += 1;
  } while (page <= totalPages);

  return shows;
}

export function extractFeedUrls(shows, { excludedFeedUrls = [] } = {}) {
  const excluded = new Set(excludedFeedUrls.map((url) => String(url).trim()).filter(Boolean));

  return shows
    .map((show) => ({
      title: show.attributes?.title || show.id || "",
      feedUrl: show.attributes?.feed_url || ""
    }))
    .filter((show) => show.feedUrl)
    .filter((show) => !excluded.has(show.feedUrl))
    .sort((a, b) => a.title.localeCompare(b.title));
}
