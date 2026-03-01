import { useStickToBottom } from "use-stick-to-bottom";
import { MessagesTable, MessagesTableProps } from "./MessagesTable";
import { parsePatterns } from "../../utils/pattern";
import { memo, useMemo } from "react";
import { keyMatchesPatterns } from "@tweaker/core/utils";
import { Code, Text, Flex, Box } from "@radix-ui/themes";
import { css } from "@emotion/css";
import { ExtensionInterceptor } from "../interceptors/InterceptorItem";
import type { InterceptorId } from "@tweaker/core";

export interface HighlightRow {
  id: string;
  pattern?: boolean;
  interceptorId?: InterceptorId;
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
      <Flex justify="center" align="center" flexGrow="1" px="2">
        <Text size="3" align="center">
          Call <Code>tweaker.value()</Code> from in-page code to see logs...
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      ref={scrollRef}
      overflow="auto"
      className={css`
        ${highlightedRowsByPatternSelector} {
          background-color: var(--jade-5) !important;
        }
        ${highlightedRowsByInterceptorSelector} {
          background-color: var(--purple-5) !important;
        }
      `}
    >
      <MessagesTable ref={contentRef} {...props} messages={filteredMessages} />
    </Box>
  );
}

export const MessagesTableContainer = memo(_MessagesTableContainer);
