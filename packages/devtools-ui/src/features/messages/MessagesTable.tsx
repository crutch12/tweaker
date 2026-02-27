import { Table } from "@devtools-ds/table";
import { HTMLAttributes, memo, RefObject } from "react";
import { ExtensionPluginMessages } from "@tweaker/extension-plugin";
import { MessageRow } from "./MessageRow";
import { Box, Text } from "@radix-ui/themes";
import { css } from "@emotion/css";
import type { InterceptorId } from "@tweaker/core";

const emptyFn = () => {};

const NoWrapClassName = css`
  white-space: nowrap;
`;

export interface MessagesTableProps extends HTMLAttributes<HTMLElement> {
  messages: ExtensionPluginMessages.ValueMessage["payload"][];
  ref?: RefObject<any>;
  onTweak?: (payload: ExtensionPluginMessages.ValueMessage["payload"]) => void;
  onGoToInterceptorClick?: (interceptorId: InterceptorId) => void;
}

function _MessagesTable({
  messages,
  ref,
  onTweak,
  onGoToInterceptorClick,
  ...props
}: MessagesTableProps) {
  return (
    <Box ref={ref} {...props}>
      <Table onSelected={emptyFn}>
        <Table.Head>
          <Table.Row>
            <Table.HeadCell
              title="Name"
              style={{ width: "5%" }}
              className={NoWrapClassName}
            >
              <Text size="2">Name</Text>
            </Table.HeadCell>
            <Table.HeadCell
              title="Key"
              style={{ width: "10%" }}
              className={NoWrapClassName}
            >
              <Text size="2">Key</Text>
            </Table.HeadCell>
            <Table.HeadCell title="Original Value" className={NoWrapClassName}>
              Original Value
            </Table.HeadCell>
            <Table.HeadCell title="Tweaked Value" className={NoWrapClassName}>
              Tweaked Value
            </Table.HeadCell>
            <Table.HeadCell
              title="Timestamp"
              style={{ width: "8%" }}
              className={NoWrapClassName}
            >
              <Text size="2">Timestamp</Text>
            </Table.HeadCell>
            <Table.HeadCell
              title="Actions"
              style={{ width: "12%" }}
              className={NoWrapClassName}
            >
              <Text size="2">Actions</Text>
            </Table.HeadCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {messages.length > 0 ? (
            messages.map((message) => (
              <MessageRow
                key={
                  message.name + message.key + message.timestamp + message.id
                }
                message={message}
                onTweak={onTweak}
                onGoToInterceptorClick={onGoToInterceptorClick}
              />
            ))
          ) : (
            <Table.Row
              className={css`
                height: 36px;
                min-height: 36px;
              `}
            >
              <Table.Cell colSpan={6}>
                <Text
                  size="2"
                  align="center"
                  className={css`
                    display: block;
                  `}
                >
                  No messages found
                </Text>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Box>
  );
}

export const MessagesTable = memo(_MessagesTable);
