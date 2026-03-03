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
import cn from "classnames";

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
        className={styles.TableRow}
      >
        <Table.Cell
          className={cn(css`
            color: ${appColor};
          `)}
          title={message.name}
        >
          <Text size="1" weight="bold">
            {message.name}
          </Text>
        </Table.Cell>
        <Table.Cell title={message.key}>
          <Text size="1">{message.key}</Text>
        </Table.Cell>
        <Table.Cell title={stringifiedValue}>
          <ObjectInspector
            className={styles.ObjectInspector}
            sortKeys={false}
            expandLevel={0}
            includePrototypes={false}
            data={originalValueData}
            data-tweaker-devtools
          />
        </Table.Cell>
        {message.tweaked ? (
          <Table.Cell>
            <Flex align="center" gap="1" justify="between">
              {message.error && (
                <Text
                  color="gray"
                  size="1"
                  className={css`
                    cursor: default;
                  `}
                >
                  error
                </Text>
              )}
              <Box title={stringifiedResult} overflow="hidden" flexGrow="1">
                <ObjectInspector
                  className={styles.ObjectInspector}
                  sortKeys={false}
                  expandLevel={0}
                  includePrototypes={false}
                  data={resultData}
                  data-tweaker-devtools
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
              size="1"
              color="gray"
              className={cn(css`
                cursor: default;
              `)}
            >
              empty
            </Text>
          </Table.Cell>
        )}
        <Table.Cell title={timestampTitle}>
          <Text size="1">{message.timestamp}</Text>
        </Table.Cell>
        <Table.Cell>
          <Flex gap="2" align="center">
            <ButtonIcon
              title={`Create interceptor for ${message.key} (${message.name})`}
              onClick={onTweakClick}
            >
              <ExportIcon size="small" />
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
                <SelectIcon size="small" />
              </ButtonIcon>
            )}
          </Flex>
        </Table.Cell>
      </Table.Row>
    </CSSTransition>
  );
}

const bounceIn = keyframes`
  from { background-color: var(--orange-4); }
  to { background-color: var(--background-color); }
`;

const styles = {
  TableRow: css`
    --background-color: var(--color-panel-solid);

    &:nth-child(even) {
      --background-color: var(--stripeColor);
    }

    &.bounce-appear-active {
      animation: ${bounceIn} 1s ease;
    }

    td {
      padding: 0 var(--space-1);
    }
  `,
  ObjectInspector: css`
    font-size: var(--font-size-1);

    &[data-tweaker-devtools] {
      * {
        --labelColor: var(--sand-11);
        --textColor: var(--gray-10);
        --keyColor: var(--plum-11);
        --valueColor: var(--gray-10);
        --stringColor: var(--red-10);
        --regexColor: var(--red-10);
        --errorColor: var(--red-11);
        --booleanColor: var(--blue-10);
        --numberColor: var(--indigo-10);
        --undefinedColor: var(--olive-11);
        --nullColor: var(--olive-11);
        --prototypeColor: var(--cimson-9);
        --functionColor: var(--blue-12);
        --functionDecoratorColor: var(--blue-10);

        --focusColor: var(--blue-a4);
        --hoverColor: var(--gray-a4);
        --arrowColor: var(--gray-9);
      }
    }
  `,
};
