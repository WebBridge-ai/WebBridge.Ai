import { Composition } from "remotion";
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
    </>
  );
};
