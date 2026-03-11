import type { InterceptorBase } from "@tweaker/core";

export type InterceptorPayload<T extends InterceptorBase = InterceptorBase> =
  T & {
    name: string;
    sourceCode?: string;
    // data?: {
    //   // TODO: narrow data type using "type" field
    //   // type: expression
    //   expression?: string;
    //   // type: fetch
    //   json?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   text?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   blob?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   formData?: {
    //     static?: string;
    //     expression?: string;
    //   };
    //   arrayBuffer?: {
    //     static?: string;
    //     expression?: string;
    //   };
    // };
  };

// export type TypedInterceptorPayload<
//   T extends string,
//   D extends Record<string, any>,
// > = Omit<InterceptorPayload, "type" | "data"> & {
//   type: T;
//   data?: D;
// };
