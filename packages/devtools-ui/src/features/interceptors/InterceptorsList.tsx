import { HTMLAttributes, RefObject } from "react";
import {
  ExtensionInterceptor,
  InterceptorItem,
} from "./InterceptorItem/InterceptorItem";
import { Grid } from "@radix-ui/themes";

export interface InterceptorsListProps extends HTMLAttributes<HTMLElement> {
  interceptors: ExtensionInterceptor[];
  onInterceptorChange?: (interceptor: ExtensionInterceptor) => void;
  onInterceptorRemove?: (interceptor: ExtensionInterceptor) => void;
  onFilterMessages?: (patterns: string[]) => void;
  onDuplicate?: (interceptor: ExtensionInterceptor) => void;
  onHightLightInterceptor?: (
    interceptor: ExtensionInterceptor | undefined,
  ) => void;
  ref?: RefObject<any>;
}

export function InterceptorsList({
  interceptors: interceptors,
  onInterceptorChange,
  onInterceptorRemove,
  onFilterMessages,
  onDuplicate,
  onHightLightInterceptor,
  ref,
  ...props
}: InterceptorsListProps) {
  return (
    <Grid
      ref={ref}
      columns="repeat(auto-fit, minmax(min(100%, 450px), 1fr))"
      gap="2"
      {...props}
    >
      {interceptors.map((interceptor) => (
        <InterceptorItem
          key={interceptor.name + interceptor.id}
          interceptor={interceptor}
          onChange={onInterceptorChange}
          onRemove={onInterceptorRemove}
          onFilterMessages={onFilterMessages}
          onDuplicate={onDuplicate}
          onHightLightInterceptor={onHightLightInterceptor}
        />
      ))}
    </Grid>
  );
}
