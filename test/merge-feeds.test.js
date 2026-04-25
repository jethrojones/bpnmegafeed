import assert from "node:assert/strict";
import test from "node:test";
import { mergeFeedItems } from "../src/merge-feeds.js";

function item(overrides) {
  return {
    sourceFeedTitle: "Show",
    title: "Episode",
    guid: "guid",
    link: "https://example.com/episode",
    description: "",
    pubDate: "Mon, 22 Apr 2024 10:00:00 GMT",
    pubTimestamp: Date.parse("Mon, 22 Apr 2024 10:00:00 GMT"),
    enclosure: {
      url: "https://media.example.com/episode.mp3",
      type: "audio/mpeg",
      length: "100"
    },
    ...overrides
  };
}

test("deduplicates by guid, sorts newest first, and applies max episode limit", () => {
  const merged = mergeFeedItems([
    { title: "Show A", items: [
      item({ title: "Older", guid: "older", pubTimestamp: 1000 }),
      item({ title: "Newest", guid: "newest", pubTimestamp: 3000 })
    ] },
    { title: "Show B", items: [
      item({ title: "Duplicate Newest", guid: "newest", pubTimestamp: 3000 }),
      item({ title: "Middle", guid: "middle", pubTimestamp: 2000 })
    ] }
  ], { maxEpisodes: 2 });

  assert.deepEqual(merged.map((episode) => episode.title), ["Newest", "Middle"]);
});

test("deduplicates by enclosure URL when guid is missing", () => {
  const merged = mergeFeedItems([
    { title: "Show A", items: [
      item({ title: "First Copy", guid: "", enclosure: { url: "https://media.example.com/shared.mp3" } })
    ] },
    { title: "Show B", items: [
      item({ title: "Second Copy", guid: "", enclosure: { url: "https://media.example.com/shared.mp3" } })
    ] }
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, "First Copy");
});
