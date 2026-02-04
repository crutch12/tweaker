import { Tweaker, TweakerSample } from "@tweaker/core";

const tweaker = new Tweaker({ name: "web" });

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
