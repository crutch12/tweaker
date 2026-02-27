import { Table } from "@devtools-ds/table";
import { ObjectInspector } from "@devtools-ds/object-inspector";
import safeStringify from "fast-safe-stringify";
import { css, keyframes } from "@emotion/css";
import { ExtensionPluginMessages } from "@tweaker/extension-plugin";
import { getTextColor } from "../../utils/colors";
import { deserializeError, isErrorLike } from "serialize-error";
import { useEffectEvent, useMemo, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { SourceCodePopover } from "../../components/SourceCodePopover";
import { ButtonIcon } from "../../components/ButtonIcon";
import { SelectIcon, ExportIcon } from "@devtools-ds/icon";
import { Flex, Text, Box } from "@radix-ui/themes";
import { MessageTweakedInfoPopover } from "./MessageTweakedInfoPopover";
import type { InterceptorId } from "@tweaker/core";

export interface MessageRowProps {
  message: ExtensionPluginMessages.ValueMessage["payload"];
  onTweak?: (payload: ExtensionPluginMessages.ValueMessage["payload"]) => void;
  onGoToInterceptorClick?: (interceptorId: InterceptorId) => void;
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

  const inAnimate = useMemo(() => {
    return Date.now() - message.timestamp < 500;
  }, [message.timestamp]);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={inAnimate}
      appear
      timeout={1000}
      classNames="bounce"
    >
      <Table.Row
        data-row-id={`${message.name}:${message.key}`}
        data-row-name={message.name}
        data-row-key={message.key}
        data-row-interceptor-id={message.interceptorId}
        ref={nodeRef}
        className={css`
          &.bounce-appear-active {
            animation: ${bounceIn} 1s ease;
          }
        `}
      >
        <Table.Cell
          className={css`
            color: ${appColor};
          `}
          title={message.name}
        >
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
            includePrototypes={false}
            data={originalValueData}
          />
        </Table.Cell>
        {message.tweaked ? (
          <Table.Cell>
            <Flex align="center" gap="1" justify="between">
              {message.error && (
                <Text
                  color="gray"
                  size="2"
                  className={css`
                    cursor: default;
                  `}
                >
                  error
                </Text>
              )}
              <Box title={stringifiedResult} overflow="hidden">
                <ObjectInspector
                  sortKeys={false}
                  expandLevel={0}
                  includePrototypes={false}
                  data={resultData}
                />
              </Box>
              {message.interceptorId && (
                <MessageTweakedInfoPopover message={message} />
              )}
            </Flex>
          </Table.Cell>
        ) : (
          <Table.Cell>
            <Text
              size="2"
              color="gray"
              className={css`
                cursor: default;
              `}
            >
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
