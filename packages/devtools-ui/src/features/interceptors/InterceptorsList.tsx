import { HTMLAttributes, RefObject } from "react";
import { ExtensionInterceptor } from "./InterceptorItem/InterceptorItem";
import { Grid, Text } from "@radix-ui/themes";
import { InterceptorItemDefault } from "./InterceptorItem/InterceptorItemDefault/InterceptorItemDefault";
import { isDefaultInterceptor } from "@tweaker/core";
import { isFetchInterceptor } from "@tweaker/fetch-plugin";
import { InterceptorItemFetch } from "./InterceptorItem/InterceptorItemFetch/InterceptorItemFetch";
import { isManualInterceptor } from "@tweaker/extension-plugin";
import { InterceptorItemManual } from "./InterceptorItem/InterceptorItemManual/InterceptorItemManual";

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
      {interceptors.map((interceptor) => {
        const key = interceptor.name + interceptor.id;

        if (isDefaultInterceptor(interceptor)) {
          return (
            <InterceptorItemDefault
              key={key}
              interceptor={interceptor}
              onChange={onInterceptorChange}
              onRemove={onInterceptorRemove}
              onFilterMessages={onFilterMessages}
              onDuplicate={onDuplicate}
              onHightLightInterceptor={onHightLightInterceptor}
            />
          );
        }

        if (isManualInterceptor(interceptor)) {
          return (
            <InterceptorItemManual
              key={key}
              interceptor={interceptor}
              onChange={onInterceptorChange}
              onRemove={onInterceptorRemove}
              onFilterMessages={onFilterMessages}
              onDuplicate={onDuplicate}
              onHightLightInterceptor={onHightLightInterceptor}
            />
          );
        }

        if (isFetchInterceptor(interceptor)) {
          return (
            <InterceptorItemFetch
              key={key}
              interceptor={interceptor}
              onChange={onInterceptorChange}
              onRemove={onInterceptorRemove}
              onFilterMessages={onFilterMessages}
              onDuplicate={onDuplicate}
              onHightLightInterceptor={onHightLightInterceptor}
            />
          );
        }

        return (
          <Text color="red">Unknown interceptor type: ${interceptor.type}</Text>
        );
      })}
    </Grid>
  );
}
