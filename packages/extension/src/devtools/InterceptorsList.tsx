import { css } from "@emotion/css";
import safeStringify from "fast-safe-stringify";
import { useEffect, useState } from "react";

export interface Interceptor {
  id: number;
  appName: string;
  patterns: string[];
  sampleIds?: string[];
  fromKey?: string;
  sampleId?: string;
  enabled: boolean;
  interactive: boolean;
  expression?: string;
}

export interface InterceptorsListProps {
  interceptors: Interceptor[];
  onInterceptorChange?: (interceptor: Interceptor) => void;
  onInterceptorRemove?: (interceptor: Interceptor) => void;
}

export interface InterceptorItemProps {
  interceptor: Interceptor;
  onChange: (interceptor: Interceptor) => void;
  onRemove: (interceptor: Interceptor) => void;
}

export function InterceptorItem({
  interceptor,
  onChange,
  onRemove,
}: InterceptorItemProps) {
  const [editableInterceptor, setEditableInterceptor] = useState(
    () => interceptor,
  );

  useEffect(() => {
    setEditableInterceptor(interceptor);
  }, [interceptor]);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 5px;
      `}
    >
      <div>
        {editableInterceptor.id} - {editableInterceptor.appName} -{" "}
        {safeStringify(editableInterceptor.patterns, null, 2)}
      </div>
      <div>
        <input
          type="text"
          placeholder="Pattern"
          value={editableInterceptor.patterns}
        />
      </div>
      <div>
        <input type="text" placeholder="Expression to tweak value" />
      </div>
      <div>
        <button onClick={() => onChange(editableInterceptor)}>Save</button>
        <button onClick={() => setEditableInterceptor(interceptor)}>
          Discard
        </button>
        <button onClick={() => onRemove(interceptor)}>Remove</button>
      </div>
    </div>
  );
}

export function InterceptorsList({
  interceptors,
  onInterceptorChange,
  onInterceptorRemove,
}: InterceptorsListProps) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      {interceptors.map((interceptor) => (
        <div key={interceptor.id}>
          <InterceptorItem
            interceptor={interceptor}
            onChange={onInterceptorChange}
            onRemove={onInterceptorRemove}
          />
        </div>
      ))}
    </div>
  );
}
