import { css } from "@emotion/css";
import { MutableRefObject } from "react";
import { ExtensionInterceptor, InterceptorItem } from "./InterceptorItem";

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
    <div
      ref={ref}
      className={css`
        display: flex;
        flex-direction: column;
        gap: 10px;
      `}
    >
      {interceptors.map((interceptor) => (
        <div key={interceptor.name + interceptor.id}>
          <InterceptorItem
            interceptor={interceptor}
            onChange={onInterceptorChange}
            onRemove={onInterceptorRemove}
            onFilterMessages={onFilterMessages}
            onDuplicate={onDuplicate}
          />
        </div>
      ))}
    </div>
  );
}
