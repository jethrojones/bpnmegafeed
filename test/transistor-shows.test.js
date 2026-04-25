import assert from "node:assert/strict";
import test from "node:test";
import { extractFeedUrls, fetchTransistorShows } from "../src/transistor-shows.js";

test("extracts feed URLs from Transistor show resources and sorts by title", () => {
  const feeds = extractFeedUrls([
    { attributes: { title: "Z Show", feed_url: "https://feeds.transistor.fm/z-show" } },
    { attributes: { title: "No Feed", feed_url: "" } },
    { attributes: { title: "A Show", feed_url: "https://feeds.transistor.fm/a-show" } }
  ]);

  assert.deepEqual(feeds, [
    { title: "A Show", feedUrl: "https://feeds.transistor.fm/a-show" },
    { title: "Z Show", feedUrl: "https://feeds.transistor.fm/z-show" }
  ]);
});

test("fetches paginated Transistor shows with API key header", async () => {
  const requested = [];
  const fetcher = async (url, options) => {
    requested.push({ url: String(url), options });

    const page = url.searchParams.get("pagination[page]");
    const data = page === "1"
      ? [{ attributes: { title: "First", feed_url: "https://feeds.transistor.fm/first" } }]
      : [{ attributes: { title: "Second", feed_url: "https://feeds.transistor.fm/second" } }];

    return {
      ok: true,
      json: async () => ({
        data,
        meta: {
          currentPage: Number(page),
          totalPages: 2
        }
      })
    };
  };

  const shows = await fetchTransistorShows({
    apiKey: "secret",
    includePrivate: false,
    fetcher
  });

  assert.equal(requested.length, 2);
  assert.equal(requested[0].options.headers["x-api-key"], "secret");
  assert.equal(new URL(requested[0].url).searchParams.get("private"), "false");
  assert.deepEqual(shows.map((show) => show.attributes.title), ["First", "Second"]);
});
