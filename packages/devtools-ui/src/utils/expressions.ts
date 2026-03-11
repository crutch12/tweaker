import { MANUAL_INTERCEPTOR_TYPE } from "@tweaker/extension-plugin";
import { ExtensionInterceptor } from "../features/interceptors/InterceptorItem/InterceptorItem";
import { FETCH_INTERCEPTOR_TYPE } from "@tweaker/fetch-plugin";

const RETURN_VALUE = "  return value";

export function getDefaultInterceptorData(
  type: string,
): ExtensionInterceptor["data"] {
  switch (type) {
    case MANUAL_INTERCEPTOR_TYPE: {
      return {
        expression: RETURN_VALUE,
      };
    }
    case FETCH_INTERCEPTOR_TYPE: {
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
    default: {
      throw new Error(`Unknown Interceptor type: ${type}`);
    }
  }
}
