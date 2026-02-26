import type { InterceptorBase } from "@tweaker/core";

export type InterceptorPayload<T> = InterceptorBase & {
  name: string;
  expression?: string;
  sourceCode?: string;
};
