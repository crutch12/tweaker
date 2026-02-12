import { css } from "@emotion/css";
import safeStringify from "fast-safe-stringify";
import { useEffect, useState } from "react";

export interface Intercepter {
  id: number;
  appName: string;
  patterns: string[];
  sampleIds?: string[];
  fromKey?: string;
  sampleId?: string;
  enabled: boolean;
  interactive: boolean;
  expression?: string;
  source: string;
}

export interface InterceptersListProps {
  intercepters: Intercepter[];
  onIntercepterChange?: (intercepter: Intercepter) => void;
  onIntercepterRemove?: (intercepter: Intercepter) => void;
}

export interface IntercepterItemProps {
  intercepter: Intercepter;
  onChange?: (intercepter: Intercepter) => void;
  onRemove?: (intercepter: Intercepter) => void;
}

export function IntercepterItem({
  intercepter,
  onChange,
  onRemove,
}: IntercepterItemProps) {
  const [editableIntercepter, setEditableIntercepter] = useState(
    () => intercepter,
  );

  const readOnly = intercepter.source !== "@tweaker/extension";

  useEffect(() => {
    setEditableIntercepter(intercepter);
  }, [intercepter]);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1px solid green;
        border-radius: 5px;
        padding: 10px;
      `}
    >
      <div>
        id: {editableIntercepter.id} - name: {editableIntercepter.appName} -{" "}
        {`${intercepter.source}`}
        {/* {safeStringify(editableIntercepter.patterns, undefined, 2)} */}
      </div>
      <div>
        <label>Pattern</label>
        <input
          type="text"
          placeholder="Pattern"
          value={editableIntercepter.patterns[0]}
          disabled={readOnly}
          onChange={(ev) =>
            setEditableIntercepter((v) => ({
              ...v,
              patterns: [ev.target.value],
            }))
          }
        />
      </div>
      {!readOnly && (
        <div>
          <input type="text" placeholder="Expression to tweak value" />
        </div>
      )}
      {!readOnly && (
        <div>
          <button onClick={() => onChange?.(editableIntercepter)}>Save</button>
          <button onClick={() => setEditableIntercepter(intercepter)}>
            Discard
          </button>
          <button disabled={readOnly} onClick={() => onRemove?.(intercepter)}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export function InterceptersList({
  intercepters: intercepters,
  onIntercepterChange,
  onIntercepterRemove,
}: InterceptersListProps) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 10px;
      `}
    >
      {intercepters.map((intercepter) => (
        <div key={intercepter.id}>
          <IntercepterItem
            intercepter={intercepter}
            onChange={onIntercepterChange}
            onRemove={onIntercepterRemove}
          />
        </div>
      ))}
    </div>
  );
}
