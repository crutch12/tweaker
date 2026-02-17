import { Table } from "@devtools-ds/table";
import { ObjectInspector } from "@devtools-ds/object-inspector";
import safeStringify from "fast-safe-stringify";
import { css, keyframes } from "@emotion/css";
import { PluginMessages } from "@tweaker/extension-plugin";
import { getTextColor } from "../../utils/colors";
import { BlueButton } from "../../components/BlueButton";
import { deserializeError, isErrorLike } from "serialize-error";
import { useEffectEvent, useMemo, useRef } from "react";
import { CSSTransition } from "react-transition-group";

export interface MessageRowProps {
  message: PluginMessages.ValueMessage["payload"];
  onTweak?: (payload: PluginMessages.ValueMessage["payload"]) => void;
  onGoToInterceptorClick?: (interceptorId: string | number) => void;
}

export function MessageRow({
  message,
  onTweak,
  onGoToInterceptorClick,
}: MessageRowProps) {
  const stringifiedValue = useMemo(() => {
    return safeStringify(message.originalValue, undefined, 2);
  }, [message.originalValue]);

  const stringifiedResult = useMemo(() => {
    return safeStringify(message.result, undefined, 2);
  }, [message.result]);

  const appColor = useMemo(() => getTextColor(message.name), [message.name]);

  const onTweakClick = useEffectEvent(() => {
    onTweak?.(message);
  });

  const onGoToClick = useEffectEvent(() => {
    if (message.interceptorId) {
      onGoToInterceptorClick?.(message.interceptorId);
    }
  });

  const timestampTitle = useMemo(
    () => new Date(message.timestamp).toLocaleString(),
    [message.timestamp],
  );

  const originalValueData = useMemo(() => {
    return isErrorLike(message.originalValue)
      ? deserializeError(message.originalValue)
      : (message.originalValue as any);
  }, [message.originalValue]);

  const resultData = useMemo(() => {
    return isErrorLike(message.result)
      ? deserializeError(message.result)
      : (message.result as any);
  }, [message.result]);

  const nodeRef = useRef(null);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in
      appear
      timeout={1000}
      classNames="bounce"
    >
      <Table.Row
        data-row-id={`${message.name}:${message.key}`}
        ref={nodeRef}
        className={css`
          &.bounce-appear-active {
            animation: ${bounceIn} 1s ease;
          }
        `}
      >
        <Table.Cell style={{ color: appColor }} title={message.name}>
          <strong>{message.name}</strong>
        </Table.Cell>
        <Table.Cell title={message.key}>{message.key}</Table.Cell>
        <Table.Cell title={stringifiedValue}>
          <ObjectInspector
            sortKeys={false}
            expandLevel={0}
            includePrototypes={true}
            data={originalValueData}
          />
        </Table.Cell>
        {message.tweaked ? (
          <Table.Cell
            title={stringifiedResult}
            style={{ display: "flex", gap: "4px" }}
          >
            {message.error && (
              <span style={{ opacity: 0.5, cursor: "default" }}>error</span>
            )}
            <ObjectInspector
              sortKeys={false}
              expandLevel={0}
              includePrototypes={false}
              data={resultData}
            />
          </Table.Cell>
        ) : (
          <Table.Cell>
            <span style={{ opacity: 0.5, cursor: "default" }}>empty</span>
          </Table.Cell>
        )}
        <Table.Cell title={timestampTitle}>{message.timestamp}</Table.Cell>
        <Table.Cell>
          <div
            className={css`
              display: flex;
              gap: 8px;
            `}
          >
            <BlueButton
              title={`Create interceptor for ${message.key} (${message.name})`}
              onClick={onTweakClick}
            >
              Tweak
            </BlueButton>
            {message.interceptorId && (
              <BlueButton
                title={`Go to ${message.interceptorId}`}
                onClick={onGoToClick}
              >
                Reveal
              </BlueButton>
            )}
          </div>
        </Table.Cell>
      </Table.Row>
    </CSSTransition>
  );
}

const bounceIn = keyframes`
  from { background-color: rgba(255, 204, 102, 1); }
  to { background-color: rgba(255, 204, 102, 0); }
`;
