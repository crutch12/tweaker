import { Tweaker } from "./Tweaker";

export interface TweakerPlugin {
  name: string;
  version: string;
  setup(instance: Tweaker, emitter: Tweaker["eventEmitter"]): void;
  ready(): Promise<boolean>;
}
