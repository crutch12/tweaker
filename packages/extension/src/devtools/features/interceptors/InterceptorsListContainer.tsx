import { useStickToBottom } from "use-stick-to-bottom";
import { InterceptorsList, InterceptorsListProps } from "./InterceptorsList";
import { memo } from "react";
import { Flex, Text } from "@radix-ui/themes";

function _InterceptorsListContainer(props: InterceptorsListProps) {
  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

  if (props.interceptors.length === 0) {
    return (
      <Flex justify="center" align="center">
        <Text size="3">Interceptors are empty</Text>
      </Flex>
    );
  }

  return (
    <div ref={scrollRef}>
      <InterceptorsList ref={contentRef} {...props} />
    </div>
  );
}

export const InterceptorsListContainer = memo(_InterceptorsListContainer);
