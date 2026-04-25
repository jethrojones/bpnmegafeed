import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "#cdata",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true
});

export function parseSourceFeed(xml, sourceUrl) {
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel;

  if (!channel) {
    throw new Error(`No RSS channel found in ${sourceUrl}`);
  }

  const title = asText(channel.title) || sourceUrl;
  const imageUrl = getFeedImage(channel);
  const rawItems = asArray(channel.item);
  const items = rawItems
    .map((rawItem) => normalizeItem(rawItem, title, sourceUrl, imageUrl))
    .filter(Boolean);

  return {
    title,
    sourceUrl,
    imageUrl,
    items
  };
}

function normalizeItem(rawItem, sourceFeedTitle, sourceFeedUrl, sourceFeedImageUrl) {
  const enclosure = normalizeEnclosure(rawItem.enclosure);

  if (!enclosure?.url) {
    return null;
  }

  const pubDate = asText(rawItem.pubDate);

  return {
    sourceFeedTitle,
    sourceFeedUrl,
    title: asText(rawItem.title),
    guid: asText(rawItem.guid),
    link: asText(rawItem.link),
    description: asText(rawItem.description),
    pubDate,
    pubTimestamp: pubDate ? Date.parse(pubDate) : 0,
    enclosure,
    duration: asText(rawItem["itunes:duration"]),
    episode: asText(rawItem["itunes:episode"]),
    season: asText(rawItem["itunes:season"]),
    episodeType: asText(rawItem["itunes:episodeType"]),
    imageUrl: getItunesImage(rawItem["itunes:image"]) || sourceFeedImageUrl
  };
}

function normalizeEnclosure(enclosure) {
  const first = asArray(enclosure)[0];

  if (!first) {
    return null;
  }

  return {
    url: first["@_url"] || "",
    length: first["@_length"] || "",
    type: first["@_type"] || "audio/mpeg"
  };
}

function getItunesImage(image) {
  const first = asArray(image)[0];

  if (!first) {
    return "";
  }

  return first["@_href"] || first["@_url"] || "";
}

function getFeedImage(channel) {
  return getItunesImage(channel["itunes:image"]) || asText(channel.image?.url);
}

function asArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function asText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return value["#text"] || value["#cdata"] || "";
}
