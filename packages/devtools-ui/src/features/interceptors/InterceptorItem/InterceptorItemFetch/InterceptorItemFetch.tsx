import { InterceptorPayload } from "@tweaker/extension-plugin";
import { InterceptorItem, InterceptorItemProps } from "../InterceptorItem";
import { InterceptorItemFetchForm } from "./InterceptorItemFetchForm";
import { useMemo, useState } from "react";
import equal from "fast-deep-equal";
import { FetchInterceptor } from "@tweaker/fetch-plugin";

interface UseFetchDataProps {
  interceptor: InterceptorPayload<FetchInterceptor>;
}

function useFetchData({ interceptor }: UseFetchDataProps) {
  const [data, setData] = useState(() => interceptor.data);

  const hasChanges = useMemo(() => {
    return !equal([interceptor.data?.json?.static], [data?.json?.static]);
  }, [data, interceptor.data]);

  return { data, setData, hasChanges };
}

export interface InterceptorItemFetchProps extends InterceptorItemProps<
  InterceptorPayload<FetchInterceptor>
> {}

export function InterceptorItemFetch({ ...props }: InterceptorItemFetchProps) {
  const { data, setData, hasChanges } = useFetchData({
    interceptor: props.interceptor,
  });
  return (
    <InterceptorItem
      {...(props as InterceptorItemProps)}
      hasChanges={hasChanges}
    >
      <InterceptorItemFetchForm
        {...props}
        data={data}
        onDataChange={setData}
        hasChanges={hasChanges}
      />
    </InterceptorItem>
  );
}
