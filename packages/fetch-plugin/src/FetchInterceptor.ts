import { TypedInterceptorBase, InterceptorBase } from "@tweaker/core";

export const FETCH_INTERCEPTOR_TYPE = "fetch";

export type FetchInterceptor = TypedInterceptorBase<
  typeof FETCH_INTERCEPTOR_TYPE,
  {
    json?: {
      static?: string;
      expression?: string;
    };
    text?: {
      static?: string;
      expression?: string;
    };
    blob?: {
      static?: string;
      expression?: string;
    };
    formData?: {
      static?: string;
      expression?: string;
    };
    arrayBuffer?: {
      static?: string;
      expression?: string;
    };
  }
>;

export function isFetchInterceptor<I extends InterceptorBase>(
  interceptor: I,
): interceptor is I & FetchInterceptor {
  return interceptor.type === FETCH_INTERCEPTOR_TYPE;
}
