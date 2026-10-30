import { loadFont as loadSans } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

// Timeline: a short intro builds the two panels, then three stories loop. Every
// story starts and ends on the same empty state, so frame INTRO + LOOP is
// identical to frame INTRO and the loop has no visible seam.
export const FPS = 30;
export const INTRO_FRAMES = 2 * FPS;
export const STORY_FRAMES = 10 * FPS;

const T = {
  typeStart: 15,
  typeEnd: 75,
  send: 80,
  taskArrives: 108,
  stepsStart: 110,
  stepFrames: 26,
  outputEnd: 186,
  done: 190,
  solutionLeaves: 192,
  result: 216,
  fadeOut: 285,
  end: STORY_FRAMES - 1,
};

type Rect = { x: number; y: number; w: number; h: number };

export type Layout = {
  width: number;
  height: number;
  // "h": the web sits left of the AI, "v": the web sits above it.
  flow: "h" | "v";
  web: Rect;
  ai: Rect;
  // Text and spacing scale.
  k: number;
};

export const WIDE: Layout = {
  width: 1920,
  height: 1080,
  flow: "h",
  web: { x: 130, y: 480, w: 700, h: 520 },
  ai: { x: 1090, y: 480, w: 700, h: 520 },
  k: 1.32,
};

export const TALL: Layout = {
  width: 1080,
  height: 1920,
  flow: "v",
  web: { x: 150, y: 870, w: 780, h: 450 },
  ai: { x: 150, y: 1410, w: 780, h: 380 },
  k: 1.3,
};

type Story = {
  path: string;
  task: string;
  steps: string[];
  output: string;
  result: "reply" | "chart" | "feature";
};

const stories: Story[] = [
  {
    path: "vasafirma.sk/podpora",
    task: "Kedy mi príde objednávka 4821?",
    steps: ["Hľadám objednávku", "Overujem stav u dopravcu", "Píšem odpoveď"],
    output: "objednávka 4821\nstav: u kuriéra\ndoručenie: streda",
    result: "reply",
  },
  {
    path: "vasafirma.sk/prehlad",
    task: "Čo sa tento mesiac predáva najlepšie?",
    steps: ["Čítam objednávky", "Počítam predaje", "Pripravujem graf"],
    output: "SELECT produkt, SUM(kusy)\nFROM objednavky\nGROUP BY produkt",
    result: "chart",
  },
  {
    path: "vasafirma.sk/faktury",
    task: "Pridaj k faktúram export do PDF.",
    steps: ["Čítam kód aplikácie", "Píšem novú funkciu", "Spúšťam testy"],
    output: "function exportPdf($faktura) {\n  return Pdf::make($faktura);\n}",
    result: "feature",
  },
];

export const LOOP_FRAMES = STORY_FRAMES * stories.length;

const AMBER = "#ffb454";
const ICE = "#7fd4ff";
const INK = "#06090f";
const TEXT = "#eef2f8";
const MUTED = "#8b97a8";

const rise = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const linear = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Visible share of a story's content; zero on the shared empty state.
const presence = (t: number) =>
  linear(t, 0, 10) * (1 - linear(t, T.fadeOut, T.end));

const typed = (text: string, t: number, from: number, to: number) =>
  text.slice(0, Math.floor(linear(t, from, to) * text.length));

const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12.5 10 17.5 19 7"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Spark: React.FC<{ size: number; rotate: number; scale: number }> = ({
  size,
  rotate,
  scale,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ rotate: `${rotate}deg`, scale }}
  >
    <path
      d="M12 1.5C13 8 16 11 22.5 12 16 13 13 16 12 22.5 11 16 8 13 1.5 12 8 11 11 8 12 1.5Z"
      fill={ICE}
    />
  </svg>
);

const WebResult: React.FC<{ story: Story; t: number; k: number }> = ({
  story,
  t,
  k,
}) => {
  const shown = rise(t, T.result, T.result + 16);
  const lift = { opacity: shown, translate: `0 ${(1 - shown) * 12 * k}px` };

  if (story.result === "reply") {
    return (
      <div style={{ ...lift, display: "flex", flexDirection: "column", gap: 12 * k }}>
        <div
          style={{
            alignSelf: "flex-start",
            padding: `${12 * k}px ${16 * k}px`,
            borderRadius: 14 * k,
            background: "rgba(127, 212, 255, 0.12)",
            border: "1px solid rgba(127, 212, 255, 0.35)",
            color: TEXT,
            fontSize: 24 * k,
            lineHeight: 1.3,
          }}
        >
          Balík je na ceste. Doručíme ho v&nbsp;stredu.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6 * k,
            color: ICE,
            fontSize: 20 * k,
            fontWeight: 500,
          }}
        >
          <Check size={22 * k} color={ICE} />
          Vyriešené
        </div>
      </div>
    );
  }

  if (story.result === "chart") {
    const bars = [
      { label: "Káva", value: 412 },
      { label: "Čaj", value: 268 },
      { label: "Kakao", value: 153 },
    ];
    return (
      <div style={{ ...lift, display: "flex", flexDirection: "column", gap: 10 * k }}>
        {bars.map((bar, i) => {
          const grow = rise(t, T.result + i * 6, T.result + 26 + i * 6);
          return (
            <div
              key={bar.label}
              style={{ display: "flex", alignItems: "center", gap: 12 * k }}
            >
              <div style={{ width: 72 * k, color: TEXT, fontSize: 21 * k }}>
                {bar.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 24 * k,
                  borderRadius: 6 * k,
                  background: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <div
                  style={{
                    width: `${(bar.value / 412) * 100 * grow}%`,
                    height: "100%",
                    borderRadius: 6 * k,
                    background: i === 0 ? AMBER : "rgba(255, 180, 84, 0.5)",
                  }}
                />
              </div>
              <div
                style={{
                  width: 76 * k,
                  textAlign: "right",
                  color: MUTED,
                  fontSize: 20 * k,
                }}
              >
                {Math.round(bar.value * grow)} ks
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        ...lift,
        display: "flex",
        alignItems: "center",
        gap: 6 * k,
        color: ICE,
        fontSize: 20 * k,
        fontWeight: 500,
      }}
    >
      <Check size={22 * k} color={ICE} />
      Nová funkcia je hotová
    </div>
  );
};

// Scene 3 starts from a real page, and the result adds a button to it.
const InvoiceRows: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  const added = rise(t, T.result, T.result + 14);
  const glow = 1 - linear(t, T.result + 10, T.result + 50);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 * k }}>
      {[
        ["Faktúra 2026-014", "480 €"],
        ["Faktúra 2026-015", "1 260 €"],
      ].map(([name, price]) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12 * k,
            height: 40 * k,
            padding: `0 ${12 * k}px`,
            borderRadius: 10 * k,
            background: "rgba(255, 255, 255, 0.04)",
            color: TEXT,
            fontSize: 20 * k,
          }}
        >
          <div style={{ flex: 1 }}>{name}</div>
          <div style={{ color: MUTED }}>{price}</div>
          <div
            style={{
              opacity: added,
              scale: 0.8 + 0.2 * added,
              padding: `${4 * k}px ${11 * k}px`,
              borderRadius: 8 * k,
              background: AMBER,
              color: INK,
              fontSize: 17 * k,
              fontWeight: 600,
              boxShadow: `0 0 ${22 * k * glow}px rgba(255, 180, 84, ${glow})`,
            }}
          >
            Export PDF
          </div>
        </div>
      ))}
    </div>
  );
};

const WebPanel: React.FC<{
  l: Layout;
  story: Story;
  t: number;
  intro: number;
}> = ({ l, story, t, intro }) => {
  const { k, web } = l;
  const content = presence(t);
  const bubble = rise(t, T.send, T.send + 12);
  const flash = rise(t, T.result, T.result + 8) * (1 - linear(t, T.result + 8, T.result + 45));
  const typing = t >= T.typeStart && t < T.send;
  const caret = Math.floor(t / 8) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        left: web.x,
        top: web.y,
        width: web.w,
        height: web.h,
        opacity: intro,
        translate: `0 ${(1 - intro) * 18}px`,
        display: "flex",
        flexDirection: "column",
        borderRadius: 16 * k,
        background: "#0b0f16",
        border: `1.5px solid rgba(255, 207, 150, ${0.42 + flash * 0.58})`,
        boxShadow: `0 0 ${50 * flash}px rgba(255, 180, 84, ${0.35 * flash})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8 * k,
          height: 50 * k,
          flexShrink: 0,
          padding: `0 ${18 * k}px`,
          borderBottom: "1px solid rgba(255, 207, 150, 0.2)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 11 * k,
              height: 11 * k,
              borderRadius: "50%",
              border: "1.3px solid rgba(255, 207, 150, 0.6)",
            }}
          />
        ))}
        <div
          style={{
            flex: 1,
            marginLeft: 10 * k,
            padding: `${4 * k}px ${14 * k}px`,
            borderRadius: 99,
            background: "rgba(255, 207, 150, 0.08)",
            color: MUTED,
            fontSize: 17 * k,
          }}
        >
          <span style={{ opacity: content }}>{story.path}</span>
          &nbsp;
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 14 * k,
          padding: `${18 * k}px ${20 * k}px 0`,
          opacity: content,
        }}
      >
        {story.result === "feature" ? <InvoiceRows t={t} k={k} /> : null}
        <div
          style={{
            alignSelf: "flex-end",
            maxWidth: "88%",
            opacity: bubble,
            translate: `0 ${(1 - bubble) * 10 * k}px`,
            padding: `${10 * k}px ${16 * k}px`,
            borderRadius: 14 * k,
            background: "rgba(255, 180, 84, 0.14)",
            border: "1px solid rgba(255, 180, 84, 0.4)",
            color: TEXT,
            fontSize: 22 * k,
            lineHeight: 1.25,
          }}
        >
          {story.task}
        </div>
        <WebResult story={story} t={t} k={k} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10 * k,
          margin: `${10 * k}px ${20 * k}px ${16 * k}px`,
          padding: `0 ${8 * k}px 0 ${16 * k}px`,
          height: 52 * k,
          flexShrink: 0,
          borderRadius: 12 * k,
          border: `1px solid rgba(255, 207, 150, ${typing ? 0.65 : 0.28})`,
          fontSize: 21 * k,
        }}
      >
        <div style={{ flex: 1, color: typing ? TEXT : MUTED, whiteSpace: "nowrap" }}>
          {typing ? typed(story.task, t, T.typeStart, T.typeEnd) : "Zadajte úlohu…"}
          {typing ? (
            <span style={{ color: AMBER, opacity: caret ? 1 : 0 }}>|</span>
          ) : null}
        </div>
        <div
          style={{
            width: 36 * k,
            height: 36 * k,
            borderRadius: 9 * k,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: AMBER,
            scale: t >= T.send && t < T.send + 6 ? 0.86 : 1,
          }}
        >
          <svg width={20 * k} height={20 * k} viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10H16M16 10L10.5 4.5M16 10L10.5 15.5"
              stroke={INK}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const StepRow: React.FC<{ label: string; index: number; t: number; k: number }> = ({
  label,
  index,
  t,
  k,
}) => {
  const start = T.stepsStart + index * T.stepFrames;
  const finish = start + T.stepFrames;
  const active = t >= start && t < finish;
  const done = t >= finish;
  const size = 26 * k;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12 * k,
        color: TEXT,
        fontSize: 22 * k,
        opacity: active ? 1 : done ? 0.72 : 0.3,
      }}
    >
      <div style={{ width: size, height: size, flexShrink: 0 }}>
        {done ? (
          <Check size={size} color={ICE} />
        ) : (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ rotate: active ? `${(t - start) * 14}deg` : undefined }}
          >
            <circle
              cx={12}
              cy={12}
              r={9}
              stroke={ICE}
              strokeOpacity={active ? 0.25 : 0.6}
              strokeWidth={2}
            />
            {active ? (
              <path
                d="M12 3a9 9 0 0 1 9 9"
                stroke={ICE}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            ) : null}
          </svg>
        )}
      </div>
      {label}
    </div>
  );
};

const AiPanel: React.FC<{
  l: Layout;
  story: Story;
  t: number;
  intro: number;
}> = ({ l, story, t, intro }) => {
  const { k, ai } = l;
  const content = presence(t);
  const working = rise(t, T.taskArrives - 4, T.taskArrives + 8) * (1 - rise(t, T.done - 6, T.done + 12));
  const doneLabel = rise(t, T.done, T.done + 8) * (1 - linear(t, T.fadeOut, T.end));
  const received = rise(t, T.taskArrives, T.taskArrives + 10);
  const spin = interpolate(t, [T.taskArrives, T.done], [0, 720], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const diagonal = Math.hypot(ai.w, ai.h) * 1.1;
  const ringAngle = t * 5;
  const ring = {
    position: "absolute" as const,
    left: ai.w / 2 - diagonal / 2,
    top: ai.h / 2 - diagonal / 2,
    width: diagonal,
    height: diagonal,
    rotate: `${ringAngle}deg`,
    background: `conic-gradient(${ICE}, #ffffff 12%, ${AMBER} 30%, transparent 48%, ${ICE} 70%, transparent 86%, ${ICE})`,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: ai.x,
        top: ai.y,
        width: ai.w,
        height: ai.h,
        opacity: intro,
        translate: `0 ${(1 - intro) * 18}px`,
      }}
    >
      {/* The moving light around the panel is on only while the AI works. */}
      <div
        style={{
          position: "absolute",
          inset: -14,
          borderRadius: 30 * k,
          overflow: "hidden",
          filter: "blur(20px)",
          opacity: working * 0.6,
        }}
      >
        <div style={{ ...ring, left: ring.left + 14, top: ring.top + 14 }} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16 * k,
          overflow: "hidden",
          background: "rgba(127, 212, 255, 0.34)",
        }}
      >
        <div style={{ ...ring, opacity: working }} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 2,
          borderRadius: 15 * k,
          background: "#090f17",
          display: "flex",
          flexDirection: "column",
          padding: `${16 * k}px ${22 * k}px ${18 * k}px`,
          gap: 14 * k,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 * k }}>
          <Spark size={30 * k} rotate={spin} scale={1 + working * 0.14} />
          <div style={{ color: TEXT, fontSize: 25 * k, fontWeight: 600 }}>AI</div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              marginLeft: 6 * k,
              color: MUTED,
              fontSize: 19 * k,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              opacity: received * content,
            }}
          >
            {story.task}
          </div>
          <div
            style={{
              position: "relative",
              width: 100 * k,
              height: 28 * k,
              fontSize: 19 * k,
              fontWeight: 500,
              textAlign: "right",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 0,
                color: MUTED,
                opacity: 1 - Math.max(working, doneLabel),
              }}
            >
              Čaká
            </div>
            <div
              style={{ position: "absolute", right: 0, color: ICE, opacity: working }}
            >
              Pracuje
            </div>
            <div
              style={{ position: "absolute", right: 0, color: ICE, opacity: doneLabel }}
            >
              Hotovo
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9 * k,
            opacity: content * received,
          }}
        >
          {story.steps.map((step, i) => (
            <StepRow key={step} label={step} index={i} t={t} k={k} />
          ))}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: `${12 * k}px ${14 * k}px`,
            borderRadius: 10 * k,
            background: "rgba(127, 212, 255, 0.06)",
            border: "1px solid rgba(127, 212, 255, 0.16)",
            color: "#bfe8ff",
            fontFamily: mono,
            fontSize: 19 * k,
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
          }}
        >
          <span style={{ opacity: content }}>
            {typed(story.output, t, T.stepsStart + 6, T.outputEnd)}
          </span>
        </div>
      </div>
    </div>
  );
};

const THREADS = 6;

const Threads: React.FC<{ l: Layout; t: number; drawIn: number }> = ({
  l,
  t,
  drawIn,
}) => {
  const horizontal = l.flow === "h";
  const start = horizontal ? l.web.x + l.web.w : l.web.y + l.web.h;
  const end = horizontal ? l.ai.x : l.ai.y;
  const mid = horizontal
    ? l.web.y + l.web.h / 2
    : l.web.x + l.web.w / 2;
  const spread = horizontal ? l.web.h * 0.34 : l.web.w * 0.36;
  const gap = end - start;
  // Routes are written as (u: along the flow, v: across it).
  const pt = (u: number, v: number) => (horizontal ? `${u} ${v}` : `${v} ${u}`);
  const paths = Array.from({ length: THREADS }, (_, i) => {
    const v0 = mid + spread * ((2 * i) / (THREADS - 1) - 1);
    const v1 = mid + (v0 - mid) * 0.6;
    const u1 = start + gap * 0.1;
    const u2 = u1 + Math.min(Math.abs(v1 - v0), gap * 0.25);
    const u3 = start + gap * 0.5;
    const pull = (end - u3) * 0.55;
    return `M ${pt(start, v0)} L ${pt(u1, v0)} L ${pt(u2, v1)} L ${pt(u3, v1)} C ${pt(u3 + pull, v1)} ${pt(end - pull, v0)} ${pt(end, v0)}`;
  });
  const axis = horizontal
    ? { x1: start, y1: 0, x2: end, y2: 0 }
    : { x1: 0, y1: start, x2: 0, y2: end };

  // Pulses only run when something is actually being sent.
  const out = (i: number) => linear(t, T.send + 2 + i * 2, T.taskArrives + i * 2);
  const back = (i: number) =>
    linear(t, T.solutionLeaves + i * 2, T.result + i * 2);

  return (
    <svg
      width={l.width}
      height={l.height}
      viewBox={`0 0 ${l.width} ${l.height}`}
      style={{ position: "absolute" }}
    >
      <defs>
        <linearGradient id="thread" gradientUnits="userSpaceOnUse" {...axis}>
          <stop offset="0" stopColor={AMBER} />
          <stop offset="0.55" stopColor="#f2efe6" />
          <stop offset="1" stopColor={ICE} />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke="url(#thread)"
          strokeOpacity={0.5}
          strokeWidth={1.5}
          strokeDasharray="1 1"
          strokeDashoffset={1 - drawIn}
        />
      ))}
      <g style={{ filter: `drop-shadow(0 0 7px ${AMBER})` }}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1000}
            fill="none"
            stroke="#ffd59c"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray="70 930"
            strokeDashoffset={-out(i) * 1000}
            opacity={out(i) > 0 && out(i) < 1 ? 1 : 0}
          />
        ))}
      </g>
      <g style={{ filter: `drop-shadow(0 0 7px ${ICE})` }}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1000}
            fill="none"
            stroke="#c9edff"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray="70 930"
            strokeDashoffset={-(1 - back(i)) * 1000}
            opacity={back(i) > 0 && back(i) < 1 ? 1 : 0}
          />
        ))}
      </g>
    </svg>
  );
};

// The labelled messages that travel along the connection.
const Courier: React.FC<{ l: Layout; t: number }> = ({ l, t }) => {
  const horizontal = l.flow === "h";
  const { k } = l;
  const start = horizontal ? l.web.x + l.web.w : l.web.y + l.web.h;
  const end = horizontal ? l.ai.x : l.ai.y;
  const mid = horizontal ? l.web.y + l.web.h / 2 : l.web.x + l.web.w / 2;

  const pill = (
    label: string,
    color: string,
    progress: number,
    visible: number,
    icon: boolean,
  ) => {
    const u = start + (end - start) * progress;
    return (
      <div
        style={{
          position: "absolute",
          left: horizontal ? u : mid,
          top: horizontal ? mid : u,
          translate: "-50% -50%",
          opacity: visible,
          display: "flex",
          alignItems: "center",
          gap: 6 * k,
          padding: `${7 * k}px ${15 * k}px`,
          borderRadius: 99,
          background: color,
          color: INK,
          fontSize: 20 * k,
          fontWeight: 600,
          whiteSpace: "nowrap",
          boxShadow: `0 0 26px ${color}`,
        }}
      >
        {icon ? <Check size={20 * k} color={INK} /> : null}
        {label}
      </div>
    );
  };

  const outProgress = interpolate(t, [T.send + 2, T.taskArrives], [0.12, 0.88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const backProgress = interpolate(t, [T.solutionLeaves, T.result], [0.88, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <>
      {pill(
        "Úloha",
        AMBER,
        outProgress,
        linear(t, T.send + 2, T.send + 8) * (1 - linear(t, T.taskArrives - 6, T.taskArrives)),
        false,
      )}
      {pill(
        "Riešenie",
        ICE,
        backProgress,
        linear(t, T.solutionLeaves, T.solutionLeaves + 6) * (1 - linear(t, T.result - 6, T.result)),
        true,
      )}
    </>
  );
};

export const WebAiScene: React.FC<{ layout: Layout }> = ({ layout: l }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - INTRO_FRAMES;
  const t = elapsed < 0 ? -1 : elapsed % STORY_FRAMES;
  const story =
    stories[elapsed < 0 ? 0 : Math.floor(elapsed / STORY_FRAMES) % stories.length];
  const intro = rise(frame, 0, 26);
  const drawIn = rise(frame, 18, 56);
  const working = rise(t, T.taskArrives - 4, T.taskArrives + 8) * (1 - rise(t, T.done - 6, T.done + 16));
  const horizontal = l.flow === "h";
  const aiX = ((l.ai.x + l.ai.w / 2) / l.width) * 100;
  const aiY = ((l.ai.y + l.ai.h / 2) / l.height) * 100;
  const webX = ((l.web.x + l.web.w / 2) / l.width) * 100;
  const webY = ((l.web.y + l.web.h / 2) / l.height) * 100;
  const radius = horizontal ? "48% 62%" : "75% 34%";

  return (
    <AbsoluteFill style={{ backgroundColor: INK, fontFamily: sans }}>
      <AbsoluteFill
        style={{
          opacity: intro,
          background: `radial-gradient(ellipse ${radius} at ${webX}% ${webY}%, rgba(255, 180, 84, 0.1), transparent 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: intro * (0.55 + working * 0.45),
          background: `radial-gradient(ellipse ${radius} at ${aiX}% ${aiY}%, rgba(127, 212, 255, 0.18), transparent 100%)`,
        }}
      />
      {/* Fades every edge to the page colour, so the video has no visible border. */}
      <AbsoluteFill style={{ boxShadow: `inset 0 0 110px 50px ${INK}` }} />
      <Threads l={l} t={t} drawIn={drawIn} />
      <WebPanel l={l} story={story} t={t} intro={intro} />
      <AiPanel l={l} story={story} t={t} intro={intro} />
      <Courier l={l} t={t} />
    </AbsoluteFill>
  );
};
