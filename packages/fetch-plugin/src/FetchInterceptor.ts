import { TypedInterceptorBase, InterceptorBase } from "@tweaker/core";

export const FETCH_INTERCEPTOR_TYPE = "fetch";

export type FetchResponseType = "json" | "text" | "expression";

export type FetchInterceptor = TypedInterceptorBase<
  typeof FETCH_INTERCEPTOR_TYPE,
  {
    selected?: FetchResponseType;
    status?: number;
  } & {
    [key in FetchResponseType]?: string;
  }
>;

export function isFetchInterceptor<I extends InterceptorBase>(
  interceptor: I,
): interceptor is I & FetchInterceptor {
  return interceptor.type === FETCH_INTERCEPTOR_TYPE;
}
