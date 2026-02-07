import { TweakerMessage } from "@tweaker/core";
import { Table } from "@devtools-ds/table";
import { ObjectInspector } from "@devtools-ds/object-inspector";
import { HTMLAttributes, MutableRefObject } from "react";
import safeStringify from "fast-safe-stringify";
import { css, keyframes } from "@emotion/css";

export interface MessagesTableProps extends HTMLAttributes<HTMLElement> {
  messages: TweakerMessage["payload"][];
  ref?: MutableRefObject<any>;
}

function textToIndex(text: string, length: number) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) + hash + text.charCodeAt(i);
  }
  return Math.abs(hash) % length;
}

function getTextColor(text: string) {
  const colors = [
    "#E6194B",
    "#3CB44B",
    "#FFE119",
    "#4363D8",
    "#F58231",
    "#911EB4",
    "#42D4F4",
    "#F032E6",
    "#BFEF45",
    "#FABEBE",
    "#469990",
    "#9A6324",
    "#FFFAC8",
    "#800000",
    "#AAFFC3",
    "#FFD8B1",
    "#000075",
  ];
  return colors[textToIndex(text, colors.length)];
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
            <Table.Row
              className={css`
                animation: ${bounce} 1.5s ease;
              `}
              key={message.name + message.key + message.timestamp}
            >
              <Table.Cell
                style={{ color: getTextColor(message.name) }}
                title={message.name}
              >
                <strong>{message.name}</strong>
              </Table.Cell>
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

const bounce = keyframes`
  from { background-color: rgba(255, 204, 102, 1); }
  to { background-color: rgba(255, 204, 102, 0); }
`;
