import { css } from "@emotion/css";
import safeStringify from "fast-safe-stringify";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EXTENSION_OWNER, IntercepterPayload } from "@tweaker/extension-plugin";
import { getTextColor } from "../../utils/colors";
import equal from "fast-deep-equal";
import { Badge } from "../../components/Badge";
import { DeleteIcon } from "@devtools-ds/icon";
import { ButtonIcon } from "../../components/ButtonIcon";
import {
  ExpressionCodeBlock,
  ExpressionCodeBlockContainer,
} from "./ExpressionCodeBlock";

export type ExtensionIntercepter = IntercepterPayload<unknown> & {
  // sampleIds?: string[];
  // fromKey?: string;
  // sampleId?: string;
};

export interface InterceptersListProps {
  intercepters: ExtensionIntercepter[];
  onIntercepterChange?: (intercepter: ExtensionIntercepter) => void;
  onIntercepterRemove?: (intercepter: ExtensionIntercepter) => void;
  ref?: MutableRefObject<any>;
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

  const hasChanges = useMemo(() => {
    return !equal(intercepter, editableIntercepter);
  }, [intercepter, editableIntercepter]);

  const onCodeUpdate = useCallback((code: string) => {
    setEditableIntercepter((v) => ({
      ...v,
      expression: code || undefined,
    }));
  }, []);

  const [updatesCount, setUpdatesCount] = useState(0);

  const discardChanges = useCallback(() => {
    setEditableIntercepter(intercepter);
    setUpdatesCount((c) => c + 1);
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
        font-size: 16px;
        position: relative;
        opacity: ${intercepter.enabled ? undefined : 0.6};
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 4px;
        `}
      >
        <input
          type="checkbox"
          disabled={readOnly}
          checked={editableIntercepter.enabled}
          onChange={(ev) => {
            setEditableIntercepter((v) => ({
              ...v,
              enabled: ev.target.checked,
            }));
            onChange?.({
              ...editableIntercepter,
              enabled: ev.target.checked,
            });
          }}
        />
        <i>{editableIntercepter.id}</i>
        <span
          style={{
            color: getTextColor(editableIntercepter.name),
            fontWeight: 700,
          }}
        >
          {editableIntercepter.name}
        </span>
        <ButtonIcon
          title="Remove intercepter"
          disabled={readOnly}
          onClick={() => onRemove?.(intercepter)}
        >
          <DeleteIcon size="medium" />
        </ButtonIcon>
      </div>
      <div>
        <label>Patterns </label>
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
          <label>Expression </label>
          <ExpressionCodeBlockContainer
            codeBefore="function (key, value) {"
            codeAfter="}"
          >
            <ExpressionCodeBlock
              key={updatesCount}
              code={intercepter.expression ?? ""}
              onUpdate={onCodeUpdate}
            />
          </ExpressionCodeBlockContainer>
        </div>
      )}
      {!readOnly && (
        <div>
          {hasChanges && (
            <button onClick={() => onChange?.(editableIntercepter)}>
              Save changes
            </button>
          )}
          {hasChanges && (
            <button onClick={discardChanges}>Discard changes</button>
          )}
        </div>
      )}
      <Badge
        position="bottom-right"
        appearance={readOnly ? "secondary" : "primary"}
      >
        {intercepter.owner}
      </Badge>
    </div>
  );
}

export function InterceptersList({
  intercepters: intercepters,
  onIntercepterChange,
  onIntercepterRemove,
  ref,
}: InterceptersListProps) {
  return (
    <div
      ref={ref}
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
