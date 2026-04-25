import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { buildFeed } from "./build-feed.js";
import { loadConfig } from "./feed-sources.js";

const port = Number(process.env.PORT || 3000);

const server = http.createServer(async (request, response) => {
  if (request.url === "/" || request.url === "/feed.xml") {
    await serveFeed(response);
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found\n");
});

server.listen(port, () => {
  console.log(`Mega RSS preview server running at http://localhost:${port}/feed.xml`);
});

async function serveFeed(response) {
  try {
    const config = await loadConfig();
    const outputPath = path.resolve(config.outputPath);

    if (!existsSync(outputPath)) {
      await buildFeed();
    }

    response.writeHead(200, {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "no-cache"
    });
    createReadStream(outputPath).pipe(response);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(`${error.message}\n`);
  }
}
