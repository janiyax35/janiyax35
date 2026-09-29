/* Live telemetry panel, redrawn daily by .github/workflows/telemetry.yml.
   Run: node scripts/telemetry.mjs [--out dist]

   With GITHUB_TOKEN set it uses the GraphQL API (the Action's path).
   Without a token it falls back to the public REST API + the public
   contribution calendar, so you can preview it locally. */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { C, Doc, svg, chrome, esc } from "./lib.mjs";

const LOGIN = process.env.GH_LOGIN || "janiyax35";
const TOKEN = process.env.GITHUB_TOKEN || "";
const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "dist";
const DEGREE = { start: "2024-06-01", end: "2028-07-01", label: "BSc (Hons) IT – Cyber Security" };
const EXCLUDE_LANGS = new Set([]); // e.g. "HTML", "CSS" if markup crowds out real languages
const UA = { "User-Agent": `${LOGIN}-profile-telemetry` };

/* ------------------------------------------------------------- data */
async function viaGraphQL() {
  const q = `query($login:String!,$after:String){user(login:$login){
    followers{totalCount}
    all:repositories(ownerAffiliations:OWNER,privacy:PUBLIC){totalCount}
    repositories(first:100,after:$after,ownerAffiliations:OWNER,privacy:PUBLIC,isFork:false){
      pageInfo{hasNextPage endCursor}
      nodes{languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
    contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  const repos = [];
  let after = null, first;
  do {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...UA, Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, variables: { login: LOGIN, after } })
    });
    const json = await res.json();
    if (!res.ok || json.errors) throw new Error(`GraphQL: ${res.status} ${JSON.stringify(json.errors || json)}`);
    const u = json.data.user;
    first ??= u;
    repos.push(...u.repositories.nodes);
    after = u.repositories.pageInfo.hasNextPage ? u.repositories.pageInfo.endCursor : null;
  } while (after);

  const langs = {};
  for (const r of repos) for (const e of r.languages.edges) langs[e.node.name] = (langs[e.node.name] || 0) + e.size;
  const cal = first.contributionsCollection.contributionCalendar;
  return {
    repos: first.all.totalCount,
    followers: first.followers.totalCount,
    langs,
    total: cal.totalContributions,
    days: cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, n: d.contributionCount }))
  };
}

async function viaPublic() {
  const get = async (url) => {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res;
  };
  const user = await (await get(`https://api.github.com/users/${LOGIN}`)).json();
  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await (await get(`https://api.github.com/users/${LOGIN}/repos?per_page=100&type=owner&page=${page}`)).json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const langs = {};
  for (const r of repos) if (!r.fork && r.language) langs[r.language] = (langs[r.language] || 0) + Math.max(r.size, 1);

  // public contribution calendar (HTML): <td data-date id=…> + <tool-tip for=…>N contributions…
  const html = await (await get(`https://github.com/users/${LOGIN}/contributions`)).text();
  const dateById = {};
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const date = m[0].match(/data-date="([\d-]+)"/)?.[1], id = m[0].match(/\bid="([^"]+)"/)?.[1];
    if (date && id) dateById[id] = date;
  }
  const days = [];
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)</g)) {
    const date = dateById[m[1]];
    if (date) days.push({ date, n: /^(\d+)/.test(m[2].trim()) ? parseInt(m[2].trim(), 10) : 0 });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return {
    repos: user.public_repos,
    followers: user.followers,
    langs,
    total: days.reduce((s, d) => s + d.n, 0),
    days
  };
}

function streaks(days) {
  let longest = 0, run = 0;
  for (const d of days) { run = d.n > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let i = days.length - 1, current = 0;
  if (i >= 0 && days[i].n === 0) i--; // today isn't over yet
  for (; i >= 0 && days[i].n > 0; i--) current++;
  return { current, longest };
}

function weekly(days) {
  const weeks = [];
  for (let i = days.length; i > 0 && weeks.length < 52; i -= 7) {
    weeks.unshift(days.slice(Math.max(0, i - 7), i).reduce((s, d) => s + d.n, 0));
  }
  while (weeks.length < 52) weeks.unshift(0);
  return weeks;
}

/* ------------------------------------------------------------- draw */
function draw(data, now) {
  const d = new Doc(), W = 840, H = 376, X = 24;
  const out = [];
  const fmt = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  const { current, longest } = streaks(data.days);
  const active = data.days.filter((x) => x.n > 0).length;
  const panel = (x, y, w, h) => `<rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="${h - 1}" rx="3" fill="${C.panel2}" stroke="${C.line}"/>`;
  const label = (x, y, t, anchor = "start") => `<text class="m" x="${x}" y="${y}" text-anchor="${anchor}" font-size="10" letter-spacing="1.4" fill="${C.dim}">${esc(t)}</text>`;
  d.rule(`@keyframes fr{from,to{opacity:1}}@keyframes hide{from,to{opacity:0}}@keyframes rise{from{opacity:0;transform:translateY(4px)}}`);

  // stat tiles — values "decrypt" from random digits
  const tiles = [
    ["PUBLIC REPOS", fmt(data.repos), "owned", C.text],
    ["ACTIVE DAYS", fmt(active), `${Math.round((100 * active) / Math.max(1, data.days.length))}% of days`, C.text],
    ["FOLLOWERS", fmt(data.followers), "on github", C.text],
    ["CONTRIBUTIONS", fmt(data.total), "last 12 mo", C.text],
    ["STREAK", `${current}d`, `best ${longest}d`, C.lime]
  ];
  const tw = (W - 2 * X - 4 * 12) / 5;
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) % 10);
  tiles.forEach(([lab, val, sub, col], i) => {
    const x = X + i * (tw + 12), y = 54, t0 = 0.3 + i * 0.12;
    out.push(panel(x, y, tw, 74), label(x + 14, y + 22, lab));
    out.push(`<text class="m" x="${x + tw - 14}" y="${y + 58}" text-anchor="end" font-size="10" fill="${C.dim}">${esc(sub)}</text>`);
    const vt = (s, extra) => `<text class="s" x="${x + 14}" y="${y + 58}" font-size="28" font-weight="700" letter-spacing="-.8" ${extra}>${esc(s)}</text>`;
    for (let k = 0; k < 6; k++) {
      const s = [...val].map((ch) => (/\d/.test(ch) ? String(rnd()) : ch)).join("");
      out.push(vt(s, `fill="${C.lime}" fill-opacity=".7" style="opacity:0;animation:fr .07s linear ${(t0 + k * 0.07).toFixed(2)}s"`));
    }
    out.push(vt(val, `fill="${col}" style="animation:hide ${(t0 + 0.42).toFixed(2)}s linear"`));
  });

  // contribution signal — weekly bars
  const weeks = weekly(data.days), max = Math.max(1, ...weeks);
  const sx = X, sy = 144, sw = 500, sh = 164;
  out.push(panel(sx, sy, sw, sh), label(sx + 16, sy + 24, "SIGNAL · CONTRIBUTIONS / WEEK"), label(sx + sw - 16, sy + 24, "52 WEEKS", "end"));
  const bx0 = sx + 16, bw = sw - 32, base = sy + sh - 18, maxH = 100, slot = bw / 52;
  out.push(`<path d="M${bx0} ${base + .5}H${bx0 + bw}" stroke="${C.line2}"/>`);
  d.rule(`.bar{transform-box:fill-box;transform-origin:bottom;animation:grow .5s cubic-bezier(.2,.8,.2,1) both}@keyframes grow{from{transform:scaleY(0)}}
.sweep{animation:sweep 7s linear 2s infinite both}@keyframes sweep{from{transform:translateX(0);opacity:.6}90%{opacity:.6}to{transform:translateX(${bw}px);opacity:0}}`);
  weeks.forEach((v, i) => {
    const x = (bx0 + i * slot + (slot - 5.5) / 2).toFixed(1);
    if (!v) { out.push(`<rect x="${x}" y="${base - 2}" width="5.5" height="2" fill="${C.line2}"/>`); return; }
    const h = Math.max(3, (v / max) * maxH);
    out.push(`<rect class="bar" x="${x}" y="${(base - h).toFixed(1)}" width="5.5" height="${h.toFixed(1)}" rx="1" fill="${C.lime}" fill-opacity="${(0.35 + 0.65 * v / max).toFixed(2)}" style="animation-delay:${(0.6 + i * 0.018).toFixed(3)}s"><title>${v} contributions</title></rect>`);
  });
  out.push(`<rect class="sweep" x="${bx0}" y="${base - maxH - 4}" width="1" height="${maxH + 4}" fill="${C.lime}"/>`);
  if (!data.days.length) out.push(`<text class="m" x="${sx + sw / 2}" y="${sy + sh / 2 + 10}" text-anchor="middle" font-size="12" fill="${C.dim}">no signal</text>`);

  // top languages
  const lx = sx + sw + 12, lw = W - X - lx;
  const langs = Object.entries(data.langs).filter(([n]) => !EXCLUDE_LANGS.has(n)).sort((a, b) => b[1] - a[1]);
  const sum = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const top = langs.slice(0, 5), colors = [C.lime, C.cyan, C.amber, C.red, C.muted];
  out.push(panel(lx, sy, lw, sh), label(lx + 16, sy + 24, "TOP LANGUAGES · BY SIZE"));
  d.rule(`.lbar{transform-box:fill-box;transform-origin:left;animation:lbar .8s cubic-bezier(.2,.8,.2,1) both}@keyframes lbar{from{transform:scaleX(0)}}`);
  top.forEach(([name, v], i) => {
    const y = sy + 52 + i * 24, pct = (v / sum) * 100, trackW = lw - 32;
    out.push(`<text class="m" x="${lx + 16}" y="${y}" font-size="11.5" fill="${C.text}">${esc(name)}</text>
<text class="m" x="${lx + lw - 16}" y="${y}" text-anchor="end" font-size="11" fill="${C.dim}">${pct.toFixed(1)}%</text>
<rect x="${lx + 16}" y="${y + 5}" width="${trackW}" height="3" rx="1.5" fill="${C.line}"/>
<rect class="lbar" x="${lx + 16}" y="${y + 5}" width="${Math.max(2, (trackW * pct) / 100).toFixed(1)}" height="3" rx="1.5" fill="${colors[i]}" style="animation-delay:${(0.8 + i * 0.1).toFixed(1)}s"/>`);
  });

  // degree progress, segmented
  const s0 = Date.parse(DEGREE.start), s1 = Date.parse(DEGREE.end);
  const p = Math.min(1, Math.max(0, (now - s0) / (s1 - s0)));
  const segs = 48, gap = 3, segW = (W - 2 * X - (segs - 1) * gap) / segs, lit = Math.round(p * segs);
  const gy = 330;
  const endLabel = new Date(s1).toLocaleString("en", { month: "short", year: "numeric", timeZone: "UTC" });
  out.push(label(X, gy, "DEGREE PROGRESS"), `<text class="m" x="${W - X}" y="${gy}" text-anchor="end" font-size="10.5" fill="${C.muted}"><tspan fill="${C.lime}" font-weight="700">${Math.round(p * 100)}%</tspan> · ${esc(DEGREE.label)} · est. ${endLabel}</text>`);
  d.rule(`.seg{animation:fr .01s linear both}`);
  for (let i = 0; i < segs; i++) {
    const on = i < lit;
    out.push(`<rect x="${(X + i * (segW + gap)).toFixed(1)}" y="${gy + 12}" width="${segW.toFixed(1)}" height="10" rx="1" fill="${on ? C.lime : C.line}"${on ? ` fill-opacity="${(0.55 + 0.45 * (i / Math.max(1, lit))).toFixed(2)}" style="animation:rise .25s ease-out ${(1 + i * 0.025).toFixed(3)}s both"` : ""}/>`);
  }

  const stamp = new Date(now).toISOString().slice(0, 16).replace("T", " ");
  return svg({
    w: W, h: H, doc: d, fonts: ["jbm-400", "jbm-700", "sg-700"],
    title: "GitHub telemetry",
    desc: `${data.repos} public repos, ${data.followers} followers, ${active} active days, ${data.total} contributions in the last year, current streak ${current} days (longest ${longest}). Top languages: ${top.map(([n, v]) => `${n} ${((v / sum) * 100).toFixed(0)}%`).join(", ")}. Degree ${Math.round(p * 100)}% complete. Updated ${stamp} UTC.`,
    body: chrome(W, H, `telemetry — last scan ${stamp} UTC`, "auto · daily") + "\n" + out.join("\n")
  });
}

/* -------------------------------------------------------------- run */
const now = Date.now();
let data;
try {
  if (TOKEN) {
    try { data = await viaGraphQL(); }
    catch (err) { console.warn(`telemetry: GraphQL failed (${err.message}); using public data`); }
  }
  data ??= await viaPublic();
} catch (err) {
  console.error(`telemetry: ${err.message}`);
  process.exit(1); // fail the run, so the output branch keeps yesterday's panel
}
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "telemetry.svg"), draw(data, now));
console.log(`telemetry.svg → ${OUT}  (${data.repos} repos, ${data.total} contributions, ${Object.keys(data.langs).length} languages, ${data.days.length} days)`);
