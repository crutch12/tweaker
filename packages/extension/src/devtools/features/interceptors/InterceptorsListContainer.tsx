import { useStickToBottom } from "use-stick-to-bottom";
import { InterceptorsList, InterceptorsListProps } from "./InterceptorsList";
import { memo, useMemo } from "react";
import { Flex, Text, Box } from "@radix-ui/themes";

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
      <Flex justify="center" align="center" flexGrow="1">
        <Text size="3">Interceptors are empty</Text>
      </Flex>
    );
  }

  return (
    <Box ref={scrollRef} overflow="auto">
      <InterceptorsList
        ref={contentRef}
        interceptors={filteredInterceptors}
        {...props}
      />
    </Box>
  );
}

export const InterceptorsListContainer = memo(_InterceptorsListContainer);
