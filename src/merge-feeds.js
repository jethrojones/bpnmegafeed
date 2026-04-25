export function mergeFeedItems(sourceFeeds, options = {}) {
  const seen = new Set();
  const merged = [];

  for (const feed of sourceFeeds) {
    for (const item of feed.items || []) {
      const key = dedupeKey(item);

      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.push(item);
    }
  }

  merged.sort((a, b) => safeTimestamp(b) - safeTimestamp(a));

  if (Number.isFinite(options.maxEpisodes) && options.maxEpisodes > 0) {
    return merged.slice(0, options.maxEpisodes);
  }

  return merged;
}

function dedupeKey(item) {
  if (item.guid) {
    return `guid:${item.guid}`;
  }

  if (item.enclosure?.url) {
    return `enclosure:${item.enclosure.url}`;
  }

  if (item.link) {
    return `link:${item.link}`;
  }

  return "";
}

function safeTimestamp(item) {
  return Number.isFinite(item.pubTimestamp) ? item.pubTimestamp : 0;
}
