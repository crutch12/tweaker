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
import { SourceCodePopover } from "../../components/SourceCodePopover";
import { ButtonIcon } from "../../components/ButtonIcon";
import { SelectIcon, ExportIcon } from "@devtools-ds/icon";
import { Flex, Text } from "@radix-ui/themes";

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
          <Text size="2" weight="bold">
            {message.name}
          </Text>
        </Table.Cell>
        <Table.Cell title={message.key}>
          <Text size="2">{message.key}</Text>
        </Table.Cell>
        <Table.Cell title={stringifiedValue}>
          <ObjectInspector
            sortKeys={false}
            expandLevel={0}
            includePrototypes={true}
            data={originalValueData}
          />
        </Table.Cell>
        {message.tweaked ? (
          <Table.Cell title={stringifiedResult}>
            <Flex align="center" gap="1">
              {message.error && (
                <Text size="2" style={{ opacity: 0.5, cursor: "default" }}>
                  error
                </Text>
              )}
              <ObjectInspector
                sortKeys={false}
                expandLevel={0}
                includePrototypes={false}
                data={resultData}
              />
            </Flex>
          </Table.Cell>
        ) : (
          <Table.Cell>
            <Text size="2" style={{ opacity: 0.5, cursor: "default" }}>
              empty
            </Text>
          </Table.Cell>
        )}
        <Table.Cell title={timestampTitle}>{message.timestamp}</Table.Cell>
        <Table.Cell>
          <Flex gap="2" align="center">
            <ButtonIcon
              title={`Create interceptor for ${message.key} (${message.name})`}
              onClick={onTweakClick}
            >
              <ExportIcon size="medium" />
            </ButtonIcon>
            {message.stack && (
              <SourceCodePopover
                stack={message.stack}
                stackLabel="tweaker.value()"
                title="Show tweaker.value() call stack"
              />
            )}
            {message.interceptorId && (
              <ButtonIcon
                title={`Go to ${message.interceptorId}`}
                onClick={onGoToClick}
              >
                <SelectIcon size="medium" />
              </ButtonIcon>
            )}
          </Flex>
        </Table.Cell>
      </Table.Row>
    </CSSTransition>
  );
}

const bounceIn = keyframes`
  from { background-color: rgba(255, 204, 102, 1); }
  to { background-color: rgba(255, 204, 102, 0); }
`;
