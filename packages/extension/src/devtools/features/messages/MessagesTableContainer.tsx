import { useStickToBottom } from "use-stick-to-bottom";
import { MessagesTable, MessagesTableProps } from "./MessagesTable";
import { parsePatterns } from "../../utils/pattern";
import { memo, useMemo } from "react";
import { keyMatchesPatterns } from "@tweaker/core/utils";
import { Code, Text } from "@radix-ui/themes";
import { Flex } from "@radix-ui/themes";

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
      <Flex justify="center" align="center" flexGrow="1">
        <Text size="3">
          Call <Code>tweaker.value()</Code> from in-page code to see logs...
        </Text>
      </Flex>
    );
  }

  return (
    <div ref={scrollRef} style={{ overflow: "auto" }}>
      <MessagesTable ref={contentRef} {...props} messages={filteredMessages} />
    </div>
  );
}

export const MessagesTableContainer = memo(_MessagesTableContainer);
