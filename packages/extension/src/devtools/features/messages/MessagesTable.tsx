import { Table } from "@devtools-ds/table";
import { HTMLAttributes, MutableRefObject } from "react";
import { PluginMessages } from "@tweaker/extension-plugin";
import { MessageRow } from "./MessageRow";
import { css } from "@emotion/css";
import { Box } from "@radix-ui/themes";

export interface MessagesTableProps extends HTMLAttributes<HTMLElement> {
  messages: PluginMessages.ValueMessage["payload"][];
  ref?: MutableRefObject<any>;
  onTweak?: (payload: PluginMessages.ValueMessage["payload"]) => void;
}

export function MessagesTable({
  messages,
  ref,
  onTweak,
  ...props
}: MessagesTableProps) {
  return (
    <Box ref={ref} {...props}>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.HeadCell style={{ width: "5%" }}>Name</Table.HeadCell>
            <Table.HeadCell style={{ width: "10%" }}>Key</Table.HeadCell>
            <Table.HeadCell>Original Value</Table.HeadCell>
            <Table.HeadCell>Tweaked Value</Table.HeadCell>
            <Table.HeadCell style={{ width: "10%" }}>Timestamp</Table.HeadCell>
            <Table.HeadCell style={{ width: "15%" }}>Actions</Table.HeadCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {messages.map((message) => (
            <MessageRow
              key={message.name + message.key + message.timestamp}
              message={message}
              onTweak={onTweak}
            />
          ))}
        </Table.Body>
      </Table>
    </Box>
  );
}
