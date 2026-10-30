import { Composition } from "remotion";
import {
  BridgeScene,
  FPS,
  INTRO_FRAMES,
  Layout,
  LOOP_FRAMES,
  TALL,
  WIDE,
} from "./BridgeScene";

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
          component={BridgeScene}
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
