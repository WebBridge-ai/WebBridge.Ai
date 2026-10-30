import { Composition } from "remotion";
import {
  FPS,
  INTRO_FRAMES,
  Layout,
  LOOP_FRAMES,
  TALL,
  WebAiScene,
  WIDE,
} from "./WebAiScene";

const compositions: { id: string; layout: Layout }[] = [
  { id: "HeroWide", layout: WIDE },
  { id: "HeroTall", layout: TALL },
];

export const MyComposition = () => {
  return (
    <>
      {compositions.map(({ id, layout }) => (
        <Composition
          key={id}
          id={id}
          component={WebAiScene}
          durationInFrames={INTRO_FRAMES + LOOP_FRAMES}
          fps={FPS}
          width={layout.width}
          height={layout.height}
          defaultProps={{ layout }}
        />
      ))}
    </>
  );
};
