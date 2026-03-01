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
      <Table
        className={styles.Table}
        onSelected={emptyFn}
        data-tweaker-devtools
      >
        <Table.Head>
          <Table.Row className={styles.HeadRow}>
            <Table.HeadCell title="Name" style={{ width: "5%" }}>
              <Text size="1">Name</Text>
            </Table.HeadCell>
            <Table.HeadCell title="Key" style={{ width: "10%" }}>
              <Text size="1">Key</Text>
            </Table.HeadCell>
            <Table.HeadCell title="Original Value">
              <Text size="1">Original Value</Text>
            </Table.HeadCell>
            <Table.HeadCell title="Tweaked Value">
              <Text size="1">Tweaked Value</Text>
            </Table.HeadCell>
            <Table.HeadCell title="Timestamp" style={{ width: "8%" }}>
              <Text size="1">Timestamp</Text>
            </Table.HeadCell>
            <Table.HeadCell title="Actions" style={{ width: "12%" }}>
              <Text size="1">Actions</Text>
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
            <Table.Row className={styles.TableRow}>
              <Table.Cell colSpan={6}>
                <Text
                  size="1"
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

const styles = {
  HeadRow: css`
    th {
      white-space: nowrap;
      padding: 0 var(--space-1);
    }
  `,
  TableRow: css`
    td {
      height: 24px;
      min-height: 24px;
      padding: 0;
    }
  `,
  Table: css`
    &[data-tweaker-devtools] {
      --textColor: var(--gray-12);
      --stripeColor: var(--gray-4);
      --borderColor: var(--gray-a6);
      --headBackgroundColor: var(--gray-4);
      --rowHoverColor: var(--blue-5);
      --rowSelectedColor: var(--blue-7);
    }
  `,
};
