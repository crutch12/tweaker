import { TypedInterceptorBase, InterceptorBase } from "@tweaker/core";

export const MANUAL_INTERCEPTOR_TYPE = "manual";

export type ManualInterceptor = TypedInterceptorBase<
  typeof MANUAL_INTERCEPTOR_TYPE,
  {
    expression?: string;
  }
>;

export function isManualInterceptor(
  interceptor: InterceptorBase,
): interceptor is ManualInterceptor {
  return interceptor.type === MANUAL_INTERCEPTOR_TYPE;
}
