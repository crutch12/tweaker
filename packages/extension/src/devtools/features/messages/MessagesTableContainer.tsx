import { useStickToBottom } from "use-stick-to-bottom";
import { MessagesTable, MessagesTableProps } from "./MessagesTable";
import { parsePatterns } from "../../utils/pattern";
import { memo, useMemo } from "react";
import { keyMatchesPatterns } from "@tweaker/core/utils";
import { Code, Text } from "@radix-ui/themes";
import { Flex } from "@radix-ui/themes";
import { css } from "@emotion/css";
import { ExtensionInterceptor } from "../interceptors/InterceptorItem";

export interface HighlightRow {
  id: string;
  pattern?: boolean;
  interceptorId?: string | number;
}

export interface MessagesTableContainerProps extends MessagesTableProps {
  filterPatterns?: string;
  highllightByInterceptor?: ExtensionInterceptor;
}

function _MessagesTableContainer({
  filterPatterns,
  messages,
  highllightByInterceptor,
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

  const highlightedRowsByPatternSelector = useMemo(() => {
    if (!highllightByInterceptor) return undefined;

    const highlights = filteredMessages
      .filter((m) => m.name === highllightByInterceptor.name)
      .filter((m) =>
        keyMatchesPatterns(m.key, highllightByInterceptor.patterns),
      )
      .map((x) => `${x.name}:${x.key}`);

    const result = highlights.map((x) => `tr[data-row-id="${x}"]`);
    return Array.from(new Set(result).values()).join(", ");
  }, [highllightByInterceptor, filteredMessages]);

  const highlightedRowsByInterceptorSelector = useMemo(() => {
    if (!highllightByInterceptor) return undefined;

    const highlights = filteredMessages
      .filter((m) => m.interceptorId === highllightByInterceptor.id)
      .map((x) => x.interceptorId!);

    const result = highlights.map((x) => `tr[data-row-interceptor-id="${x}"]`);
    return Array.from(new Set(result).values()).join(", ");
  }, [highllightByInterceptor, filteredMessages]);

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
    <div
      ref={scrollRef}
      style={{ overflow: "auto" }}
      className={css`
        ${highlightedRowsByPatternSelector} {
          background-color: rgb(203, 236, 209) !important;
        }
        ${highlightedRowsByInterceptorSelector} {
          background-color: rgb(235, 203, 236) !important;
        }
      `}
    >
      <MessagesTable ref={contentRef} {...props} messages={filteredMessages} />
    </div>
  );
}

export const MessagesTableContainer = memo(_MessagesTableContainer);
