import { copyFile, mkdir, writeFile } from "node:fs/promises";
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
  const outputDir = path.dirname(outputPath);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, xml, "utf8");
  await copyArtwork(config, outputDir);
  await writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");
  await writeFile(path.join(outputDir, "index.html"), createIndexHtml(config, items.length), "utf8");

  return {
    outputPath,
    sourceFeedCount: sourceFeeds.length,
    itemCount: items.length
  };
}

async function copyArtwork(config, outputDir) {
  if (!config.artworkPath) {
    return;
  }

  await copyFile(path.resolve(config.artworkPath), path.join(outputDir, path.basename(config.artworkPath)));
}

function createIndexHtml(config, itemCount) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(config.title)}</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
        margin: 0;
        padding: 3rem 1.25rem;
      }
      main {
        max-width: 42rem;
        margin: 0 auto;
      }
      a { color: #0969da; }
      code {
        background: rgba(127, 127, 127, 0.15);
        border-radius: 4px;
        padding: 0.125rem 0.25rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(config.title)}</h1>
      ${config.imageUrl ? `<p><img src="${escapeHtml(config.imageUrl)}" alt="${escapeHtml(config.title)} artwork" style="display:block;width:min(18rem,100%);height:auto;"></p>` : ""}
      <p>${escapeHtml(config.description)}</p>
      <p>This generated podcast feed currently includes ${itemCount} recent episodes.</p>
      <p><a href="mega-feed.xml">Open the RSS feed</a></p>
      <p>Feed URL: <code>${escapeHtml(config.feedUrl)}</code></p>
    </main>
  </body>
</html>
`;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
