import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";

// Timeline: an intro that builds the bridge once, then a loop of LOOP_FRAMES.
// Everything that keeps moving after the intro is periodic in LOOP_FRAMES
// (integer cycle counts only), so frame INTRO_FRAMES + LOOP_FRAMES is identical
// to frame INTRO_FRAMES and the loop has no visible seam.
export const FPS = 30;
export const INTRO_FRAMES = 4 * FPS;
export const LOOP_FRAMES = 12 * FPS;

export type Layout = {
  width: number;
  height: number;
  waterY: number;
  deckEndY: number;
  deckMidY: number;
  pylonFootX: number;
  pylonTop: { x: number; y: number };
  spanCables: number;
  spanFromX: number;
  spanToX: number;
  backCables: number;
  backFromX: number;
  backToX: number;
};

export const WIDE: Layout = {
  width: 1920,
  height: 1080,
  waterY: 826,
  deckEndY: 752,
  deckMidY: 694,
  pylonFootX: 1298,
  pylonTop: { x: 1490, y: 150 },
  spanCables: 15,
  spanFromX: 1200,
  spanToX: 300,
  backCables: 7,
  backFromX: 1460,
  backToX: 1890,
};

export const TALL: Layout = {
  width: 1080,
  height: 1920,
  waterY: 1596,
  deckEndY: 1530,
  deckMidY: 1490,
  pylonFootX: 660,
  pylonTop: { x: 800, y: 960 },
  spanCables: 10,
  spanFromX: 590,
  spanToX: 40,
  backCables: 5,
  backFromX: 790,
  backToX: 1060,
};

const WARM = "#ffb454";
const WHITE = "#eaf2ff";
const RED = "#ff4a3d";
const TAU = Math.PI * 2;

const rise = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

// One integer `cycles` per loop keeps the value seamless across the loop point.
const wave = (frame: number, cycles: number, phase: number) =>
  Math.sin(TAU * ((cycles * frame) / LOOP_FRAMES + phase));

const dashOffset = (frame: number, pattern: number, cycles: number) =>
  (-pattern * cycles * frame) / LOOP_FRAMES;

const deckY = (l: Layout, x: number) => {
  const t = x / l.width;
  const controlY = 2 * l.deckMidY - l.deckEndY;
  return (
    (1 - t) * (1 - t) * l.deckEndY +
    2 * (1 - t) * t * controlY +
    t * t * l.deckEndY
  );
};

const deckPath = (l: Layout, offset: number) => {
  const controlY = 2 * l.deckMidY - l.deckEndY;
  return `M 0 ${l.deckEndY + offset} Q ${l.width / 2} ${controlY + offset} ${l.width} ${l.deckEndY + offset}`;
};

// Pylon axis point; 0 is the top, 1 is where it meets the water.
const pylonPoint = (l: Layout, along: number) => ({
  x: l.pylonTop.x + (l.pylonFootX - l.pylonTop.x) * along,
  y: l.pylonTop.y + (l.waterY - l.pylonTop.y) * along,
});

type Cable = { d: string; delay: number; cycles: number; phase: number };

const buildCables = (l: Layout): Cable[] => {
  const fan = (
    count: number,
    fromX: number,
    toX: number,
    key: string,
  ): Cable[] =>
    Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? 0 : i / (count - 1);
      const anchor = pylonPoint(l, 0.05 + (1 - t) * 0.3);
      const x = fromX + (toX - fromX) * t;
      return {
        d: `M ${anchor.x} ${anchor.y} L ${x} ${deckY(l, x)}`,
        delay: t,
        cycles: 1 + Math.floor(random(`${key}-c-${i}`) * 2),
        phase: random(`${key}-p-${i}`),
      };
    });

  return [
    ...fan(l.spanCables, l.spanFromX, l.spanToX, "span"),
    ...fan(l.backCables, l.backFromX, l.backToX, "back"),
  ];
};

const Sky: React.FC<{ l: Layout; frame: number }> = ({ l, frame }) => {
  const intro = rise(frame, 0, 60);
  return (
    <g opacity={intro}>
      {Array.from({ length: 80 }, (_, i) => (
        <circle
          key={i}
          cx={random(`star-x-${i}`) * l.width}
          cy={random(`star-y-${i}`) * l.waterY * 0.72}
          r={0.6 + random(`star-r-${i}`) * 0.9}
          fill={WHITE}
          opacity={
            (0.14 + random(`star-o-${i}`) * 0.4) *
            (0.75 + 0.25 * wave(frame, 1 + (i % 3), random(`star-w-${i}`)))
          }
        />
      ))}
    </g>
  );
};

const Skyline: React.FC<{ l: Layout; frame: number }> = ({ l, frame }) => {
  const intro = rise(frame, 10, 70);
  const buildings = Math.ceil(l.width / 22);
  return (
    <g opacity={intro} style={{ filter: "blur(0.8px)" }}>
      {Array.from({ length: buildings }, (_, i) => {
        const h = 6 + random(`b-h-${i}`) * random(`b-k-${i}`) * 52;
        return (
          <rect
            key={i}
            x={i * 22 - 4}
            y={l.waterY - h}
            width={14 + random(`b-w-${i}`) * 18}
            height={h}
            fill="#0a0f18"
          />
        );
      })}
      {Array.from({ length: Math.ceil(l.width / 11) }, (_, i) => (
        <rect
          key={i}
          x={random(`w-x-${i}`) * l.width}
          y={l.waterY - 3 - random(`w-y-${i}`) * random(`w-k-${i}`) * 40}
          width={2}
          height={2}
          fill={random(`w-c-${i}`) > 0.8 ? WHITE : WARM}
          opacity={
            (0.25 + random(`w-o-${i}`) * 0.45) *
            (i % 9 === 0
              ? 0.6 + 0.4 * wave(frame, 1 + (i % 2), random(`w-p-${i}`))
              : 1)
          }
        />
      ))}
    </g>
  );
};

// The bridge structure on its own, so the reflection can reuse it.
const Structure: React.FC<{ l: Layout; frame: number; cables: Cable[] }> = ({
  l,
  frame,
  cables,
}) => {
  const top = l.pylonTop;
  const footX = l.pylonFootX;
  const pylonGrow = rise(frame, 16, 62);
  const clipY = interpolate(pylonGrow, [0, 1], [l.waterY, top.y - 30]);
  const deckDraw = rise(frame, 0, 48);
  const capIn = rise(frame, 54, 80);

  return (
    <g>
      <defs>
        <linearGradient
          id="pylon"
          gradientUnits="userSpaceOnUse"
          x1={top.x}
          y1={top.y}
          x2={footX}
          y2={l.waterY}
        >
          <stop offset="0" stopColor="#141b27" />
          <stop offset="0.62" stopColor="#1d2430" />
          <stop offset="0.86" stopColor="#6d5234" />
          <stop offset="1" stopColor="#1a1a1f" />
        </linearGradient>
        <linearGradient
          id="pylon-edge"
          gradientUnits="userSpaceOnUse"
          x1={top.x}
          y1={top.y}
          x2={footX}
          y2={l.waterY}
        >
          <stop offset="0" stopColor={WARM} stopOpacity={0.2} />
          <stop offset="0.8" stopColor={WARM} stopOpacity={0.85} />
          <stop offset="1" stopColor={WARM} stopOpacity={0.15} />
        </linearGradient>
        <linearGradient
          id="cable"
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={top.y}
          x2={0}
          y2={l.deckMidY}
        >
          <stop offset="0" stopColor="#7f97b3" stopOpacity={0.5} />
          <stop offset="1" stopColor="#ffdcae" stopOpacity={0.72} />
        </linearGradient>
        <clipPath id="pylon-clip">
          <rect x={0} y={clipY} width={l.width} height={l.height} />
        </clipPath>
      </defs>

      {cables.map((cable, i) => (
        <path
          key={i}
          d={cable.d}
          pathLength={1}
          fill="none"
          stroke="url(#cable)"
          strokeWidth={1.5}
          strokeDasharray="1 1"
          strokeDashoffset={
            1 - rise(frame, 44 + cable.delay * 42, 74 + cable.delay * 42)
          }
        />
      ))}

      <g clipPath="url(#pylon-clip)">
        <polygon
          points={`${top.x - 5} ${top.y} ${top.x + 5} ${top.y} ${footX + 15} ${l.waterY} ${footX - 15} ${l.waterY}`}
          fill="url(#pylon)"
        />
        <line
          x1={top.x - 5}
          y1={top.y}
          x2={footX - 15}
          y2={l.waterY}
          stroke="url(#pylon-edge)"
          strokeWidth={1.4}
        />
      </g>

      <g opacity={capIn}>
        <ellipse cx={top.x} cy={top.y - 3} rx={22} ry={7} fill="#141b27" />
        <ellipse cx={top.x} cy={top.y} rx={38} ry={8} fill="#141b27" />
        <ellipse
          cx={top.x}
          cy={top.y}
          rx={31}
          ry={1.8}
          fill="#ffd9a3"
          style={{ filter: "drop-shadow(0 0 7px #ffb454)" }}
        />
      </g>

      <path
        d={deckPath(l, 8)}
        pathLength={1}
        fill="none"
        stroke="#090e16"
        strokeWidth={13}
        strokeDasharray="1 1"
        strokeDashoffset={1 - deckDraw}
      />
      <path
        d={deckPath(l, 2)}
        pathLength={1}
        fill="none"
        stroke="#7f93aa"
        strokeWidth={1.6}
        strokeDasharray="1 1"
        strokeDashoffset={1 - deckDraw}
      />
    </g>
  );
};

const CablePulses: React.FC<{
  l: Layout;
  frame: number;
  cables: Cable[];
}> = ({ frame, cables }) => {
  const on = rise(frame, 90, 120);
  return (
    <g opacity={on} style={{ filter: "drop-shadow(0 0 5px #ffb454)" }}>
      {cables.map((cable, i) => (
        <path
          key={i}
          d={cable.d}
          pathLength={1000}
          fill="none"
          stroke="#ffd9a3"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeDasharray="20 980"
          strokeDashoffset={
            dashOffset(frame, 1000, cable.cycles) + cable.phase * 1000
          }
        />
      ))}
    </g>
  );
};

const lanes = [
  { offset: -5, color: WHITE, direction: 1 },
  { offset: 0, color: RED, direction: -1 },
];

const streaks = [
  { width: 2.6, pattern: [170, 120, 60, 150], cycles: 2 },
  { width: 1.6, pattern: [60, 265], cycles: 5 },
];

const LightTrails: React.FC<{ l: Layout; frame: number }> = ({ l, frame }) => {
  const on = rise(frame, 70, 118);
  return (
    <g opacity={on}>
      {lanes.map((lane) => (
        <g key={lane.offset}>
          <path
            d={deckPath(l, lane.offset)}
            fill="none"
            stroke={lane.color}
            strokeOpacity={0.5}
            strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 4px ${lane.color})` }}
          />
          {streaks.map((streak) => {
            const pattern = streak.pattern.reduce((sum, n) => sum + n, 0);
            return (
              <path
                key={streak.cycles}
                d={deckPath(l, lane.offset)}
                pathLength={1000}
                fill="none"
                stroke={lane.color}
                strokeWidth={streak.width}
                strokeLinecap="round"
                strokeDasharray={streak.pattern.join(" ")}
                strokeDashoffset={
                  lane.direction * dashOffset(frame, pattern, streak.cycles)
                }
                style={{ filter: `drop-shadow(0 0 9px ${lane.color})` }}
              />
            );
          })}
        </g>
      ))}
    </g>
  );
};

const lampXs = (l: Layout) =>
  Array.from({ length: Math.floor(l.width / 64) + 1 }, (_, i) => 16 + i * 64);

const Lamps: React.FC<{ l: Layout; frame: number }> = ({ l, frame }) => {
  return (
    <g>
      {lampXs(l).map((x) => {
        // The lamps switch on in a wave running outwards from the pylon.
        const distance = Math.abs(x - l.pylonFootX) / l.width;
        const on = rise(frame, 68 + distance * 40, 84 + distance * 40);
        const y = deckY(l, x) - 15;
        return (
          <g key={x} opacity={on}>
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={y + 13}
              stroke="#4a5666"
              strokeWidth={1}
            />
            <circle
              cx={x}
              cy={y}
              r={13}
              fill="url(#lamp-glow)"
              style={{ mixBlendMode: "screen" }}
            />
            <circle cx={x} cy={y} r={1.8} fill="#ffe2b0" />
          </g>
        );
      })}
    </g>
  );
};

// Light on moving water: a column of fine horizontal dashes under every lamp,
// widening with distance and swaying on whole-number cycles per loop.
const WaterLights: React.FC<{ l: Layout; frame: number }> = ({ l, frame }) => {
  const on = rise(frame, 84, 120);
  const rows = 34;
  const spacing = (l.height - l.waterY - 12) / rows;
  const sources = lampXs(l).map((x, i) => ({
    x,
    color: i % 5 === 2 ? RED : i % 5 === 4 ? WHITE : WARM,
  }));
  return (
    <g opacity={on} style={{ mixBlendMode: "screen" }}>
      {sources.map((source, s) =>
        Array.from({ length: rows }, (_, r) => {
          const key = `${s}-${r}`;
          const depth = r / rows;
          const width = (3 + depth * 24) * (0.45 + random(`w-${key}`) * 0.8);
          const sway =
            wave(frame, 1 + (r % 3), random(`sway-${key}`)) * (1 + depth * 11);
          return (
            <rect
              key={key}
              x={source.x + sway - width / 2}
              y={l.waterY + 6 + r * spacing}
              width={width}
              height={1.5 + depth * 1.2}
              rx={1}
              fill={source.color}
              opacity={
                0.62 *
                Math.pow(1 - depth, 1.5) *
                (0.6 + 0.4 * wave(frame, 2 + (r % 3), random(`shim-${key}`)))
              }
            />
          );
        }),
      )}
    </g>
  );
};

export const BridgeScene: React.FC<{ layout: Layout }> = ({ layout: l }) => {
  const frame = useCurrentFrame();
  const cables = buildCables(l);
  const glow = rise(frame, 0, 100);
  const haze = rise(frame, 70, 120);

  return (
    <AbsoluteFill style={{ backgroundColor: "#06090f" }}>
      <AbsoluteFill
        style={{
          opacity: glow,
          background: `radial-gradient(ellipse 85% 42% at ${(l.pylonFootX / l.width) * 100}% ${(l.waterY / l.height) * 100}%, #3a2a22 0%, #1a2030 42%, transparent 100%), linear-gradient(180deg, #05070d 0%, #0a101c ${(l.deckMidY / l.height) * 62}%, #141c2c ${(l.waterY / l.height) * 100}%)`,
        }}
      />
      <svg
        width={l.width}
        height={l.height}
        viewBox={`0 0 ${l.width} ${l.height}`}
        style={{ position: "absolute" }}
      >
        <defs>
          <radialGradient id="lamp-glow">
            <stop offset="0" stopColor={WARM} stopOpacity={0.42} />
            <stop offset="1" stopColor={WARM} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#10151f" />
            <stop offset="1" stopColor="#04060b" />
          </linearGradient>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity={0.6} />
            <stop offset="1" stopColor="white" stopOpacity={0.05} />
          </linearGradient>
          <mask
            id="reflection-mask"
            maskUnits="userSpaceOnUse"
            x={0}
            y={l.waterY}
            width={l.width}
            height={l.height - l.waterY}
          >
            <rect
              x={0}
              y={l.waterY}
              width={l.width}
              height={l.height - l.waterY}
              fill="url(#fade)"
            />
          </mask>
        </defs>

        <Sky l={l} frame={frame} />
        <Skyline l={l} frame={frame} />

        <rect
          x={0}
          y={l.waterY}
          width={l.width}
          height={l.height - l.waterY}
          fill="url(#water)"
        />
        <g mask="url(#reflection-mask)">
          <g
            transform={`translate(0 ${2 * l.waterY}) scale(1 -1)`}
            style={{ filter: "blur(2.5px)" }}
          >
            <Structure l={l} frame={frame} cables={cables} />
          </g>
        </g>
        <WaterLights l={l} frame={frame} />

        <path
          d={deckPath(l, -6)}
          fill="none"
          stroke={WARM}
          strokeWidth={60}
          opacity={0.13 * haze}
          style={{ filter: "blur(38px)", mixBlendMode: "screen" }}
        />
        <Structure l={l} frame={frame} cables={cables} />
        <CablePulses l={l} frame={frame} cables={cables} />
        <Lamps l={l} frame={frame} />
        <LightTrails l={l} frame={frame} />
      </svg>
    </AbsoluteFill>
  );
};
