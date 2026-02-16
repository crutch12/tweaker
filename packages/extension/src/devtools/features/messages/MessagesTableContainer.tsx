import { useStickToBottom } from "use-stick-to-bottom";
import { MessagesTable, MessagesTableProps } from "./MessagesTable";
import { parsePatterns } from "../../utils/pattern";
import { memo, useMemo } from "react";
import { keyMatchesPatterns } from "@tweaker/core/utils";

export interface MessagesTableContainerProps extends MessagesTableProps {
  filterPatterns?: string;
}

function _MessagesTableContainer({
  filterPatterns,
  messages,
  ...props
}: MessagesTableContainerProps) {
  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

  const filteredMessages = useMemo(() => {
    if (filterPatterns) {
      return messages.filter((msg) =>
        keyMatchesPatterns(msg.key, parsePatterns(filterPatterns)),
      );
    }
    return messages;
  }, [filterPatterns, messages]);

  if (messages.length === 0) {
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
      <MessagesTable ref={contentRef} {...props} messages={filteredMessages} />
    </div>
  );
}

export const MessagesTableContainer = memo(_MessagesTableContainer);
