import { Table } from "@devtools-ds/table";
import { HTMLAttributes, memo, RefObject } from "react";
import { ExtensionPluginMessages } from "@tweaker/extension-plugin";
import { MessageRow } from "./MessageRow";
import { Box, Text } from "@radix-ui/themes";
import { css } from "@emotion/css";
import type { InterceptorId } from "@tweaker/core";

const emptyFn = () => {};

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
            <Table.HeadCell style={{ width: "5%" }}>
              <Text size="2">Name</Text>
            </Table.HeadCell>
            <Table.HeadCell style={{ width: "10%" }}>
              <Text size="2">Key</Text>
            </Table.HeadCell>
            <Table.HeadCell>Original Value</Table.HeadCell>
            <Table.HeadCell>Tweaked Value</Table.HeadCell>
            <Table.HeadCell style={{ width: "8%" }}>
              <Text size="2">Timestamp</Text>
            </Table.HeadCell>
            <Table.HeadCell style={{ width: "12%" }}>
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
