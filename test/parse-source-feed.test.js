import assert from "node:assert/strict";
import test from "node:test";
import { parseSourceFeed } from "../src/parse-source-feed.js";

const sampleRss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Original Show</title>
    <link>https://example.com/show</link>
    <item>
      <title>Episode One</title>
      <guid isPermaLink="false">episode-one-guid</guid>
      <link>https://example.com/show/episode-one</link>
      <description><![CDATA[Episode <strong>description</strong>.]]></description>
      <pubDate>Mon, 22 Apr 2024 10:00:00 GMT</pubDate>
      <enclosure url="https://media.example.com/episode-one.mp3" length="12345" type="audio/mpeg"/>
      <itunes:duration>34:12</itunes:duration>
      <itunes:episode>42</itunes:episode>
      <itunes:season>3</itunes:season>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:image href="https://example.com/episode-one.jpg"/>
    </item>
  </channel>
</rss>`;

test("parses a source podcast feed and preserves the original enclosure URL", () => {
  const parsed = parseSourceFeed(sampleRss, "https://feeds.example.com/original-show");

  assert.equal(parsed.title, "Original Show");
  assert.equal(parsed.sourceUrl, "https://feeds.example.com/original-show");
  assert.equal(parsed.items.length, 1);
  assert.deepEqual(parsed.items[0], {
    sourceFeedTitle: "Original Show",
    sourceFeedUrl: "https://feeds.example.com/original-show",
    title: "Episode One",
    guid: "episode-one-guid",
    link: "https://example.com/show/episode-one",
    description: "Episode <strong>description</strong>.",
    pubDate: "Mon, 22 Apr 2024 10:00:00 GMT",
    pubTimestamp: Date.parse("Mon, 22 Apr 2024 10:00:00 GMT"),
    enclosure: {
      url: "https://media.example.com/episode-one.mp3",
      length: "12345",
      type: "audio/mpeg"
    },
    duration: "34:12",
    episode: "42",
    season: "3",
    episodeType: "full",
    imageUrl: "https://example.com/episode-one.jpg"
  });
});

test("ignores items without audio enclosures", () => {
  const rss = `<?xml version="1.0"?><rss><channel><title>Text Feed</title><item><title>No Audio</title></item></channel></rss>`;

  const parsed = parseSourceFeed(rss, "https://feeds.example.com/text");

  assert.equal(parsed.items.length, 0);
});
