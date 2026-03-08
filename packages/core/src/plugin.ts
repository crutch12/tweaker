import { Tweaker } from "./Tweaker";
import { TweakerInterceptor, TweakerKey } from "./types";

export interface TweakerPlugin {
  name: string;
  version: string;
  setup(
    instance: Tweaker,
    emitter: Tweaker["eventEmitter"],
    pluginHooks: Tweaker["pluginHooks"],
  ): void;
  ready(): Promise<boolean>;
  handleAddInterceptor?(
    interceptor: TweakerInterceptor<TweakerKey, any>,
  ): boolean;
  handleUpdateInterceptor?(
    interceptor: TweakerInterceptor<TweakerKey, any>,
  ): boolean;
}
