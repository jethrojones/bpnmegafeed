# Mega RSS Feed Design

## Goal

Build one podcast RSS feed that combines episodes from many existing podcast RSS feeds without rehosting audio. Downloads from the combined feed must use each episode's original enclosure URL so host analytics continue to record downloads at the source host.

## Approach

The project will be a small Node.js tool that reads source feed URLs from `feeds.json`, reads network-level RSS metadata from `mega-feed.config.json`, fetches each source feed, normalizes episodes, deduplicates repeated items, sorts newest first, and writes `public/mega-feed.xml`.

An optional local server will expose the generated XML at `/feed.xml` for previewing. Production hosting should serve the static XML file from a stable public URL and regenerate it on a schedule.

## Components

- `feeds.json`: an editable list of source podcast feed URLs.
- `mega-feed.config.json`: network feed title, description, language, owner details, artwork URL, site URL, output path, and episode limit.
- `src/feed-sources.js`: load and validate config and feed URL lists.
- `src/parse-source-feed.js`: parse RSS XML into source feed metadata and episode objects.
- `src/merge-feeds.js`: deduplicate, sort, and limit normalized episodes.
- `src/rss-xml.js`: generate podcast RSS XML while preserving original audio enclosure URLs.
- `src/build-feed.js`: command-line build entrypoint.
- `src/server.js`: optional local preview server.
- `test/*.test.js`: focused unit tests for parsing, merging, and RSS generation.

## Data Flow

1. Load feed URLs and config.
2. Fetch all source feeds.
3. Parse each feed into normalized episodes.
4. Preserve each item's original `enclosure.url`.
5. Deduplicate by GUID, enclosure URL, then link.
6. Sort by publication date descending.
7. Write a combined RSS feed to `public/mega-feed.xml`.

## Error Handling

Invalid config or an empty feed list should fail the build with a clear error. A source feed that fails to fetch should be reported and skipped so one broken show does not prevent the network feed from updating. If all feeds fail or produce no episodes, the build should fail.

## Testing

Tests should verify that source episodes parse correctly, original enclosure URLs are preserved, duplicate episodes are collapsed, episodes sort newest first, the configured max episode count is applied, and generated RSS contains podcast-safe XML with expected channel and item tags.
