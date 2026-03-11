import { InterceptorBase, TypedInterceptorBase } from "../types";

export const DEFAULT_INTERCEPTOR_TYPE = "default";

export type DefaultInterceptor = TypedInterceptorBase<
  typeof DEFAULT_INTERCEPTOR_TYPE,
  {}
>;

export function isDefaultInterceptor(
  interceptor: InterceptorBase,
): interceptor is DefaultInterceptor {
  return interceptor.type === DEFAULT_INTERCEPTOR_TYPE;
}

export const SAMPLE_INTERCEPTOR_TYPE = "sample";

export type SampleInterceptor = TypedInterceptorBase<
  typeof SAMPLE_INTERCEPTOR_TYPE,
  {}
>;

export function isSampleInterceptor(
  interceptor: InterceptorBase,
): interceptor is SampleInterceptor {
  return interceptor.type === SAMPLE_INTERCEPTOR_TYPE;
}
