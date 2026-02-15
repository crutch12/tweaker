import { css } from "@emotion/css";
import safeStringify from "fast-safe-stringify";
import { useEffect, useState } from "react";
import { EXTENSION_OWNER, IntercepterPayload } from "@tweaker/extension-plugin";

export type ExtensionIntercepter = IntercepterPayload<unknown> & {
  // sampleIds?: string[];
  // fromKey?: string;
  // sampleId?: string;
};

export interface InterceptersListProps {
  intercepters: ExtensionIntercepter[];
  onIntercepterChange?: (intercepter: ExtensionIntercepter) => void;
  onIntercepterRemove?: (intercepter: ExtensionIntercepter) => void;
}

export interface IntercepterItemProps {
  intercepter: ExtensionIntercepter;
  onChange?: (intercepter: ExtensionIntercepter) => void;
  onRemove?: (intercepter: ExtensionIntercepter) => void;
}

export function IntercepterItem({
  intercepter,
  onChange,
  onRemove,
}: IntercepterItemProps) {
  const [editableIntercepter, setEditableIntercepter] = useState(
    () => intercepter,
  );

  const readOnly = intercepter.owner !== EXTENSION_OWNER;

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
        id: {editableIntercepter.id} - name: {editableIntercepter.name} -{" "}
        {`${intercepter.owner}`}
        {/* {safeStringify(editableIntercepter.patterns, undefined, 2)} */}
      </div>
      <div>
        <label>Patterns</label>
        <input
          type="text"
          placeholder="Patterns"
          value={
            readOnly
              ? editableIntercepter.patterns.join(", ")
              : editableIntercepter.patterns[0]
          }
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
          <input
            type="text"
            placeholder="Expression to tweak value"
            value={editableIntercepter.expression}
            onChange={(ev) =>
              setEditableIntercepter((v) => ({
                ...v,
                expression: ev.target.value,
              }))
            }
          />
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
