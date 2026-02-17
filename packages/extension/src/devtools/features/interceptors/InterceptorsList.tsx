import { css } from "@emotion/css";
import { MutableRefObject } from "react";
import { ExtensionInterceptor, InterceptorItem } from "./InterceptorItem";
import { Flex } from "@radix-ui/themes";

export interface InterceptorsListProps {
  interceptors: ExtensionInterceptor[];
  onInterceptorChange?: (interceptor: ExtensionInterceptor) => void;
  onInterceptorRemove?: (interceptor: ExtensionInterceptor) => void;
  onFilterMessages?: (patterns: string[]) => void;
  onDuplicate?: (interceptor: ExtensionInterceptor) => void;
  ref?: MutableRefObject<any>;
}

export function InterceptorsList({
  interceptors: interceptors,
  onInterceptorChange,
  onInterceptorRemove,
  onFilterMessages,
  onDuplicate,
  ref,
}: InterceptorsListProps) {
  return (
    <Flex ref={ref} direction="column" gap="2">
      {interceptors.map((interceptor) => (
        <InterceptorItem
          key={interceptor.name + interceptor.id}
          interceptor={interceptor}
          onChange={onInterceptorChange}
          onRemove={onInterceptorRemove}
          onFilterMessages={onFilterMessages}
          onDuplicate={onDuplicate}
        />
      ))}
    </Flex>
  );
}
