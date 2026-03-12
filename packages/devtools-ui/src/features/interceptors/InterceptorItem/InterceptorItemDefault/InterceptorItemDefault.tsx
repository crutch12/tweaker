import { InterceptorPayload } from "@tweaker/extension-plugin";
import {
  InterceptorItem,
  InterceptorItemProps,
  usePatters,
} from "../InterceptorItem";
import { DefaultInterceptorForm } from "./InterceptorItemDefaultForm";
import { DefaultInterceptor } from "@tweaker/core";

export interface InterceptorItemDefaultProps extends InterceptorItemProps<
  InterceptorPayload<DefaultInterceptor>
> {}

export function InterceptorItemDefault({
  children,
  ...props
}: InterceptorItemDefaultProps) {
  const { patterns, setPatterns } = usePatters({
    interceptor: props.interceptor,
  });
  return (
    <InterceptorItem {...(props as Omit<InterceptorItemProps, "children">)}>
      <DefaultInterceptorForm
        interceptor={props.interceptor}
        onChange={props.onChange}
        onRemove={props.onRemove}
        onFilterMessages={props.onFilterMessages}
        onDuplicate={props.onDuplicate}
        onHightLightInterceptor={props.onHightLightInterceptor}
        patterns={patterns}
        onPatternsChange={setPatterns}
      />
    </InterceptorItem>
  );
}
