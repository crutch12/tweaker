import { InterceptorPayload } from "@tweaker/extension-plugin";
import { useEffect, useState } from "react";
import { serializePatterns } from "../../../utils/pattern";

export interface UseInterceptorPatternsProps {
  interceptor: InterceptorPayload;
}

export function useInterceptorPatterns({
  interceptor,
}: UseInterceptorPatternsProps) {
  const [patterns, setPatterns] = useState(() =>
    serializePatterns(interceptor.patterns),
  );

  useEffect(() => {
    setPatterns(serializePatterns(interceptor.patterns));
  }, [interceptor.patterns]);

  return {
    patterns,
    setPatterns,
  };
}
