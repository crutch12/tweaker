import { InterceptorPayload } from "@tweaker/extension-plugin";
import { InterceptorItem, InterceptorItemProps } from "../InterceptorItem";
import { DefaultInterceptorForm } from "./InterceptorItemDefaultForm";
import { DefaultInterceptor } from "@tweaker/core";
import { useInterceptorPatterns } from "../useInterceptorPatterns";

export interface InterceptorItemDefaultProps extends InterceptorItemProps<
  InterceptorPayload<DefaultInterceptor>
> {}

export function InterceptorItemDefault({
  ...props
}: InterceptorItemDefaultProps) {
  const { patterns, setPatterns } = useInterceptorPatterns({
    interceptor: props.interceptor,
  });
  return (
    <InterceptorItem {...(props as InterceptorItemProps)}>
      <DefaultInterceptorForm
        {...props}
        patterns={patterns}
        onPatternsChange={setPatterns}
      />
    </InterceptorItem>
  );
}
