import assert from "node:assert/strict";
import test from "node:test";
import { XMLParser } from "fast-xml-parser";
import { createRssXml } from "../src/rss-xml.js";

test("creates podcast RSS XML with channel metadata and original enclosure URLs", () => {
  const xml = createRssXml({
    title: "Network Feed",
    description: "All shows in one place.",
    siteUrl: "https://example.com",
    feedUrl: "https://example.com/feed.xml",
    language: "en-us",
    author: "Network",
    ownerName: "Owner",
    ownerEmail: "owner@example.com",
    imageUrl: "https://example.com/art.jpg",
    category: "Education"
  }, [
    {
      sourceFeedTitle: "Original Show",
      sourceFeedUrl: "https://feeds.example.com/show",
      title: "A & B",
      guid: "guid-1",
      link: "https://example.com/episode",
      description: "Description with <b>markup</b> & characters.",
      pubDate: "Mon, 22 Apr 2024 10:00:00 GMT",
      enclosure: {
        url: "https://media.example.com/audio.mp3?download=1&source=show",
        length: "123",
        type: "audio/mpeg"
      },
      duration: "12:34",
      episode: "5",
      season: "1",
      episodeType: "full",
      imageUrl: "https://example.com/episode.jpg"
    }
  ]);

  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /<itunes:author>Network<\/itunes:author>/);
  assert.match(xml, /<itunes:owner>/);
  assert.match(xml, /<itunes:duration>12:34<\/itunes:duration>/);
  assert.match(xml, /<itunes:image href="https:\/\/example.com\/episode.jpg"\/>/);
  assert.match(xml, /url="https:\/\/media.example.com\/audio.mp3\?download=1&amp;source=show"/);

  const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
  assert.equal(parsed.rss.channel.item.title, "A & B");
  assert.equal(parsed.rss.channel.item["@_sourceFeed"], undefined);
});
