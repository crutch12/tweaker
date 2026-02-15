import { Table } from "@devtools-ds/table";
import { ObjectInspector } from "@devtools-ds/object-inspector";
import { HTMLAttributes, MutableRefObject } from "react";
import safeStringify from "fast-safe-stringify";
import { css, keyframes } from "@emotion/css";
import { PluginMessages } from "@tweaker/extension-plugin";
import { getTextColor } from "../../utils/colors";
import { BlueButton } from "../../components/BlueButton";

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
    <div ref={ref} {...props}>
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
              <Table.Cell
                title={safeStringify(message.originalValue, undefined, 2)}
              >
                <ObjectInspector
                  sortKeys={false}
                  expandLevel={0}
                  includePrototypes={false}
                  data={message.originalValue as any}
                />
              </Table.Cell>
              {message.tweaked ? (
                <Table.Cell title={safeStringify(message.result, undefined, 2)}>
                  <ObjectInspector
                    sortKeys={false}
                    expandLevel={0}
                    includePrototypes={false}
                    data={message.result as any}
                  />
                </Table.Cell>
              ) : (
                <Table.Cell>
                  <span style={{ opacity: 0.5, cursor: "default" }}>empty</span>
                </Table.Cell>
              )}

              <Table.Cell title={new Date(message.timestamp).toLocaleString()}>
                {message.timestamp}
              </Table.Cell>
              <Table.Cell>
                <div
                  className={css`
                    display: flex;
                    gap: "10px";
                  `}
                >
                  <BlueButton
                    disabled={message.tweaked}
                    onClick={() => onTweak?.(message)}
                  >
                    Tweak
                  </BlueButton>
                </div>
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
