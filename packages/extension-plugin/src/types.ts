import type { InterceptorBase } from "@tweaker/core";

export type InterceptorPayload<T> = InterceptorBase & {
  name: string;
  sourceCode?: string;
  data?: {
    // TODO: narrow data type using "type" field
    // type: expression
    expression?: string;
    // type: fetch
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
  };
};
