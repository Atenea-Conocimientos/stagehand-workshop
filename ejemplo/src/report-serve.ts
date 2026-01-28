/**
 * Simple static server for the Stagehand HTML report.
 */
import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { generateReport } from "./report.js";

const root = process.cwd();
const outputDir = path.resolve(root, "output");
const defaultFile = "report.html";
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? "9323");
const openBrowser =
  (process.env.OPEN_BROWSER ?? "true").toLowerCase() !== "false" &&
  (process.env.OPEN_BROWSER ?? "true").toLowerCase() !== "0" &&
  (process.env.OPEN_BROWSER ?? "true").toLowerCase() !== "no";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

function resolvePath(requestPath: string): string {
  const safePath = requestPath === "/" ? `/${defaultFile}` : requestPath;
  // Prefix with "." so absolute paths don't escape outputDir.
  const resolved = path.resolve(outputDir, `.${safePath}`);
  if (!resolved.startsWith(outputDir + path.sep)) {
    return "";
  }
  return resolved;
}

async function main() {
  try {
    await generateReport();
  } catch (err) {
    console.warn("Failed to auto-generate report:", err);
  }

  try {
    await fs.access(path.join(outputDir, defaultFile));
  } catch {
    console.warn(
      `No report found at ${path.join(outputDir, defaultFile)}. Run "npm run report" first.`
    );
  }

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? host}`);
    const filePath = resolvePath(decodeURIComponent(url.pathname));
    if (!filePath) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", getContentType(filePath));
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "no-store");

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      createReadStream(filePath).pipe(res);
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });

  server.listen(port, host, () => {
    const publicUrl = `http://${host}:${port}/`;
    console.log(`Report server running at ${publicUrl}`);
    if (openBrowser) {
      const openHost = host === "0.0.0.0" ? "127.0.0.1" : host;
      const openUrl = `http://${openHost}:${port}/`;
      try {
        if (process.platform === "darwin") {
          spawn("open", [openUrl], { stdio: "ignore", detached: true }).unref();
        } else if (process.platform === "win32") {
          spawn("cmd", ["/c", "start", "", openUrl], {
            stdio: "ignore",
            detached: true,
          }).unref();
        } else {
          spawn("xdg-open", [openUrl], { stdio: "ignore", detached: true }).unref();
        }
      } catch {
        console.warn("Could not auto-open browser.");
      }
    }
  });
}

main().catch((err) => {
  console.error("Failed to start report server:", err);
  process.exit(1);
});
