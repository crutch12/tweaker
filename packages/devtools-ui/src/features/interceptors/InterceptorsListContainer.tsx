import { useStickToBottom } from "use-stick-to-bottom";
import { InterceptorsList, InterceptorsListProps } from "./InterceptorsList";
import { memo, useMemo } from "react";
import { Flex, Text, Box } from "@radix-ui/themes";
import { css } from "@emotion/css";

interface InterceptorsListContainerProps extends InterceptorsListProps {
  filter?: string;
}

function _InterceptorsListContainer({
  interceptors,
  filter,
  ...props
}: InterceptorsListContainerProps) {
  const { scrollRef, contentRef, isAtBottom } = useStickToBottom({
    mass: 1,
  });

  const filteredInterceptors = useMemo(() => {
    const trimmed = filter?.trim();

    if (!trimmed) return interceptors;

    return interceptors.filter((x) => {
      return (
        String(x.id).includes(trimmed) ||
        x.patterns.some((p) => p.includes(trimmed)) ||
        x.name.includes(trimmed)
      );
    });
  }, [interceptors, filter]);

  if (interceptors.length === 0) {
    return (
      <Flex
        justify="center"
        align="center"
        flexGrow="1"
        px="2"
        className={styles.Container}
      >
        <Text size="3" align="center">
          Interceptors are empty
        </Text>
      </Flex>
    );
  }

  if (filteredInterceptors.length === 0) {
    return (
      <Flex
        justify="center"
        align="center"
        flexGrow="1"
        px="2"
        className={styles.Container}
      >
        <Text size="3" align="center">
          No interceptors found
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      ref={scrollRef}
      overflow="auto"
      flexGrow="1"
      className={styles.Container}
    >
      <InterceptorsList
        ref={contentRef}
        interceptors={filteredInterceptors}
        {...props}
      />
    </Box>
  );
}

export const InterceptorsListContainer = memo(_InterceptorsListContainer);

const styles = {
  Container: css`
    background-color: var(--accent-2);
    padding: var(--space-2) var(--space-1) var(--space-2) var(--space-2);
  `,
};
