import { Tweaker } from "./Tweaker";

export interface TweakerPlugin {
  name: string;
  version: string;
  setup(instance: Tweaker): void;
  ready(): Promise<boolean>;
}
