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
import { DeleteIcon, SelectIcon } from "@devtools-ds/icon";
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

export interface IntercepterItemProps {
  intercepter: ExtensionIntercepter;
  onChange?: (intercepter: ExtensionIntercepter) => void;
  onRemove?: (intercepter: ExtensionIntercepter) => void;
  onFilterMessages?: (patterns: string[]) => void;
}

export function IntercepterItem({
  intercepter,
  onChange,
  onRemove,
  onFilterMessages,
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

  const appColor = getTextColor(intercepter.name);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1.5px solid ${appColor};
        border-radius: 10px;
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
        <i>{intercepter.id}</i>
        <span
          style={{
            color: appColor,
            fontWeight: 700,
          }}
        >
          {intercepter.name}
        </span>
        <ButtonIcon
          title="Remove intercepter"
          disabled={readOnly}
          onClick={() => onRemove?.(intercepter)}
        >
          <DeleteIcon size="medium" />
        </ButtonIcon>
        {onFilterMessages && (
          <ButtonIcon
            title="Filter messages"
            onClick={() => onFilterMessages(editableIntercepter.patterns)}
          >
            <SelectIcon size="medium" />
          </ButtonIcon>
        )}

        {!readOnly && hasChanges && (
          <button onClick={() => onChange?.(editableIntercepter)}>
            Save changes
          </button>
        )}
        {!readOnly && hasChanges && (
          <button onClick={discardChanges}>Discard changes</button>
        )}
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
          disabled={readOnly || !intercepter.enabled}
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
              readOnly={!intercepter.enabled}
            />
          </ExpressionCodeBlockContainer>
        </div>
      )}
      <Badge
        position="bottom-right"
        appearance={readOnly ? "secondary" : "primary"}
      >
        {intercepter.owner}
      </Badge>
      {hasChanges && (
        <Badge position="top-right" appearance="warn">
          *
        </Badge>
      )}
    </div>
  );
}

export interface InterceptersListProps {
  intercepters: ExtensionIntercepter[];
  onIntercepterChange?: (intercepter: ExtensionIntercepter) => void;
  onIntercepterRemove?: (intercepter: ExtensionIntercepter) => void;
  onFilterMessages?: (patterns: string[]) => void;
  ref?: MutableRefObject<any>;
}

export function InterceptersList({
  intercepters: intercepters,
  onIntercepterChange,
  onIntercepterRemove,
  onFilterMessages,
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
            onFilterMessages={onFilterMessages}
          />
        </div>
      ))}
    </div>
  );
}
