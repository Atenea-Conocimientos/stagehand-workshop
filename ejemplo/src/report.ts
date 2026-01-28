/**
 * Generate a simple HTML report from Stagehand inference logs.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SummaryEntry = {
  act_inference_type?: string;
  extract_inference_type?: string;
  timestamp?: string;
  LLM_input_file?: string;
  LLM_output_file?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  inference_time_ms?: number;
};

type SummaryFile = {
  act_summary?: SummaryEntry[];
  extract_summary?: SummaryEntry[];
};

type ExtractResponse = {
  requestId?: string;
  modelResponse?: string;
  rawResponse?: Record<string, unknown>;
};

const root = process.cwd();
const inferenceDir = path.join(root, "inference_summary");
const extractDir = path.join(inferenceDir, "extract_summary");
const actDir = path.join(inferenceDir, "act_summary");

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function listFiles(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

function pickLatest(files: string[], suffix: string): string | null {
  const filtered = files.filter((f) => f.endsWith(suffix)).sort();
  if (filtered.length === 0) return null;
  return filtered[filtered.length - 1];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function formatRunId(runId: string): string {
  const match = runId.match(
    /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(\d{3})$/
  );
  if (!match) return runId;
  const [, yyyy, mm, dd, hh, mi, ss, ms] = match;
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
}

function formatNumber(value?: number): string {
  return typeof value === "number" ? value.toLocaleString("en-US") : "n/a";
}

function formatMs(value?: number): string {
  return typeof value === "number" ? `${value} ms` : "n/a";
}

function sectionCard(title: string, body: string): string {
  return `
    <section class="card">
      <div class="card-header">
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="card-body">
        ${body}
      </div>
    </section>
  `;
}

export async function generateReport() {
  const extractSummary = await readJson<SummaryFile>(
    path.join(extractDir, "extract_summary.json")
  );
  const actSummary = await readJson<SummaryFile>(
    path.join(actDir, "act_summary.json")
  );

  const extractFiles = await listFiles(extractDir);
  const actFiles = await listFiles(actDir);

  const latestExtractFile = pickLatest(extractFiles, "_extract_response.txt");
  const latestActFile = pickLatest(actFiles, "_act_response.txt");

  const extractResponse = latestExtractFile
    ? await readJson<ExtractResponse>(path.join(extractDir, latestExtractFile))
    : null;

  const rawResponse = extractResponse?.rawResponse ?? null;
  const posts = Array.isArray(rawResponse?.posts) ? (rawResponse?.posts as any[]) : null;

  const extractEntries = extractSummary?.extract_summary ?? [];
  const lastExtract = extractEntries
    .filter((e) => e.extract_inference_type === "extract")
    .slice(-1)[0];
  const lastMetadata = extractEntries
    .filter((e) => e.extract_inference_type === "metadata")
    .slice(-1)[0];

  const actEntries = actSummary?.act_summary ?? [];
  const lastAct = actEntries.slice(-1)[0];

  const runId = latestExtractFile
    ? latestExtractFile.replace("_extract_response.txt", "")
    : "n/a";
  const runLabel = runId === "n/a" ? "n/a" : formatRunId(runId);

  const metricsBody = `
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Extract prompt tokens</div>
        <div class="metric-value">${formatNumber(lastExtract?.prompt_tokens)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Extract completion tokens</div>
        <div class="metric-value">${formatNumber(lastExtract?.completion_tokens)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Extract inference time</div>
        <div class="metric-value">${formatMs(lastExtract?.inference_time_ms)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Metadata inference time</div>
        <div class="metric-value">${formatMs(lastMetadata?.inference_time_ms)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Act prompt tokens</div>
        <div class="metric-value">${formatNumber(lastAct?.prompt_tokens)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Act inference time</div>
        <div class="metric-value">${formatMs(lastAct?.inference_time_ms)}</div>
      </div>
    </div>
  `;

  let resultsBody = "";
  if (posts && posts.length > 0) {
    const rows = posts
      .map((post, index) => {
        const title = escapeHtml(String(post.titulo ?? post.title ?? "n/a"));
        const urlRaw = post.url ? String(post.url) : "";
        const url = urlRaw
          ? `<a href="${escapeHtml(normalizeUrl(urlRaw))}" target="_blank" rel="noopener">${escapeHtml(urlRaw)}</a>`
          : "<span class=\"muted\">n/a</span>";
        const points = escapeHtml(String(post.puntos ?? post.points ?? "n/a"));
        const author = escapeHtml(String(post.autor ?? post.author ?? "n/a"));
        return `
          <tr>
            <td class="num" data-label="#">${index + 1}</td>
            <td class="title" data-label="Title">${title}</td>
            <td data-label="URL">${url}</td>
            <td data-label="Points">${points}</td>
            <td data-label="Author">${author}</td>
          </tr>
        `;
      })
      .join("");
    resultsBody = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>URL</th>
              <th>Points</th>
              <th>Author</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  } else if (rawResponse) {
    resultsBody = `
      <div class="empty">
        No posts found. Showing raw response.
      </div>
      <pre>${escapeHtml(JSON.stringify(rawResponse, null, 2))}</pre>
    `;
  } else {
    resultsBody = `
      <div class="empty">
        No inference data found. Run the demo with logInferenceToFile: true.
      </div>
    `;
  }

  const rawBlock = rawResponse
    ? `<pre>${escapeHtml(JSON.stringify(rawResponse, null, 2))}</pre>`
    : `<div class="empty">No raw response available.</div>`;

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Stagehand Report</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600;700&display=swap");
      :root {
        --bg: #f5efe6;
        --ink: #1a1714;
        --muted: #6b5f55;
        --accent: #d86b3d;
        --accent-2: #2a7a67;
        --card: #fff8ef;
        --border: #e3d6c6;
        --shadow: 0 18px 40px rgba(26, 23, 20, 0.12);
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Space Grotesk", "Trebuchet MS", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(1200px 800px at 10% -10%, #ffe3c7 0%, transparent 55%),
          radial-gradient(900px 900px at 90% 10%, #c7efe3 0%, transparent 50%),
          linear-gradient(180deg, #f5efe6 0%, #f2e7da 60%, #efe2d4 100%);
        min-height: 100vh;
      }
      .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 48px 24px 80px;
      }
      header {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 28px;
      }
      .kicker {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent-2);
      }
      h1 {
        font-family: "Instrument Serif", "Georgia", serif;
        font-size: clamp(2.4rem, 2.8vw, 3.6rem);
        margin: 0;
        letter-spacing: -0.02em;
      }
      .sub {
        color: var(--muted);
        font-size: 1rem;
        max-width: 720px;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 8px;
      }
      .pill {
        background: var(--card);
        border: 1px solid var(--border);
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 0.9rem;
      }
      .grid {
        display: grid;
        gap: 20px;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 22px;
        box-shadow: var(--shadow);
        overflow: hidden;
        animation: rise 0.9s ease both;
      }
      .card:nth-of-type(1) { animation-delay: 0.08s; }
      .card:nth-of-type(2) { animation-delay: 0.16s; }
      .card:nth-of-type(3) { animation-delay: 0.24s; }
      .card-header {
        padding: 18px 22px;
        border-bottom: 1px dashed var(--border);
        background: linear-gradient(90deg, rgba(216, 107, 61, 0.08), rgba(42, 122, 103, 0.06));
      }
      .card-header h2 {
        margin: 0;
        font-size: 1.2rem;
      }
      .card-body {
        padding: 20px 22px 24px;
      }
      .metrics {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      .metric {
        background: #fdf7ee;
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 14px 16px;
      }
      .metric-label {
        color: var(--muted);
        font-size: 0.85rem;
        margin-bottom: 8px;
      }
      .metric-value {
        font-size: 1.2rem;
        font-weight: 600;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }
      thead th {
        text-align: left;
        font-size: 0.8rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 12px 10px;
        border-bottom: 1px solid var(--border);
      }
      tbody td {
        padding: 12px 10px;
        border-bottom: 1px solid rgba(227, 214, 198, 0.5);
        vertical-align: top;
      }
      tbody tr:hover {
        background: rgba(216, 107, 61, 0.08);
      }
      .num {
        width: 42px;
        font-weight: 600;
      }
      .title {
        font-weight: 600;
      }
      .table-wrap {
        overflow-x: auto;
      }
      a {
        color: var(--accent);
        text-decoration: none;
        font-weight: 600;
      }
      a:hover {
        text-decoration: underline;
      }
      pre {
        background: #1e1b18;
        color: #f3ede6;
        padding: 16px;
        border-radius: 16px;
        overflow-x: auto;
        font-size: 0.85rem;
      }
      .muted {
        color: var(--muted);
      }
      .empty {
        padding: 16px;
        border-radius: 12px;
        border: 1px dashed var(--border);
        color: var(--muted);
        background: rgba(255, 248, 239, 0.6);
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (max-width: 720px) {
        .page {
          padding: 32px 16px 60px;
        }
        thead {
          display: none;
        }
        table,
        tbody,
        tr,
        td {
          display: block;
          width: 100%;
        }
        tbody tr {
          border-bottom: 1px solid var(--border);
          padding: 12px 0;
        }
        tbody td {
          border: none;
          padding: 6px 0;
        }
        tbody td::before {
          content: attr(data-label);
          display: block;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 4px;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header>
        <div class="kicker">Stagehand Report</div>
        <h1>Inference Summary</h1>
        <p class="sub">
          A quick view of the latest run from inference_summary. Open this file in your browser after each demo run.
        </p>
        <div class="meta">
          <div class="pill">Run: ${escapeHtml(runLabel)}</div>
          <div class="pill">Extract file: ${escapeHtml(latestExtractFile ?? "n/a")}</div>
          <div class="pill">Act file: ${escapeHtml(latestActFile ?? "n/a")}</div>
        </div>
      </header>

      <div class="grid">
        ${sectionCard("Metrics", metricsBody)}
        ${sectionCard("Results", resultsBody)}
        ${sectionCard("Raw Response", rawBlock)}
      </div>
    </div>
  </body>
</html>`;

  const outputDir = path.join(root, "output");
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "report.html");
  await fs.writeFile(outputPath, html, "utf8");

  console.log(`Report written to ${outputPath}`);
  return outputPath;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  generateReport().catch((err) => {
    console.error("Failed to generate report:", err);
    process.exit(1);
  });
}
