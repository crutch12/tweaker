import { css } from "@emotion/css";
import safeStringify from "fast-safe-stringify";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EXTENSION_OWNER, InterceptorPayload } from "@tweaker/extension-plugin";
import { getTextColor } from "../../utils/colors";
import equal from "fast-deep-equal";
import { Badge } from "../../components/Badge";
import { DeleteIcon, SelectIcon } from "@devtools-ds/icon";
import { ButtonIcon } from "../../components/ButtonIcon";
import {
  ExpressionCodeBlock,
  ExpressionCodeBlockContainer,
} from "./ExpressionCodeBlock";
import { isJsSyntaxValid } from "../../utils/isJsSyntaxValid";
import { useQuery } from "@tanstack/react-query";

export type ExtensionInterceptor = InterceptorPayload<unknown> & {
  // sampleIds?: string[];
  // fromKey?: string;
  // sampleId?: string;
};

export interface InterceptorItemProps {
  interceptor: ExtensionInterceptor;
  onChange?: (interceptor: ExtensionInterceptor) => void;
  onRemove?: (interceptor: ExtensionInterceptor) => void;
  onFilterMessages?: (patterns: string[]) => void;
}

export function InterceptorItem({
  interceptor,
  onChange,
  onRemove,
  onFilterMessages,
}: InterceptorItemProps) {
  const [expression, setExpression] = useState(() => interceptor.expression);

  const { data: expressionError } = useQuery({
    queryKey: ["validateExpression", expression],
    queryFn: () => {
      if (!expression) return { valid: true, error: undefined };
      return isJsSyntaxValid("() => {\n" + expression + "\n}");
    },
    select: ({ error }) => {
      if (error) {
        return `${error.name} - ${error.message}`;
      }
      return undefined;
    },
  });

  const [patterns, setPatterns] = useState(() =>
    interceptor.patterns.join(", "),
  );

  const readOnly = interceptor.owner !== EXTENSION_OWNER;

  useEffect(() => {
    setExpression(interceptor.expression);
  }, [interceptor.expression]);

  useEffect(() => {
    setPatterns(interceptor.patterns.join(", "));
  }, [interceptor.patterns]);

  const hasChanges = useMemo(() => {
    return !equal(
      {
        expression: interceptor.expression,
      },
      {
        expression,
      },
    );
  }, [expression, interceptor.expression]);

  const onCodeUpdate = useCallback((code: string) => {
    setExpression((v) => code || undefined);
  }, []);

  const [updatesCount, setUpdatesCount] = useState(0);

  const discardChanges = useCallback(() => {
    setExpression(interceptor.expression);
    setUpdatesCount((c) => c + 1);
  }, [interceptor]);

  const appColor = getTextColor(interceptor.name);

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
        opacity: ${interceptor.enabled ? undefined : 0.6};
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
          checked={interceptor.enabled}
          onChange={(ev) => {
            onChange?.({
              ...interceptor,
              enabled: ev.target.checked,
            });
          }}
        />
        <i>{interceptor.id}</i>
        <span
          style={{
            color: appColor,
            fontWeight: 700,
          }}
        >
          {interceptor.name}
        </span>
        <ButtonIcon
          title="Remove interceptor"
          disabled={readOnly}
          onClick={() => onRemove?.(interceptor)}
        >
          <DeleteIcon size="medium" />
        </ButtonIcon>
        {onFilterMessages && (
          <ButtonIcon
            title="Filter messages"
            onClick={() => onFilterMessages(interceptor.patterns)}
          >
            <SelectIcon size="medium" />
          </ButtonIcon>
        )}
      </div>
      <div>
        <label>Patterns </label>
        <input
          type="text"
          placeholder="Patterns"
          value={patterns}
          disabled={readOnly || !interceptor.enabled}
          onChange={(ev) => setPatterns(ev.target.value)}
          onBlur={() => {
            onChange?.({
              ...interceptor,
              patterns: patterns
                .split(/,\s*/)
                .map((x) => x.trim())
                .filter(Boolean),
            });
          }}
        />
      </div>
      {!readOnly && (
        <div>
          <div
            className={css`
              display: flex;
              gap: 10px;
            `}
          >
            <label>Expression</label>
            {!readOnly && hasChanges && (
              <button
                onClick={() => onChange?.({ ...interceptor, expression })}
              >
                Save changes
              </button>
            )}
            {!readOnly && hasChanges && (
              <button onClick={discardChanges}>Discard changes</button>
            )}
          </div>
          <ExpressionCodeBlockContainer
            codeBefore="(key: string, value: any) => {"
            codeAfter="}"
            language="ts"
          >
            <ExpressionCodeBlock
              key={updatesCount}
              code={interceptor.expression ?? ""}
              onUpdate={onCodeUpdate}
              readOnly={!interceptor.enabled}
            />
          </ExpressionCodeBlockContainer>
          {expressionError && (
            <div style={{ color: "red" }}>{expressionError}</div>
          )}
        </div>
      )}
      <Badge
        position="bottom-right"
        appearance={readOnly ? "secondary" : "primary"}
      >
        {interceptor.owner}
      </Badge>
      {hasChanges && (
        <Badge position="top-right" appearance="warn">
          *
        </Badge>
      )}
    </div>
  );
}

export interface InterceptorsListProps {
  interceptors: ExtensionInterceptor[];
  onInterceptorChange?: (interceptor: ExtensionInterceptor) => void;
  onInterceptorRemove?: (interceptor: ExtensionInterceptor) => void;
  onFilterMessages?: (patterns: string[]) => void;
  ref?: MutableRefObject<any>;
}

export function InterceptorsList({
  interceptors: interceptors,
  onInterceptorChange,
  onInterceptorRemove,
  onFilterMessages,
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
        <div key={interceptor.id}>
          <InterceptorItem
            interceptor={interceptor}
            onChange={onInterceptorChange}
            onRemove={onInterceptorRemove}
            onFilterMessages={onFilterMessages}
          />
        </div>
      ))}
    </div>
  );
}
