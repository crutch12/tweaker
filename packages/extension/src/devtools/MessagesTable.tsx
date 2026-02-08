import { Table } from "@devtools-ds/table";
import { ObjectInspector } from "@devtools-ds/object-inspector";
import { HTMLAttributes, MutableRefObject } from "react";
import safeStringify from "fast-safe-stringify";
import { css, keyframes } from "@emotion/css";
import { PluginMessages } from "@tweaker/extension-plugin";

export interface MessagesTableProps extends HTMLAttributes<HTMLElement> {
  messages: PluginMessages.ValueMessage["payload"][];
  ref?: MutableRefObject<any>;
  onTweak?: (payload: PluginMessages.ValueMessage["payload"]) => void;
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
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FF8000",
    "#8000FF",
    "#00FF80",
    "#FF0080",
    "#80FF00",
    "#0080FF",
    "#FFD700",
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F0E68C",
    "#E6E6FA",
    "#008080",
    "#FF1493",
  ];
  return colors[textToIndex(text, colors.length)];
}

interface BlueButtonProps extends HTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

function BlueButton({ onClick, children, disabled, ...rest }: BlueButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={onClick}
      className={css`
        background-color: rgb(26, 115, 232);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 5px 12px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 500;

        :disabled {
          opacity: 0.5;
          cursor: default;
        }
      `}
    >
      {children}
    </button>
  );
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

              <Table.Cell title={String(message.timestamp)}>
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
