import { useStickToBottom } from "use-stick-to-bottom";
import { MessagesTable, MessagesTableProps } from "./MessagesTable";

export function MessagesTableContainer(props: MessagesTableProps) {
  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

  if (props.messages.length === 0) {
    return (
      <div
        style={{
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "4px",
        }}
      >
        <span>Call</span>
        <span style={{ color: "red" }}>tweaker.value()</span>
        <span>from in-page code to see logs...</span>
      </div>
    );
  }

  return (
    <div ref={scrollRef}>
      <MessagesTable ref={contentRef} {...props} />
    </div>
  );
}
