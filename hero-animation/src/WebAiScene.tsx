import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";

// Timeline: an intro that builds the scene once, then a loop of LOOP_FRAMES.
// Everything that keeps moving after the intro is periodic in LOOP_FRAMES
// (integer cycle counts only), so frame INTRO_FRAMES + LOOP_FRAMES is identical
// to frame INTRO_FRAMES and the loop has no visible seam.
export const FPS = 30;
export const INTRO_FRAMES = 4 * FPS;
export const LOOP_FRAMES = 12 * FPS;

type Rect = { x: number; y: number; w: number; h: number };

export type Layout = {
  width: number;
  height: number;
  // "h": the web sits left of the AI field, "v": the web sits above it.
  flow: "h" | "v";
  web: Rect;
  ai: { cx: number; cy: number; rx: number; ry: number; nodes: number };
  threads: number;
};

export const WIDE: Layout = {
  width: 1920,
  height: 1080,
  flow: "h",
  web: { x: 170, y: 440, w: 640, h: 530 },
  ai: { cx: 1400, cy: 705, rx: 340, ry: 270, nodes: 420 },
  threads: 12,
};

export const TALL: Layout = {
  width: 1080,
  height: 1920,
  flow: "v",
  web: { x: 140, y: 950, w: 800, h: 310 },
  ai: { cx: 540, cy: 1600, rx: 410, ry: 180, nodes: 340 },
  threads: 10,
};

const AMBER = "#ffb454";
const ICE = "#7fd4ff";
const TAU = Math.PI * 2;

const rise = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

// Whole-number `cycles` per loop keep every value seamless across the loop point.
const cycle = (frame: number, cycles: number, phase: number) => {
  const value = (cycles * frame) / LOOP_FRAMES + phase;
  return value - Math.floor(value);
};

const wave = (frame: number, cycles: number, phase: number) =>
  Math.sin(TAU * cycle(frame, cycles, phase));

// Flares when a pulse reaches the end of its thread and decays after it wraps.
const arrival = (progress: number) =>
  Math.max(
    Math.exp(-progress * 11),
    interpolate(progress, [0.975, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

type Node = {
  x: number;
  y: number;
  r: number;
  size: number;
  wobble: number;
  cycles: number;
  phase: number;
};

const buildNodes = (l: Layout): Node[] =>
  Array.from({ length: l.ai.nodes }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / l.ai.nodes);
    const angle = i * 2.39996;
    return {
      x:
        l.ai.cx +
        l.ai.rx * r * Math.cos(angle) +
        (random(`jx-${i}`) - 0.5) * 5,
      y:
        l.ai.cy +
        l.ai.ry * r * Math.sin(angle) +
        (random(`jy-${i}`) - 0.5) * 5,
      r,
      size: 0.9 + random(`size-${i}`) * random(`size2-${i}`) * 2.8,
      wobble: 2 + random(`wobble-${i}`) * 4,
      cycles: 1 + Math.floor(random(`cycles-${i}`) * 2),
      phase: random(`phase-${i}`),
    };
  });

const buildLinks = (nodes: Node[]) => {
  const links = new Set<string>();
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter(({ j }) => j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .forEach(({ j }) => links.add(`${Math.min(i, j)}-${Math.max(i, j)}`));
  });
  return [...links].map((link) => link.split("-").map(Number));
};

type Thread = {
  d: string;
  port: { x: number; y: number };
  target: number;
  cycles: number;
  phase: number;
};

const buildThreads = (l: Layout, nodes: Node[]): Thread[] => {
  const horizontal = l.flow === "h";
  // Routes are written as (u: along the flow, v: across it).
  const pt = (u: number, v: number) => (horizontal ? `${u} ${v}` : `${v} ${u}`);
  const start = horizontal ? l.web.x + l.web.w : l.web.y + l.web.h;
  const from = horizontal ? l.web.y + 84 : l.web.x + 36;
  const to = horizontal ? l.web.y + l.web.h - 34 : l.web.x + l.web.w - 36;
  const mid = (from + to) / 2;
  const end = horizontal ? l.ai.cx - l.ai.rx : l.ai.cy - l.ai.ry;
  const middle = (l.threads - 1) / 2;

  return Array.from({ length: l.threads }, (_, i) => {
    const v0 = from + ((to - from) * i) / (l.threads - 1);
    const v1 = mid + (v0 - mid) * 0.62;
    const jog = Math.abs(i - middle) * ((end - start) * 0.022);
    const u1 = start + (end - start) * 0.08 + jog;
    const u2 = u1 + Math.abs(v1 - v0);
    const u3 = u2 + (end - start) * 0.1;

    // Each rigid trace lands on the field node closest to its spot on the rim.
    const a = interpolate(i, [0, l.threads - 1], [-0.92, 0.92]);
    const rimX = horizontal
      ? l.ai.cx - l.ai.rx * Math.cos(a) * 0.86
      : l.ai.cx + l.ai.rx * Math.sin(a) * 0.86;
    const rimY = horizontal
      ? l.ai.cy + l.ai.ry * Math.sin(a) * 0.86
      : l.ai.cy - l.ai.ry * Math.cos(a) * 0.86;
    let target = 0;
    nodes.forEach((n, j) => {
      const best = nodes[target];
      if ((n.x - rimX) ** 2 + (n.y - rimY) ** 2 < (best.x - rimX) ** 2 + (best.y - rimY) ** 2) {
        target = j;
      }
    });

    const node = nodes[target];
    const uT = horizontal ? node.x : node.y;
    const vT = horizontal ? node.y : node.x;
    const pull = (uT - u3) * 0.48;
    return {
      d: `M ${pt(start, v0)} L ${pt(u1, v0)} L ${pt(u2, v1)} L ${pt(u3, v1)} C ${pt(u3 + pull, v1)} ${pt(uT - pull, vT)} ${pt(uT, vT)}`,
      port: horizontal ? { x: start, y: v0 } : { x: v0, y: start },
      target,
      cycles: 2 + Math.floor(random(`thread-c-${i}`) * 2),
      phase: random(`thread-p-${i}`),
    };
  });
};

const Backdrop: React.FC<{ l: Layout; frame: number }> = ({ l, frame }) => {
  const on = rise(frame, 0, 50);
  const { web, ai } = l;
  return (
    <g opacity={on}>
      <defs>
        <pattern id="grid" width={48} height={48} patternUnits="userSpaceOnUse">
          <path
            d="M 48 0 H 0 V 48"
            fill="none"
            stroke="#ffc98a"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        </pattern>
        <radialGradient id="grid-fade">
          <stop offset="0.25" stopColor="white" stopOpacity={1} />
          <stop offset="1" stopColor="white" stopOpacity={0} />
        </radialGradient>
        <mask id="grid-mask">
          <ellipse
            cx={web.x + web.w / 2}
            cy={web.y + web.h / 2}
            rx={web.w * 0.95}
            ry={web.h * 1.1}
            fill="url(#grid-fade)"
          />
        </mask>
        <radialGradient id="web-glow">
          <stop offset="0" stopColor={AMBER} stopOpacity={0.15} />
          <stop offset="1" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ai-glow">
          <stop offset="0" stopColor={ICE} stopOpacity={0.3} />
          <stop offset="0.5" stopColor={ICE} stopOpacity={0.09} />
          <stop offset="1" stopColor={ICE} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={web.x + web.w / 2}
        cy={web.y + web.h / 2}
        rx={web.w * 0.95}
        ry={web.h * 1.05}
        fill="url(#web-glow)"
      />
      <rect
        width={l.width}
        height={l.height}
        fill="url(#grid)"
        mask="url(#grid-mask)"
      />
      <ellipse
        cx={ai.cx}
        cy={ai.cy}
        rx={ai.rx * 1.35}
        ry={ai.ry * 1.35}
        fill="url(#ai-glow)"
        opacity={0.85 + 0.15 * wave(frame, 2, 0)}
      />
    </g>
  );
};

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  kind: "panel" | "bar" | "button";
};

// A generic page wireframe, laid out in fractions so it fits both cuts.
const buildBlocks = (web: Rect): Block[] => {
  const top = web.y + 46;
  const body = web.h - 46;
  const block = (
    fx: number,
    fy: number,
    fw: number,
    fh: number,
    kind: Block["kind"],
  ): Block => ({
    x: web.x + web.w * fx,
    y: top + body * fy,
    w: web.w * fw,
    h: body * fh,
    rx: kind === "panel" ? 8 : Math.min(body * fh, web.w * fw) / 2,
    kind,
  });
  return [
    block(0.05, 0.06, 0.13, 0.035, "bar"),
    block(0.62, 0.065, 0.08, 0.025, "bar"),
    block(0.73, 0.065, 0.08, 0.025, "bar"),
    block(0.84, 0.065, 0.1, 0.025, "bar"),
    block(0.05, 0.19, 0.4, 0.05, "bar"),
    block(0.05, 0.27, 0.3, 0.05, "bar"),
    block(0.05, 0.375, 0.42, 0.018, "bar"),
    block(0.05, 0.415, 0.36, 0.018, "bar"),
    block(0.05, 0.485, 0.16, 0.055, "button"),
    block(0.54, 0.17, 0.41, 0.4, "panel"),
    block(0.05, 0.65, 0.28, 0.29, "panel"),
    block(0.36, 0.65, 0.28, 0.29, "panel"),
    block(0.67, 0.65, 0.28, 0.29, "panel"),
  ];
};

// The chart and the cards inside the wireframe, reacting to the same responses.
const PanelDetails: React.FC<{
  blocks: Block[];
  frame: number;
  threads: Thread[];
}> = ({ blocks, frame, threads }) => {
  const chart = blocks[9];
  const cards = blocks.slice(10, 13);
  const appear = rise(frame, 66, 96);
  const pad = chart.w * 0.07;
  const points = Array.from({ length: 19 }, (_, i) => {
    const t = i / 18;
    const value =
      0.42 +
      t * 0.26 +
      0.09 * wave(frame, 1, t * 1.4) +
      0.05 * wave(frame, 2, t * 3.1 + 0.3);
    return {
      x: chart.x + pad + (chart.w - 2 * pad) * t,
      y: chart.y + chart.h - pad - (chart.h - 2 * pad) * value,
    };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const base = chart.y + chart.h - pad;
  return (
    <g opacity={appear}>
      <polygon
        points={`${chart.x + pad},${base} ${line} ${chart.x + chart.w - pad},${base}`}
        fill={AMBER}
        fillOpacity={0.09}
      />
      <polyline
        points={line}
        fill="none"
        stroke={AMBER}
        strokeOpacity={0.9}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {cards.map((card, i) => {
        const thread = threads[(10 + i) % threads.length];
        const flash = arrival(cycle(frame, thread.cycles, thread.phase + 0.5));
        const inset = Math.min(card.w, card.h) * 0.14;
        const dot = Math.min(card.h * 0.13, 15);
        const lineY = card.y + inset + dot * 2 + card.h * 0.1;
        return (
          <g key={i}>
            <circle
              cx={card.x + inset + dot}
              cy={card.y + inset + dot}
              r={dot}
              fill={AMBER}
              fillOpacity={0.3 + flash * 0.7}
            />
            {[0.72, 0.5].map((width, row) => (
              <rect
                key={row}
                x={card.x + inset}
                y={lineY + row * card.h * 0.13}
                width={(card.w - 2 * inset) * width}
                height={Math.max(3, card.h * 0.045)}
                rx={2}
                fill="#ffe7c9"
                fillOpacity={0.18 + flash * 0.6}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

const WebSide: React.FC<{
  l: Layout;
  frame: number;
  threads: Thread[];
}> = ({ l, frame, threads }) => {
  const { web } = l;
  const blocks = buildBlocks(web);
  const frameIn = rise(frame, 0, 34);
  const chromeIn = rise(frame, 18, 40);
  const headingBar = blocks[5];
  return (
    <g>
      <rect
        x={web.x}
        y={web.y}
        width={web.w}
        height={web.h}
        rx={14}
        fill="#0b0f16"
        fillOpacity={frameIn * 0.92}
        stroke="#ffcf96"
        strokeOpacity={0.65}
        strokeWidth={1.5}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - frameIn}
      />
      <g opacity={chromeIn}>
        <line
          x1={web.x}
          y1={web.y + 46}
          x2={web.x + web.w}
          y2={web.y + 46}
          stroke="#ffcf96"
          strokeOpacity={0.3}
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={web.x + 24 + i * 19}
            cy={web.y + 23}
            r={5}
            fill="none"
            stroke="#ffcf96"
            strokeOpacity={0.7}
            strokeWidth={1.3}
          />
        ))}
        <rect
          x={web.x + 96}
          y={web.y + 13}
          width={Math.min(web.w * 0.5, 340)}
          height={20}
          rx={10}
          fill="#ffcf96"
          fillOpacity={0.09}
        />
      </g>
      {blocks.map((block, i) => {
        const thread = threads[i % threads.length];
        // The response travels back to the web, so this block lights up on arrival.
        const flash = arrival(cycle(frame, thread.cycles, thread.phase + 0.5));
        const appear = rise(frame, 26 + i * 3, 50 + i * 3);
        const panel = block.kind === "panel";
        const button = block.kind === "button";
        return (
          <rect
            key={i}
            x={block.x}
            y={block.y}
            width={block.w * (panel ? 1 : appear)}
            height={block.h}
            rx={block.rx}
            opacity={appear}
            fill={button ? AMBER : "#ffe7c9"}
            fillOpacity={
              button
                ? 0.72 + flash * 0.28
                : panel
                  ? 0.025 + flash * 0.16
                  : 0.2 + flash * 0.7
            }
            stroke={panel ? "#ffcf96" : "none"}
            strokeOpacity={panel ? 0.28 + flash * 0.6 : 0}
            strokeWidth={1.2}
          />
        );
      })}
      <PanelDetails blocks={blocks} frame={frame} threads={threads} />
      <rect
        x={headingBar.x + headingBar.w + 9}
        y={headingBar.y}
        width={3}
        height={headingBar.h}
        fill={AMBER}
        opacity={rise(frame, 70, 90) * (wave(frame, 12, 0.1) > 0 ? 1 : 0.1)}
      />
    </g>
  );
};

const AiField: React.FC<{
  l: Layout;
  frame: number;
  nodes: Node[];
  links: number[][];
  threads: Thread[];
}> = ({ l, frame, nodes, links, threads }) => {
  const { cx, cy } = l.ai;
  const placed = nodes.map((n) => {
    const appear = rise(frame, 16 + n.r * 42, 46 + n.r * 42);
    const dx = wave(frame, n.cycles, n.phase) * n.wobble;
    const dy = wave(frame, n.cycles, n.phase + 0.25) * n.wobble;
    // Rings of light spread outwards through the field, twice per loop.
    const ring = (wave(frame, 2, -n.r * 1.4) + 1) / 2;
    return {
      x: cx + (n.x + dx - cx) * appear,
      y: cy + (n.y + dy - cy) * appear,
      appear,
      glow: 0.28 + 0.72 * ring * ring * ring,
    };
  });
  const flares = new Map(
    threads.map((t) => [t.target, arrival(cycle(frame, t.cycles, t.phase))]),
  );

  return (
    <g>
      {links.map(([a, b]) => {
        const p = placed[a];
        const q = placed[b];
        return (
          <line
            key={`${a}-${b}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke={ICE}
            strokeWidth={0.8}
            strokeOpacity={
              Math.min(p.appear, q.appear) * 0.13 +
              Math.min(p.appear, q.appear) * 0.42 * Math.min(p.glow, q.glow)
            }
          />
        );
      })}
      {placed.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={nodes[i].size}
          fill="#bfe8ff"
          opacity={p.appear * (0.35 + 0.65 * p.glow)}
        />
      ))}
      <g style={{ filter: "drop-shadow(0 0 8px #7fd4ff)" }}>
        {[...flares].map(([target, flare]) => {
          const p = placed[target];
          return (
            <circle
              key={target}
              cx={p.x}
              cy={p.y}
              r={2.5 + flare * 5}
              fill="#eaf8ff"
              opacity={rise(frame, 90, 118) * (0.35 + flare * 0.65)}
            />
          );
        })}
      </g>
    </g>
  );
};

const Threads: React.FC<{
  l: Layout;
  frame: number;
  threads: Thread[];
}> = ({ l, frame, threads }) => {
  const horizontal = l.flow === "h";
  const from = horizontal ? l.web.x + l.web.w : l.web.y + l.web.h;
  const to = horizontal ? l.ai.cx - l.ai.rx * 0.5 : l.ai.cy - l.ai.ry * 0.5;
  const pulsesOn = rise(frame, 92, 119);
  const axis = horizontal
    ? { x1: from, y1: 0, x2: to, y2: 0 }
    : { x1: 0, y1: from, x2: 0, y2: to };
  return (
    <g>
      <defs>
        <linearGradient id="thread" gradientUnits="userSpaceOnUse" {...axis}>
          <stop offset="0" stopColor={AMBER} />
          <stop offset="0.5" stopColor="#f2efe6" />
          <stop offset="1" stopColor={ICE} />
        </linearGradient>
      </defs>
      {threads.map((thread, i) => (
        <g key={i}>
          <path
            d={thread.d}
            pathLength={1}
            fill="none"
            stroke="url(#thread)"
            strokeOpacity={0.52}
            strokeWidth={1.4}
            strokeDasharray="1 1"
            strokeDashoffset={
              1 - rise(frame, 50 + (i % 4) * 7, 92 + (i % 4) * 7)
            }
          />
          <rect
            x={thread.port.x - 3.5}
            y={thread.port.y - 3.5}
            width={7}
            height={7}
            rx={1.5}
            fill={AMBER}
            opacity={rise(frame, 44, 62)}
          />
        </g>
      ))}
      <g opacity={pulsesOn}>
        <g style={{ filter: `drop-shadow(0 0 6px ${AMBER})` }}>
          {threads.map((thread, i) => (
            <path
              key={i}
              d={thread.d}
              pathLength={1000}
              fill="none"
              stroke="#ffd59c"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeDasharray="26 974"
              strokeDashoffset={
                -cycle(frame, thread.cycles, thread.phase) * 1000
              }
            />
          ))}
        </g>
        <g style={{ filter: `drop-shadow(0 0 6px ${ICE})` }}>
          {threads.map((thread, i) => (
            <path
              key={i}
              d={thread.d}
              pathLength={1000}
              fill="none"
              stroke="#c9edff"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeDasharray="26 974"
              strokeDashoffset={
                -(1 - cycle(frame, thread.cycles, thread.phase + 0.5)) * 1000
              }
            />
          ))}
        </g>
      </g>
    </g>
  );
};

export const WebAiScene: React.FC<{ layout: Layout }> = ({ layout: l }) => {
  const frame = useCurrentFrame();
  const { nodes, links, threads } = useMemo(() => {
    const builtNodes = buildNodes(l);
    return {
      nodes: builtNodes,
      links: buildLinks(builtNodes),
      threads: buildThreads(l, builtNodes),
    };
  }, [l]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#06090f" }}>
      <svg
        width={l.width}
        height={l.height}
        viewBox={`0 0 ${l.width} ${l.height}`}
        style={{ position: "absolute" }}
      >
        <Backdrop l={l} frame={frame} />
        <AiField
          l={l}
          frame={frame}
          nodes={nodes}
          links={links}
          threads={threads}
        />
        <Threads l={l} frame={frame} threads={threads} />
        <WebSide l={l} frame={frame} threads={threads} />
      </svg>
    </AbsoluteFill>
  );
};
