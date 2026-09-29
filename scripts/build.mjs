/* Draws every static SVG in assets/ from scripts/content.mjs.
   Run: node scripts/build.mjs          (no dependencies, Node 18+) */

import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { C, Doc, svg, chrome, corners, typed, appear, textWidth, wrap, esc, mono } from "./lib.mjs";
import * as K from "./content.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");
mkdirSync(OUT, { recursive: true });

const files = {};
const emit = (name, content) => { files[name] = content; };

/* deterministic PRNG so rebuilding doesn't churn the scramble frames */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/* ------------------------------------------------------------------ hero */
function hero() {
  const d = new Doc(), W = 840, H = 300, X = 28;
  const out = [chrome(W, H, "jd@janith: ~", K.profile.site)];

  // slow CRT scanline drifting down the window
  d.rule(`.scan{animation:scan 7s linear infinite}@keyframes scan{from{transform:translateY(0)}to{transform:translateY(300px)}}`);
  out.push(`<defs><clipPath id="win"><rect x="1" y="37" width="${W - 2}" height="${H - 38}" rx="5"/></clipPath>
<linearGradient id="sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.lime}" stop-opacity="0"/><stop offset=".5" stop-color="${C.lime}" stop-opacity=".05"/><stop offset="1" stop-color="${C.lime}" stop-opacity="0"/></linearGradient></defs>
<g clip-path="url(#win)"><rect class="scan" x="0" y="-24" width="${W}" height="60" fill="url(#sl)"/></g>`);

  // $ whoami
  const ps = 14, cw = mono(ps), py = 78;
  out.push(`<text class="m" x="${X}" y="${py}" font-size="${ps}" fill="${C.lime}">jd<tspan fill="${C.dim}">:</tspan><tspan fill="${C.cyan}">~</tspan><tspan fill="${C.dim}">$</tspan></text>`);
  out.push(typed(d, { x: X + 6 * cw, y: py, text: "whoami", size: ps, start: 0.5, dur: 0.55 }));

  // name: scramble → resolve, then an occasional red/cyan glitch
  const NS = 64, NY = 152, LS = -1.6, full = K.profile.name.join(" ");
  const nameText = (fill, extra = "") =>
    `<text class="s" x="${X}" y="${NY}" font-size="${NS}" font-weight="700" letter-spacing="${LS}" ${extra}>${esc(K.profile.name[0])} <tspan fill="${fill}">${esc(K.profile.name[1])}</tspan></text>`;
  const glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*+=?@<>/";
  const r = rng(35), F = 9, t0 = 1.15, step = 0.075;
  d.rule(`@keyframes fr{from,to{opacity:1}}@keyframes hide{from,to{opacity:0}}`);
  for (let k = 0; k < F; k++) {
    const fixed = Math.floor((full.length * k) / F);
    const s = [...full].map((ch, i) => (ch === " " || i < fixed ? ch : glyphs[Math.floor(r() * glyphs.length)])).join("");
    out.push(`<text class="s" x="${X}" y="${NY}" font-size="${NS}" font-weight="700" letter-spacing="${LS}" fill="${C.lime}" fill-opacity=".85" style="opacity:0;animation:fr ${step}s linear ${(t0 + k * step).toFixed(3)}s">${esc(s)}</text>`);
  }
  const reveal = (t0 + F * step).toFixed(3);
  d.rule(`.gl-r,.gl-c{opacity:0;animation:glr 8s linear 4s infinite}.gl-c{animation-name:glc}
@keyframes glr{0%,88%,100%{opacity:0;transform:none}89%{opacity:.8;transform:translate(-4px,0)}91%{opacity:.8;transform:translate(3px,-1px)}92.5%{opacity:0}}
@keyframes glc{0%,88%,100%{opacity:0;transform:none}89%{opacity:.8;transform:translate(4px,1px)}91%{opacity:.8;transform:translate(-3px,0)}92.5%{opacity:0}}
.nm{animation:hide ${reveal}s linear}`);
  out.push(`<g class="gl-r">${nameText(C.red, `fill="${C.red}"`)}</g><g class="gl-c">${nameText(C.cyan, `fill="${C.cyan}"`)}</g>`);
  out.push(`<g class="nm">${nameText(C.lime, `fill="${C.text}"`)}</g>`);

  // headline
  out.push(`<text class="m ${appear(d, 2.0)}" x="${X}" y="190" font-size="14" fill="${C.muted}">${esc(K.profile.line)}</text>`);

  // > focus: <role>  — types, holds, erases, next (12 s loop)
  const fy = 228, fx = X + 9 * cw, roles = K.profile.focus, P = roles.length * 3, S = 2.4;
  out.push(`<text class="m ${appear(d, S - 0.2)}" x="${X}" y="${fy}" font-size="${ps}" fill="${C.lime}">&gt;<tspan fill="${C.dim}"> focus:</tspan></text>`);
  roles.forEach((role, i) => {
    const n = role.length, dist = (n * cw).toFixed(1), a = (100 / roles.length) * i, span = 100 / roles.length;
    const pct = (v) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`;
    const vis = d.keyframes(i === 0
      ? `0%,${pct(span - 0.5)}{opacity:1}${pct(span - 0.49)},100%{opacity:0}`
      : `0%,${pct(a - 0.01)}{opacity:0}${pct(a)},${pct(a + span - 0.5)}{opacity:1}${pct(a + span - 0.49)},100%{opacity:0}`);
    const mv = d.keyframes(`0%${a > 0 ? `,${pct(a)}` : ""}{transform:translateX(0);animation-timing-function:steps(${n},end)}${pct(a + span * 0.2)},${pct(a + span * 0.8)}{transform:translateX(${dist}px);animation-timing-function:steps(${n},end)}${pct(a + span * 0.9)},100%{transform:translateX(0)}`);
    const g = d.id("r"), c = d.id("c");
    d.rule(`.${g}{opacity:${i === 0 ? 1 : 0};animation:${vis} ${P}s linear ${S}s infinite both}.${c}{transform:translateX(${i === 0 ? dist : 0}px);animation:${mv} ${P}s linear ${S}s infinite both}`);
    out.push(`<g class="${g}"><text class="m" x="${fx}" y="${fy}" font-size="${ps}" fill="${C.text}">${esc(role)}</text><g class="${c}"><rect x="${fx}" y="${fy - 14}" width="${(n + 1) * cw + 2}" height="19" fill="${C.term}"/><rect x="${fx}" y="${fy - 13}" width="${cw}" height="17" fill="${C.lime}" style="animation:blink 1s steps(1) infinite"/></g></g>`);
  });

  // radar (the site's scan dial)
  const cx = 726, cy = 146, R = 74;
  const pt = (deg, rad) => { const t = (deg - 90) * Math.PI / 180; return [(cx + rad * Math.cos(t)).toFixed(2), (cy + rad * Math.sin(t)).toFixed(2)]; };
  const ticks = Array.from({ length: 24 }, (_, i) => { const [x1, y1] = pt(i * 15, R); const [x2, y2] = pt(i * 15, R - (i % 6 ? 4 : 8)); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  const wedges = [0.26, 0.16, 0.1, 0.06, 0.03].map((o, i) => {
    const [x1, y1] = pt(-i * 9, R), [x2, y2] = pt(-(i + 1) * 9, R);
    return `<path d="M${cx} ${cy}L${x1} ${y1}A${R} ${R} 0 0 0 ${x2} ${y2}Z" fill="${C.lime}" fill-opacity="${o}"/>`;
  }).join("");
  const [lx, ly] = pt(0, R);
  const R0 = 0.3; // radar start delay
  d.rule(`.sweep{transform-origin:${cx}px ${cy}px;animation:spin 4s linear ${R0}s infinite}@keyframes spin{to{transform:rotate(360deg)}}
.blip{transform-box:fill-box;transform-origin:center;opacity:.25;animation:blip 4s linear infinite both}
@keyframes blip{0%{opacity:1;transform:scale(1.9)}12%{transform:scale(1)}70%,100%{opacity:.25}}`);
  const blips = [[58, 0.58, C.lime], [148, 0.82, C.red], [236, 0.4, C.lime], [312, 0.7, C.cyan]].map(([deg, f, col]) => {
    const [bx, by] = pt(deg, R * f);
    return `<circle class="blip" cx="${bx}" cy="${by}" r="3" fill="${col}" style="animation-delay:${(R0 + (deg / 360) * 4).toFixed(2)}s"/>`;
  }).join("");
  out.push(`<g class="${appear(d, 0.3, 0.6)}">
<circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.panel2}" stroke="${C.line2}"/>
<circle cx="${cx}" cy="${cy}" r="${R * 0.66}" fill="none" stroke="${C.line}"/><circle cx="${cx}" cy="${cy}" r="${R * 0.33}" fill="none" stroke="${C.line}"/>
<path d="M${cx - R} ${cy}H${cx + R}M${cx} ${cy - R}V${cy + R}" stroke="${C.line}"/>
<path d="${ticks}" stroke="${C.line2}"/>
<g class="sweep">${wedges}<path d="M${cx} ${cy}L${lx} ${ly}" stroke="${C.lime}" stroke-width="1.5"/></g>
${blips}
<circle cx="${cx}" cy="${cy}" r="2.5" fill="${C.lime}"/>
<text class="m" x="${cx}" y="${cy + R + 22}" text-anchor="middle" font-size="10.5" letter-spacing="1.6" fill="${C.dim}">THM · TOP 7% GLOBAL</text>
</g>`);

  // status bar
  d.rule(`.ping{transform-box:fill-box;transform-origin:center;animation:ping 2s ease-out infinite}@keyframes ping{from{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(3)}}`);
  out.push(`<g class="${appear(d, 2.2)}"><path d="M20 252.5H${W - 20}" stroke="${C.line}"/>
<circle class="ping" cx="33" cy="274" r="4" fill="none" stroke="${C.lime}"/><circle cx="33" cy="274" r="4" fill="${C.lime}"/>
<text class="m" x="46" y="278" font-size="12" fill="${C.muted}">${esc(K.profile.status)}</text>
<text class="m" x="${W - 22}" y="278" text-anchor="end" font-size="12" fill="${C.dim}">${esc(K.profile.location)}</text></g>`);

  emit("hero.svg", svg({
    w: W, h: H, doc: d, fonts: ["jbm-400", "sg-700"],
    title: "Janith Deshan — Cybersecurity Undergraduate",
    desc: `Animated terminal: whoami resolves to JANITH DESHAN. ${K.profile.line}. Focus: ${K.profile.focus.join(", ")}. ${K.profile.status}.`,
    body: out.join("\n")
  }));
}

/* --------------------------------------------------------------- buttons */
const ICONS = {
  arrow: (x, y, c) => `<path d="M${x + 2} ${y + 12}L${x + 12} ${y + 2}M${x + 4.5} ${y + 2}H${x + 12}V${y + 9.5}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="square"/>`,
  prompt: (x, y, c) => `<text class="m" x="${x}" y="${y + 11.5}" font-size="13" font-weight="700" fill="${c}">&gt;_</text>`,
  at: (x, y, c) => `<text class="m" x="${x + 1}" y="${y + 12}" font-size="14" font-weight="700" fill="${c}">@</text>`,
  in: (x, y, c) => `<rect x="${x + .75}" y="${y + .75}" width="12.5" height="12.5" rx="2" fill="none" stroke="${c}" stroke-width="1.5"/><text class="m" x="${x + 7}" y="${y + 10.3}" text-anchor="middle" font-size="8" font-weight="700" fill="${c}">in</text>`,
  cup: (x, y, c) => `<path d="M${x + 1} ${y + 5}h9v3.5a4.5 4.5 0 0 1-4.5 4.5h0A4.5 4.5 0 0 1 ${x + 1} ${y + 8.5}zM${x + 10} ${y + 6}h1.2a2 2 0 0 1 0 4H${x + 10}" fill="none" stroke="${c}" stroke-width="1.5"/><path class="steam" d="M${x + 4} ${y + 3}q-1-1.5 0-3M${x + 7} ${y + 3}q-1-1.5 0-3" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`
};
const iconW = { arrow: 14, prompt: 16, at: 14, in: 14, cup: 14 };

function button(file, label, icon, primary = false) {
  const d = new Doc(), H = 40, fs = 12, ls = 1.4, pad = 18, gap = 10;
  const tw = textWidth(label, "jbm-700", fs, ls) - ls;
  const W = Math.round(pad + iconW[icon] + gap + tw + pad);
  const fg = primary ? C.bg : C.text, ic = primary ? C.bg : C.lime;
  d.rule(`.shine{animation:shine 6s ease-in-out 1s infinite both}@keyframes shine{0%{transform:translateX(0)}25%,100%{transform:translateX(${W + 80}px)}}
.steam{animation:steam 2.4s ease-in-out infinite}@keyframes steam{0%,100%{opacity:.35;transform:translateY(0)}50%{opacity:1;transform:translateY(-1px)}}`);
  const body = `<defs><clipPath id="b"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="3"/></clipPath>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${primary ? .45 : .09}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="3" fill="${primary ? C.lime : C.panel}" stroke="${primary ? C.lime : C.line2}"/>
${primary ? "" : corners(0.5, 0.5, W - 1, H - 1, C.lime, 7)}
<g clip-path="url(#b)"><rect class="shine" x="-70" y="0" width="60" height="${H}" fill="url(#g)" transform="skewX(-20)"/></g>
${ICONS[icon](pad, 13, ic)}
<text class="m up" x="${pad + iconW[icon] + gap}" y="24.5" font-size="${fs}" font-weight="700" letter-spacing="${ls}" fill="${fg}">${esc(label)}</text>`;
  emit(file, svg({ w: W, h: H, doc: d, fonts: ["jbm-700"], title: label, desc: `${label} button`, body }));
}

/* --------------------------------------------------------- section heads */
/* heads sit on GitHub's own page colour, so they come in two themes */
const HEAD_THEME = {
  dark: { ink: C.text, accent: C.lime, meta: C.dim, rule: C.line2 },
  light: { ink: "#1F2328", accent: "#4F7A00", meta: "#59636E", rule: "#D0D7DE" }
};

function sectionHead(key, theme = "dark") {
  const [idx, title, meta] = K.sections[key];
  const T = HEAD_THEME[theme];
  const d = new Doc(), W = 840, H = 60, ty = 40;
  const tw = textWidth(title, "sg-700", 30, -1);
  const mw = mono(12) * (meta.length + 2);
  const x1 = 50 + tw + 18, x2 = W - 2 - mw - 18, len = x2 - x1;
  d.rule(`.ln{transform-origin:${x1}px 0;animation:draw 1.1s cubic-bezier(.2,.8,.2,1) .2s both}@keyframes draw{from{transform:scaleX(0)}}
.pk{animation:pk 5s cubic-bezier(.5,0,.5,1) 1.3s infinite both}@keyframes pk{0%{transform:translateX(0);opacity:0}6%{opacity:1}54%{opacity:1}60%,100%{transform:translateX(${(len - 8).toFixed(1)}px);opacity:0}}`);
  const body = `<defs><linearGradient id="lg" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0"><stop offset="0" stop-color="${T.rule}"/><stop offset="1" stop-color="${T.rule}" stop-opacity="0"/></linearGradient></defs>
<rect x=".5" y="19.5" width="34" height="22" rx="2" fill="none" stroke="${T.accent}" stroke-opacity=".45"/>
<text class="m" x="17.5" y="34.5" text-anchor="middle" font-size="12" fill="${T.accent}">${idx}</text>
<text class="s" x="50" y="${ty}" font-size="30" font-weight="700" letter-spacing="-1" fill="${T.ink}">${esc(title)}</text>
<rect class="ln" x="${x1}" y="30" width="${len}" height="1" fill="url(#lg)"/>
<rect class="pk" x="${x1}" y="29.5" width="8" height="2" fill="${T.accent}"/>
<text class="m" x="${W - 2}" y="35" text-anchor="end" font-size="12" fill="${T.meta}"><tspan fill="${T.accent}">$</tspan> ${esc(meta)}</text>`;
  emit(`head-${key}${theme === "light" ? "-light" : ""}.svg`, svg({ w: W, h: H, doc: d, fonts: ["jbm-400", "sg-700"], title: `${idx} ${title}`, desc: `Section ${idx}: ${title}`, body }));
}

/* ------------------------------------------------------------ nmap scan */
function nmap() {
  const d = new Doc(), W = 840, X = 28, fs = 13, cw = mono(fs), lh = 21;
  const out = [];
  let y = 72;
  out.push(`<text class="m" x="${X}" y="${y}" font-size="${fs}" fill="${C.lime}">jd<tspan fill="${C.dim}">:</tspan><tspan fill="${C.cyan}">~</tspan><tspan fill="${C.dim}">$</tspan></text>`);
  const cmd = "nmap -sV --top-ports skills janith.qzz.io";
  out.push(typed(d, { x: X + 6 * cw, y, text: cmd, size: fs, start: 0.4, dur: 1.1 }));
  let t = 1.8;
  const line = (txt, color = C.dim, dt = 0.12) => {
    y += lh;
    out.push(`<text class="m ${appear(d, t)}" x="${X}" y="${y}" font-size="${fs}" fill="${color}" xml:space="preserve">${txt}</text>`);
    t += dt;
  };
  y += 6;
  line(`Starting Nmap 7.95 ( https://nmap.org )`);
  line(`Nmap scan report for janith.qzz.io (185.199.108.153)`, C.muted);
  line(`Host is up (0.0042s latency).`, C.dim, 0.3);
  y += lh * 0.5;
  const col = (c) => X + c * cw;
  y += lh;
  out.push(`<g class="${appear(d, t)}" font-size="${fs}" font-weight="700"><text class="m" x="${col(0)}" y="${y}" fill="${C.text}">PORT</text><text class="m" x="${col(11)}" y="${y}" fill="${C.text}">STATE</text><text class="m" x="${col(18)}" y="${y}" fill="${C.text}">SERVICE</text><text class="m" x="${col(32)}" y="${y}" fill="${C.text}">VERSION</text></g>`);
  t += 0.2;
  for (const [port, svc, ver] of K.scan) {
    y += lh;
    const elite = svc === "elite";
    out.push(`<g class="${appear(d, t, 0.25)}" font-size="${fs}"><text class="m" x="${col(0)}" y="${y}" fill="${elite ? C.red : C.text}">${port}</text><text class="m" x="${col(11)}" y="${y}" fill="${C.lime}">open</text><text class="m" x="${col(18)}" y="${y}" fill="${elite ? C.red : C.cyan}">${esc(svc)}</text><text class="m" x="${col(32)}" y="${y}" fill="${C.muted}">${esc(ver)}</text></g>`);
    t += 0.14;
  }
  y += lh * 0.5;
  t += 0.2;
  line(`Service detection performed. <tspan fill="${C.lime}">${K.scan.length} services open</tspan> on 1 host.`, C.dim);
  line(`Nmap done: 1 IP address (1 host up) scanned in 0.42 seconds`, C.dim, 0.3);
  y += lh + 6;
  out.push(`<g class="${appear(d, t, 0.1)}"><text class="m" x="${X}" y="${y}" font-size="${fs}" fill="${C.lime}">jd<tspan fill="${C.dim}">:</tspan><tspan fill="${C.cyan}">~</tspan><tspan fill="${C.dim}">$</tspan></text><rect x="${X + 6 * cw}" y="${y - 12}" width="${cw}" height="16" fill="${C.lime}" style="animation:blink 1s steps(1) infinite"/></g>`);
  d.once("blink", "@keyframes blink{50%{opacity:0}}@keyframes cur{from,to{opacity:1}}");
  const H = y + 24;
  emit("nmap.svg", svg({
    w: W, h: H, doc: d, fonts: ["jbm-400", "jbm-700"],
    title: "Skills as an nmap scan",
    desc: K.scan.map(([p, s, v]) => `${p} ${s}: ${v}`).join("; "),
    body: chrome(W, H, "nmap — zsh", "arsenal") + "\n" + out.join("\n")
  }));
}

/* ------------------------------------------------------------ case cards */
const LOCK = (x, y, c) => `<path d="M${x + 1.5} ${y + 5}h7v5.5h-7zM${x + 3} ${y + 5}V${y + 3.2}a2 2 0 0 1 4 0V${y + 5}" fill="none" stroke="${c}" stroke-width="1.2"/>`;

function caseLayout(p) {
  const title = wrap(p.title, "sg-700", 20, 370, 2);
  const sum = wrap(p.summary, "sg-500", 13.5, 370, 3);
  return { title, sum, h: 38 + 34 + (title.length - 1) * 24 + 16 + sum.length * 19.5 + 12 + 22 + 60 };
}

function caseCard(p, i, H) {
  const d = new Doc(), W = 410, X = 20, L = caseLayout(p);
  const out = [];
  out.push(`<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.panel}"/><stop offset="1" stop-color="${C.panel2}"/></linearGradient>
<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.lime}" stop-opacity="0"/><stop offset=".5" stop-color="${C.lime}" stop-opacity=".09"/><stop offset="1" stop-color="${C.lime}" stop-opacity="0"/></linearGradient>
<clipPath id="cc"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="4"/></clipPath></defs>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="4" fill="url(#bg)" stroke="${C.line}"/>`);
  // scan sweep, staggered per card
  d.rule(`.sw{animation:sw 8s cubic-bezier(.4,0,.2,1) ${(1 + i * 1.6).toFixed(1)}s infinite both}@keyframes sw{0%{transform:translateX(0)}18%,100%{transform:translateX(${W + 260}px)}}`);
  out.push(`<g clip-path="url(#cc)"><rect class="sw" x="-240" y="0" width="200" height="${H}" fill="url(#sw)" transform="skewX(-12)"/></g>`);
  out.push(corners(0.5, 0.5, W - 1, H - 1));
  // top bar
  out.push(`<text class="m" x="${X}" y="24" font-size="11" letter-spacing=".9" fill="${C.lime}">${p.id}</text>
<text class="m up" x="${W - X}" y="24" text-anchor="end" font-size="10.5" letter-spacing=".8" fill="${C.muted}">${esc(p.type)}</text>
<path d="M1 38.5H${W - 1}" stroke="${C.line}"/>`);
  let y = 38 + 34;
  L.title.forEach((ln, k) => out.push(`<text class="s" x="${X}" y="${y + k * 24}" font-size="20" font-weight="700" letter-spacing="-.4" fill="${C.text}">${esc(ln)}</text>`));
  y += (L.title.length - 1) * 24 + 16;
  L.sum.forEach((ln, k) => out.push(`<text class="s" x="${X}" y="${y + 13 + k * 19.5}" font-size="13.5" font-weight="500" fill="${C.muted}">${esc(ln)}</text>`));
  y += L.sum.length * 19.5 + 12;
  // stack chips
  let cx = X;
  for (const s of p.stack) {
    const w = textWidth(s, "jbm-400", 10.5) + 16;
    if (cx + w > W - X) break;
    out.push(`<rect x="${cx + .5}" y="${y + .5}" width="${w}" height="21" rx="2" fill="${C.term}" stroke="${C.line2}"/><text class="m" x="${cx + 8.5}" y="${y + 15}" font-size="10.5" fill="${C.muted}">${esc(s)}</text>`);
    cx += w + 6;
  }
  // metric + badges pinned to the bottom
  const my = H - 22, [mv, ml] = p.metric;
  const vw = textWidth(mv, "sg-700", 28, -0.8);
  out.push(`<text class="s" x="${X}" y="${my}" font-size="28" font-weight="700" letter-spacing="-.8" fill="${C.lime}">${esc(mv)}</text>
<text class="m up" x="${X + vw + 10}" y="${my}" font-size="10" letter-spacing="1" fill="${C.dim}">${esc(ml)}</text>`);
  const metricEnd = X + vw + 10 + textWidth(ml.toUpperCase(), "jbm-400", 10, 1);
  const badgeW = (label) => 8 + 11 + 5 + textWidth(label.toUpperCase(), "jbm-400", 9.5, 0.9) - 0.9 + 8;
  const build = (short) => {
    const list = [];
    if (p.private) list.push({ label: short ? "private" : "private · on request", icon: "lock", color: C.muted, stroke: C.line2 });
    if (p.live) list.push({ label: "live", icon: "dot", color: C.lime, stroke: C.lime });
    if (!p.private) list.push({ label: "public repo", icon: "arrow", color: C.muted, stroke: C.line2 });
    return list;
  };
  // fall back to short labels when the full ones would collide with the metric
  let badges = build(false);
  if (W - X - badges.reduce((s, b) => s + badgeW(b.label) + 6, 0) < metricEnd + 12) badges = build(true);
  let bx = W - X;
  d.rule(`.lv{transform-box:fill-box;transform-origin:center;animation:lv 1.8s ease-out infinite}@keyframes lv{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(2.6)}}`);
  for (const b of badges.reverse()) {
    const bw = badgeW(b.label), x0 = bx - bw;
    const icon = b.icon === "lock" ? LOCK(x0 + 7, my - 14, b.color)
      : b.icon === "dot" ? `<circle class="lv" cx="${x0 + 12.5}" cy="${my - 5.5}" r="3.2" fill="none" stroke="${C.lime}"/><circle cx="${x0 + 12.5}" cy="${my - 5.5}" r="3.2" fill="${C.lime}"/>`
      : `<path d="M${x0 + 8.5} ${my - 1.5}l7-7m-4.5 0h4.5v4.5" fill="none" stroke="${b.color}" stroke-width="1.3"/>`;
    out.push(`<rect x="${x0 + .5}" y="${my - 16.5}" width="${bw}" height="21" rx="2" fill="none" stroke="${b.stroke}" stroke-opacity="${b.color === C.lime ? .55 : 1}"/>${icon}<text class="m up" x="${x0 + 24}" y="${my - 2.5}" font-size="9.5" letter-spacing=".9" fill="${b.color}">${esc(b.label)}</text>`);
    bx = x0 - 6;
  }
  emit(`${p.file}.svg`, svg({
    w: W, h: H, doc: d, fonts: ["jbm-400", "sg-500", "sg-700"],
    title: `${p.id}: ${p.title}`,
    desc: `${p.summary} Stack: ${p.stack.join(", ")}. ${p.metric.join(" ")}.${p.private ? " Private repository, available on request." : ""}${p.live ? " Live (invite-only)." : ""}`,
    body: out.join("\n")
  }));
}

/* ----------------------------------------------------------------- intel */
function intel() {
  const d = new Doc(), W = 840, X = 28, out = [];
  const label = (x, y, txt, anchor = "start") => `<text class="m" x="${x}" y="${y}" text-anchor="${anchor}" font-size="10.5" letter-spacing="1.6" fill="${C.dim}">${esc(txt)}</text>`;
  out.push(label(X, 68, "EDUCATION"), label(520, 68, "TRYHACKME PATHS"));

  // education timeline (newest first)
  const ey = 98, step = 68;
  d.rule(`.ring{transform-box:fill-box;transform-origin:center;animation:ring 2.2s ease-out infinite}@keyframes ring{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}`);
  out.push(`<path d="M36.5 ${ey - 4}V${ey - 4 + step * (K.education.length - 1)}" stroke="${C.line2}"/>`);
  K.education.forEach((e, i) => {
    const y = ey + i * step, c = appear(d, 0.3 + i * 0.18);
    const tagCol = e.now ? C.amber : C.lime;
    const ww = textWidth(e.when, "jbm-400", 11);
    const tw = textWidth(e.status.toUpperCase(), "jbm-400", 9, 0.9) - 0.9 + 12;
    out.push(`<g class="${c}">
${e.now ? `<circle class="ring" cx="36.5" cy="${y - 4}" r="5" fill="none" stroke="${C.lime}"/><circle cx="36.5" cy="${y - 4}" r="5" fill="${C.lime}"/>`
        : `<circle cx="36.5" cy="${y - 4}" r="4.5" fill="${C.term}" stroke="${C.dim}" stroke-width="1.5"/>`}
<text class="m" x="56" y="${y}" font-size="11" fill="${e.now ? C.lime : C.muted}">${esc(e.when)}</text>
<rect x="${56 + ww + 10.5}" y="${y - 10.5}" width="${tw}" height="15" rx="2" fill="none" stroke="${tagCol}" stroke-opacity=".5"/>
<text class="m up" x="${56 + ww + 16.5}" y="${y}" font-size="9" letter-spacing=".9" fill="${tagCol}">${esc(e.status)}</text>
<text class="s" x="56" y="${y + 21}" font-size="16" font-weight="700" letter-spacing="-.2" fill="${C.text}">${esc(e.t)}</text>
<text class="s" x="56" y="${y + 40}" font-size="12.5" font-weight="500" fill="${C.muted}">${esc(e.o)}${e.d ? ` · ${esc(e.d)}` : ""}</text>
</g>`);
  });

  // THM paths
  d.rule(`.spin{transform-box:fill-box;transform-origin:center;animation:spin 3s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`);
  K.thmPaths.forEach((p, i) => {
    const y = ey + i * 44, c = appear(d, 0.5 + i * 0.15), ix = 528, iy = y - 5;
    const icon = p.done
      ? `<circle cx="${ix}" cy="${iy}" r="7" fill="none" stroke="${C.lime}" stroke-width="1.5"/><path d="M${ix - 3.2} ${iy}l2.2 2.3 4.2-4.6" fill="none" stroke="${C.lime}" stroke-width="1.6"/>`
      : `<circle class="spin" cx="${ix}" cy="${iy}" r="7" fill="none" stroke="${C.amber}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    out.push(`<g class="${c}">${icon}<text class="s" x="546" y="${y}" font-size="14.5" font-weight="700" fill="${C.text}">${esc(p.n)}</text><text class="m" x="546" y="${y + 17}" font-size="10.5" fill="${p.done ? C.dim : C.amber}">${esc(p.done ? `completed · ${p.d}` : p.d)}</text></g>`);
  });
  out.push(`<g class="${appear(d, 1)}">${label(520, 240, "GLOBAL RANK")}<text class="s" x="520" y="268" font-size="24" font-weight="700" letter-spacing="-.6" fill="${C.lime}">top 7%<tspan class="m" font-size="11" font-weight="400" letter-spacing="0" fill="${C.dim}" dx="10">on TryHackMe</tspan></text></g>`);

  // certifications as git log
  const gy = 318, fs = 12.5, cw = mono(fs), lh = 25;
  out.push(`<path d="M20 290.5H${W - 20}" stroke="${C.line}"/>`, label(X, gy, "CERTIFICATIONS"), label(W - X, gy, `${K.certs.length} COMMITS · NEWEST FIRST`, "end"));
  const TAG = { THM: C.red, CISCO: C.cyan, GCP: C.amber, KAPRUKA: C.lime };
  K.certs.forEach((c, i) => {
    const y = gy + 32 + i * lh, cls = appear(d, 1.1 + i * 0.12);
    const hash = c.wip ? "·······" : createHash("sha1").update(c.t).digest("hex").slice(0, 7);
    const deco = i === 0 ? `<tspan fill="${C.dim}">(</tspan><tspan fill="${C.cyan}">HEAD -&gt; </tspan><tspan fill="${C.lime}">main</tspan><tspan fill="${C.dim}">)</tspan> `
      : c.wip ? `<tspan fill="${C.amber}">(wip)</tspan> ` : "";
    const tc = TAG[c.tag] || C.muted, tw = textWidth(c.tag, "jbm-700", 9.5, 1) - 1 + 14;
    out.push(`<g class="${cls}" font-size="${fs}">
<text class="m" x="${X}" y="${y}" fill="${c.wip ? C.amber : C.lime}">*</text>
<text class="m" x="${X + 2 * cw}" y="${y}" fill="${c.wip ? C.dim : C.amber}" xml:space="preserve">${hash}  ${deco}<tspan fill="${c.wip ? C.muted : C.text}">${esc(c.t)}</tspan></text>
<rect x="${672.5}" y="${y - 11.5}" width="${tw}" height="16" rx="2" fill="none" stroke="${tc}" stroke-opacity=".5"/>
<text class="m" x="${679.5}" y="${y}" font-size="9.5" font-weight="700" letter-spacing="1" fill="${tc}">${c.tag}</text>
<text class="m" x="${W - X}" y="${y}" text-anchor="end" font-size="11.5" fill="${c.wip ? C.amber : C.dim}">${esc(c.d)}</text>
</g>`);
  });
  const H = gy + 32 + (K.certs.length - 1) * lh + 26;
  emit("intel.svg", svg({
    w: W, h: H, doc: d, fonts: ["jbm-400", "jbm-700", "sg-500", "sg-700"],
    title: "Education, TryHackMe paths and certifications",
    desc: [
      ...K.education.map((e) => `${e.when}: ${e.t}, ${e.o}${e.d ? `, ${e.d}` : ""} (${e.status})`),
      ...K.thmPaths.map((p) => `TryHackMe path ${p.n}: ${p.done ? `completed ${p.d}` : p.d}`),
      "TryHackMe global rank: top 7%",
      ...K.certs.map((c) => `${c.t} (${c.tag}, ${c.d})`)
    ].join("; "),
    body: chrome(W, H, "intel — ~/education  ~/certs", "git log") + "\n" + out.join("\n")
  }));
}

/* ---------------------------------------------------------------- footer */
function footer() {
  const d = new Doc(), W = 840, name = K.profile.name.join(" ");
  const unit = textWidth(name, "sg-700", 1, -0.05);
  const fs = Math.floor((W - 40) / unit), ls = (-0.05 * fs).toFixed(2);
  const base = Math.round(fs * 0.78) + 22, H = Math.round(fs * 0.8) + 36;
  d.rule(`.spot{animation:spot 11s ease-in-out infinite alternate both}@keyframes spot{from{transform:translateX(-360px)}to{transform:translateX(360px)}}`);
  const txt = (attrs) => `<text class="s" x="${W / 2}" y="${base}" text-anchor="middle" font-size="${fs}" font-weight="700" letter-spacing="${ls}" ${attrs}>${esc(name)}</text>`;
  const body = `<defs>
<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151C25"/><stop offset=".75" stop-color="#0B0E13"/></linearGradient>
<linearGradient id="fadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#fff" stop-opacity=".5"/><stop offset=".92" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fadeG)"/></mask>
<radialGradient id="sp"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="spot" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><circle class="spot" cx="${W / 2}" cy="${H / 2}" r="170" fill="url(#sp)"/></mask>
</defs>
<rect width="${W}" height="${H}" rx="6" fill="${C.bg}"/>
<g mask="url(#fade)">
${txt(`fill="url(#fill)" stroke="#1E2630" stroke-width="1"`)}
<g mask="url(#spot)">${txt(`fill="${C.lime}" fill-opacity=".16" stroke="${C.lime}" stroke-width="1.5"`)}</g>
</g>`;
  emit("footer.svg", svg({ w: W, h: H, doc: d, fonts: ["sg-700"], title: name, desc: `${name} in giant outlined letters with a slowly moving lime spotlight.`, body }));
}

/* ------------------------------------------------------------------ run */
hero();
button("btn-portfolio.svg", "portfolio", "arrow", true);
button("btn-lab.svg", "the lab", "prompt");
button("btn-linkedin.svg", "linkedin", "in");
button("btn-email.svg", "email", "at");
button("btn-coffee.svg", "buy me a coffee", "cup");
for (const key of Object.keys(K.sections)) { sectionHead(key); sectionHead(key, "light"); }
nmap();
const cardH = Math.ceil(Math.max(...K.cases.map((p) => caseLayout(p).h)));
K.cases.forEach((p, i) => caseCard(p, i, cardH));
intel();
footer();

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`${name.padEnd(22)} ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}
