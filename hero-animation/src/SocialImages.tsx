import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { AbsoluteFill } from "remotion";
import { LAYERS, Lang } from "./WebAiScene";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600"],
  subsets: ["latin", "latin-ext"],
});

const AMBER = "#ffb454";
const ICE = "#7fd4ff";
const INK = "#06090f";

const COPY = {
  en: {
    title: "Your bridge to the world of AI.",
    sub: "AI integration, chatbots and automation for businesses",
  },
  sk: {
    title: "Váš most do sveta AI.",
    sub: "AI integrácia, chatboty a automatizácia pre firmy",
  },
};

const mix = (t: number) => {
  const from = [255, 180, 84];
  const to = [127, 212, 255];
  return `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(",")})`;
};

// The preview shown when a link to the site is shared.
export const OgImage: React.FC<{ lang: Lang }> = ({ lang }) => {
  const copy = COPY[lang];
  return (
    <AbsoluteFill
      style={{
        fontFamily,
        color: "#f2f5fa",
        padding: "56px 68px",
        justifyContent: "space-between",
        background: `radial-gradient(ellipse 60% 70% at 0% 100%, rgba(255, 180, 84, 0.16), transparent), radial-gradient(ellipse 60% 70% at 100% 100%, rgba(127, 212, 255, 0.2), transparent), ${INK}`,
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.01em" }}>
        <span style={{ color: AMBER }}>Web</span>Bridge
        <span style={{ color: ICE }}>.AI</span>
      </div>
      <div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 600,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            textWrap: "balance",
          }}
        >
          {copy.title}
        </div>
        <div style={{ marginTop: 22, fontSize: 36, color: "#b6c0ce" }}>
          {copy.sub}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 37,
            left: 37,
            right: 37,
            height: 3,
            background: `linear-gradient(90deg, ${AMBER}, #f2efe6 50%, ${ICE})`,
            opacity: 0.6,
          }}
        />
        {LAYERS.map(({ label, icon: Icon }, i) => (
          <div
            key={label}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: INK,
              boxShadow: `inset 0 0 0 2.5px ${mix(i / 7)}`,
            }}
          >
            <Icon size={36} color={mix(i / 7)} strokeWidth={1.9} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Square icon for browsers, phones and search results.
export const AppIcon: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: INK }}>
    <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none">
      <path
        d="M4.5 10 9.5 25 14.5 12.5 19.5 25 23.5 14"
        stroke={AMBER}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 3.5C25.4 6.4 26.4 7.4 29.3 7.8 26.4 8.2 25.4 9.2 25 12.1 24.6 9.2 23.6 8.2 20.7 7.8 23.6 7.4 24.6 6.4 25 3.5Z"
        fill={ICE}
      />
    </svg>
  </AbsoluteFill>
);
