import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig, loadFeedUrls } from "./feed-sources.js";
import { mergeFeedItems } from "./merge-feeds.js";
import { parseSourceFeed } from "./parse-source-feed.js";
import { createRssXml } from "./rss-xml.js";

const FETCH_TIMEOUT_MS = 15000;

export async function buildFeed() {
  const config = await loadConfig();
  const feedUrls = await loadFeedUrls();
  const sourceFeeds = await fetchSourceFeeds(feedUrls);
  const items = mergeFeedItems(sourceFeeds, { maxEpisodes: config.maxEpisodes });

  if (items.length === 0) {
    throw new Error("No podcast episodes found in source feeds");
  }

  const xml = createRssXml(config, items);
  const outputPath = path.resolve(config.outputPath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, xml, "utf8");

  return {
    outputPath,
    sourceFeedCount: sourceFeeds.length,
    itemCount: items.length
  };
}

async function fetchSourceFeeds(feedUrls) {
  const results = await Promise.all(feedUrls.map(fetchSourceFeed));
  const sourceFeeds = results.filter((result) => result.ok).map((result) => result.feed);
  const failures = results.filter((result) => !result.ok);

  for (const failure of failures) {
    console.warn(`Skipping ${failure.url}: ${failure.error.message}`);
  }

  if (sourceFeeds.length === 0) {
    throw new Error("All source feeds failed");
  }

  return sourceFeeds;
}

async function fetchSourceFeed(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "mega-podcast-rss/0.1.0"
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    return {
      ok: true,
      feed: parseSourceFeed(xml, url)
    };
  } catch (error) {
    return {
      ok: false,
      url,
      error
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildFeed()
    .then((result) => {
      console.log(`Wrote ${result.itemCount} episodes from ${result.sourceFeedCount} feeds to ${result.outputPath}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
