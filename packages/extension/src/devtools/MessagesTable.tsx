import { TweakerMessage } from "@tweaker/core";
import { Table } from "@devtools-ds/table";
import { ObjectInspector } from "@devtools-ds/object-inspector";
import { HTMLAttributes, MutableRefObject } from "react";
import safeStringify from "fast-safe-stringify";

export interface MessagesTableProps extends HTMLAttributes<HTMLElement> {
  messages: TweakerMessage["payload"][];
  ref?: MutableRefObject<any>;
}

export function MessagesTable({ messages, ref, ...props }: MessagesTableProps) {
  return (
    <div ref={ref} {...props}>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.HeadCell style={{ width: "5%" }}>Name</Table.HeadCell>
            <Table.HeadCell style={{ width: "10%" }}>Key</Table.HeadCell>
            <Table.HeadCell>Original Value</Table.HeadCell>
            <Table.HeadCell>Tweaked Value</Table.HeadCell>
            <Table.HeadCell style={{ width: "10%" }}>Timestamp</Table.HeadCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {messages.map((message) => (
            <Table.Row key={message.name + message.key + message.timestamp}>
              <Table.Cell title={message.name}>{message.name}</Table.Cell>
              <Table.Cell title={message.key}>{message.key}</Table.Cell>
              <Table.Cell title={safeStringify(message.originalValue, null, 2)}>
                <ObjectInspector
                  sortKeys={false}
                  expandLevel={0}
                  includePrototypes={false}
                  data={message.originalValue as any}
                />
              </Table.Cell>
              <Table.Cell title={safeStringify(message.result, null, 2)}>
                <ObjectInspector
                  sortKeys={false}
                  expandLevel={0}
                  includePrototypes={false}
                  data={message.result as any}
                />
              </Table.Cell>
              <Table.Cell title={String(message.timestamp)}>
                {message.timestamp}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
