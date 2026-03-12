import {
  InterceptorPayload,
  ManualInterceptor,
} from "@tweaker/extension-plugin";
import { InterceptorItem, InterceptorItemProps } from "../InterceptorItem";
import { useMemo, useState } from "react";
import equal from "fast-deep-equal";
import { InterceptorItemManualForm } from "./InterceptorItemManualForm";
import { useInterceptorPatterns } from "../useInterceptorPatterns";

interface UseManualDataProps {
  interceptor: InterceptorPayload<ManualInterceptor>;
}

function useManualData({ interceptor }: UseManualDataProps) {
  const [data, setData] = useState(() => interceptor.data);

  const hasChanges = useMemo(() => {
    return !equal(interceptor.data, data);
  }, [data, interceptor.data]);

  return { data, setData, hasChanges };
}

export interface InterceptorItemManualProps extends InterceptorItemProps<
  InterceptorPayload<ManualInterceptor>
> {}

export function InterceptorItemManual({
  ...props
}: InterceptorItemManualProps) {
  const { data, setData, hasChanges } = useManualData({
    interceptor: props.interceptor,
  });
  const { patterns, setPatterns } = useInterceptorPatterns({
    interceptor: props.interceptor,
  });
  return (
    <InterceptorItem
      {...(props as InterceptorItemProps)}
      hasChanges={hasChanges}
    >
      <InterceptorItemManualForm
        {...props}
        data={data}
        onDataChange={setData}
        patterns={patterns}
        onPatternsChange={setPatterns}
        hasChanges={hasChanges}
      />
    </InterceptorItem>
  );
}
