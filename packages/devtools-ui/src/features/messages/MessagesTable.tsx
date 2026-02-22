import { Table } from "@devtools-ds/table";
import { HTMLAttributes, memo, MutableRefObject } from "react";
import { PluginMessages } from "@tweaker/extension-plugin";
import { MessageRow } from "./MessageRow";
import { Box, Text } from "@radix-ui/themes";
import { css } from "@emotion/css";
import type { InterceptorId } from "@tweaker/core";

const emptyFn = () => {};

export interface MessagesTableProps extends HTMLAttributes<HTMLElement> {
  messages: PluginMessages.ValueMessage["payload"][];
  ref?: MutableRefObject<any>;
  onTweak?: (payload: PluginMessages.ValueMessage["payload"]) => void;
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
      <Table
        className={css`
          min-height: 72px;
        `}
        onSelected={emptyFn}
      >
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
          {messages.map((message) => (
            <MessageRow
              key={message.name + message.key + message.timestamp}
              message={message}
              onTweak={onTweak}
              onGoToInterceptorClick={onGoToInterceptorClick}
            />
          ))}
        </Table.Body>
      </Table>
    </Box>
  );
}

export const MessagesTable = memo(_MessagesTable);
