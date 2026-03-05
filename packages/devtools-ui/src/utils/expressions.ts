import { TweakerValueType } from "@tweaker/core";
import { ExtensionInterceptor } from "../features/interceptors/InterceptorItem/InterceptorItem";

const RETURN_VALUE = "  return value";

export function getDefaultInterceptorData(
  type: TweakerValueType,
): ExtensionInterceptor["data"] {
  switch (type) {
    case "default": {
      return {
        expression: RETURN_VALUE,
      };
    }
    case "fetch": {
      return {
        json: {
          static: "{\n}",
          expression: RETURN_VALUE,
        },
        text: {
          static: "{}",
          expression: RETURN_VALUE,
        },
        blob: {
          static: undefined,
          expression: RETURN_VALUE,
        },
        arrayBuffer: {
          static: undefined,
          expression: RETURN_VALUE,
        },
        formData: {
          static: undefined,
          expression: RETURN_VALUE,
        },
      };
    }
  }
}
