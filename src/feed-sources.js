import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadJson(filePath) {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text);
}

export async function loadFeedUrls(filePath = "feeds.json") {
  const urls = await loadJson(path.resolve(filePath));

  if (!Array.isArray(urls)) {
    throw new Error(`${filePath} must contain an array of RSS feed URLs`);
  }

  const cleaned = urls
    .map((url) => String(url).trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    throw new Error(`${filePath} must contain at least one RSS feed URL`);
  }

  return cleaned;
}

export async function loadConfig(filePath = "mega-feed.config.json") {
  const config = await loadJson(path.resolve(filePath));

  for (const key of ["title", "description", "siteUrl"]) {
    if (!config[key]) {
      throw new Error(`${filePath} is missing required field: ${key}`);
    }
  }

  return {
    maxEpisodes: 250,
    outputPath: "public/mega-feed.xml",
    excludedFeedUrls: [],
    ...config
  };
}
