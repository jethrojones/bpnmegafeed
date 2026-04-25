# BPN Mega Feed

Build one podcast RSS feed from many existing podcast RSS feeds.

The generated feed does not rehost or proxy audio. Each episode keeps its original `<enclosure url="...">`, so downloads from podcast apps go back to the original podcast host.

## Setup

```bash
npm install
```

## Transistor API Key

Do not commit your API key. Save it in a local `.env` file, which is ignored by Git:

```bash
cp .env.example .env
```

Then edit `.env` and replace `your_transistor_api_key_here` with your real Transistor API key.

The importer uses the official Transistor API `x-api-key` header and fetches show RSS URLs from `/v1/shows`.

## Seed Shows From Transistor

After creating `.env`, run:

```bash
npm run feeds:transistor
```

This replaces `feeds.json` with the RSS feed URLs for public Transistor shows on your account. To include private shows too, set this in `.env`:

```bash
TRANSISTOR_INCLUDE_PRIVATE=true
```

## Add Or Remove Shows

Edit `feeds.json` and add each source podcast RSS feed URL:

```json
[
  "https://feeds.transistor.fm/transformative-principal",
  "https://feeds.transistor.fm/resilient-schools",
  "https://feeds.transistor.fm/cybertraps-podcast"
]
```

## Configure The Network Feed

Edit `mega-feed.config.json`:

- `title`: network feed title
- `description`: network feed description
- `siteUrl`: website URL for the network
- `feedUrl`: final public URL where this RSS feed will live
- `ownerName` and `ownerEmail`: podcast owner metadata
- `imageUrl`: square podcast artwork URL
- `artworkPath`: local artwork file copied into the GitHub Pages output
- `category`: top-level podcast category
- `maxEpisodes`: maximum merged episodes to include
- `outputPath`: where the generated XML file is written

## Build

```bash
npm run build
```

This writes:

```text
public/mega-feed.xml
```

## Preview Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000/feed.xml
```

## Hosting

This repo is set up for GitHub Pages. The deployed feed URL is:

```text
https://jethrojones.github.io/bpnmegafeed/mega-feed.xml
```

The GitHub Actions workflow in `.github/workflows/pages.yml` builds and deploys the static feed on every push, on manual dispatch, and hourly.

If the repository has a `TRANSISTOR_API_KEY` secret, the workflow refreshes `feeds.json` from Transistor before building. Without that secret, it builds from the committed `feeds.json` list.

You can also host `public/mega-feed.xml` anywhere else that gives you a stable public URL, such as Cloudflare Pages, Netlify, or your own website.

For production, regenerate the file on a schedule, such as every 15-60 minutes. Podcast audio files remain hosted by the original podcast hosts because this tool only merges RSS metadata.

## Test

```bash
npm test
```
