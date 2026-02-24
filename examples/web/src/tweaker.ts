import { Tweaker, TweakerSample } from "@tweaker/core";
import { extensionPlugin } from "@tweaker/extension-plugin";
import { Dog, User } from "./Example";

const tweaker = new Tweaker<{
  patterns: {
    "users.generate": User;
    "dogs.generate": Dog;
    "dogs.replace.*": Dog;
  };
}>({
  name: "web",
  plugins: [extensionPlugin()],
});

export function prepareTweakerSamples<T>(
  samples: TweakerSample<T>[],
): TweakerSample<T>[] {
  // Builder specific code to remove samples code from build
  if (import.meta.env.REMOVE_TWEAKER_SAMPLES) {
    return [];
  }
  return samples;
}

export { tweaker };
