import { writeFile } from "node:fs/promises";
import { loadDotEnv } from "./env.js";
import { loadConfig } from "./feed-sources.js";
import { extractFeedUrls, fetchTransistorShows } from "./transistor-shows.js";

await loadDotEnv();

const config = await loadConfig();
const includePrivate = process.env.TRANSISTOR_INCLUDE_PRIVATE === "true";
const shows = await fetchTransistorShows({
  apiKey: process.env.TRANSISTOR_API_KEY,
  includePrivate
});
const feeds = extractFeedUrls(shows, {
  excludedFeedUrls: config.excludedFeedUrls
});

if (feeds.length === 0) {
  throw new Error("No Transistor show feed URLs found");
}

await writeFile("feeds.json", `${JSON.stringify(feeds.map((show) => show.feedUrl), null, 2)}\n`);

for (const show of feeds) {
  console.log(`${show.title}: ${show.feedUrl}`);
}

console.log(`\nWrote ${feeds.length} feed URLs to feeds.json`);
