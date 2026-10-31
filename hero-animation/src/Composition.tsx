import { Composition, Still } from "remotion";
import { AppIcon, OgImage } from "./SocialImages";
import {
  FPS,
  INTRO_FRAMES,
  Lang,
  Layout,
  LOOP_FRAMES,
  TALL,
  WebAiScene,
  WIDE,
} from "./WebAiScene";

const compositions: { id: string; layout: Layout; lang: Lang }[] = [
  { id: "HeroWideEn", layout: WIDE, lang: "en" },
  { id: "HeroTallEn", layout: TALL, lang: "en" },
  { id: "HeroWideSk", layout: WIDE, lang: "sk" },
  { id: "HeroTallSk", layout: TALL, lang: "sk" },
];

export const MyComposition = () => {
  return (
    <>
      {compositions.map(({ id, layout, lang }) => (
        <Composition
          key={id}
          id={id}
          component={WebAiScene}
          durationInFrames={INTRO_FRAMES + LOOP_FRAMES}
          fps={FPS}
          width={layout.width}
          height={layout.height}
          defaultProps={{ layout, lang }}
        />
      ))}
      <Still id="OgEn" component={OgImage} width={1200} height={630} defaultProps={{ lang: "en" as const }} />
      <Still id="OgSk" component={OgImage} width={1200} height={630} defaultProps={{ lang: "sk" as const }} />
      <Still id="AppIcon" component={AppIcon} width={512} height={512} />
    </>
  );
};
