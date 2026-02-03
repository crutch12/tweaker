import { Tweaker, TweakerSample } from "@tweaker/core/src";

const tweaker = new Tweaker({ name: "app" });

if (!import.meta.env) {
  import.meta.env = {};
}

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
