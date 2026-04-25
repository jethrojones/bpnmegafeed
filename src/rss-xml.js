export function createRssXml(config, items) {
  const channel = [
    tag("title", config.title),
    tag("link", config.siteUrl),
    tag("description", config.description),
    tag("language", config.language || "en-us"),
    tag("lastBuildDate", new Date().toUTCString()),
    tag("generator", "mega-podcast-rss"),
    selfLink(config.feedUrl),
    tag("itunes:author", config.author || config.title),
    tag("itunes:summary", config.description),
    owner(config),
    image(config),
    category(config.category),
    ...items.map(itemXml)
  ].filter(Boolean).join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    ${channel}
  </channel>
</rss>
`;
}

function itemXml(item) {
  return `<item>
      ${[
        tag("title", item.title),
        tag("link", item.link),
        guid(item),
        tag("description", cdata(item.description), { raw: true }),
        tag("content:encoded", cdata(item.description), { raw: true }),
        tag("pubDate", item.pubDate),
        enclosure(item.enclosure),
        tag("itunes:author", item.sourceFeedTitle),
        tag("itunes:duration", item.duration),
        tag("itunes:episode", item.episode),
        tag("itunes:season", item.season),
        tag("itunes:episodeType", item.episodeType),
        item.imageUrl ? `<itunes:image href="${escapeAttribute(item.imageUrl)}"/>` : "",
        item.sourceFeedTitle ? `<source url="${escapeAttribute(item.sourceFeedUrl)}">${escapeText(item.sourceFeedTitle)}</source>` : ""
      ].filter(Boolean).join("\n      ")}
    </item>`;
}

function selfLink(feedUrl) {
  if (!feedUrl) {
    return "";
  }

  return `<atom:link href="${escapeAttribute(feedUrl)}" rel="self" type="application/rss+xml"/>`;
}

function owner(config) {
  if (!config.ownerName && !config.ownerEmail) {
    return "";
  }

  return `<itunes:owner>
      ${[
        tag("itunes:name", config.ownerName),
        tag("itunes:email", config.ownerEmail)
      ].filter(Boolean).join("\n      ")}
    </itunes:owner>`;
}

function image(config) {
  if (!config.imageUrl) {
    return "";
  }

  return `<image>
      ${[
        tag("url", config.imageUrl),
        tag("title", config.title),
        tag("link", config.siteUrl)
      ].filter(Boolean).join("\n      ")}
    </image>
    <itunes:image href="${escapeAttribute(config.imageUrl)}"/>`;
}

function category(value) {
  if (!value) {
    return "";
  }

  return `<itunes:category text="${escapeAttribute(value)}"/>`;
}

function guid(item) {
  const value = item.guid || item.enclosure?.url || item.link;

  if (!value) {
    return "";
  }

  return `<guid isPermaLink="false">${escapeText(value)}</guid>`;
}

function enclosure(value) {
  if (!value?.url) {
    return "";
  }

  const attrs = [
    `url="${escapeAttribute(value.url)}"`,
    `length="${escapeAttribute(value.length || "0")}"`,
    `type="${escapeAttribute(value.type || "audio/mpeg")}"`
  ];

  return `<enclosure ${attrs.join(" ")}/>`;
}

function tag(name, value, options = {}) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const content = options.raw ? value : escapeText(value);
  return `<${name}>${content}</${name}>`;
}

function cdata(value = "") {
  return `<![CDATA[${String(value).replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeText(value)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
