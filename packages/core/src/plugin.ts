import { Tweaker } from "./Tweaker";
import { InterceptorBase, TweakerInterceptor, TweakerKey } from "./types";

export interface TweakerPlugin {
  name: string;
  version: string;
  setup(
    instance: Tweaker,
    emitter: Tweaker["eventEmitter"],
    pluginHooks: Tweaker["pluginHooks"],
  ): void;
  ready(): Promise<boolean>;
  handleAddInterceptor?(interceptor: InterceptorBase): boolean;
  handleUpdateInterceptor?(interceptor: InterceptorBase): boolean;
}
