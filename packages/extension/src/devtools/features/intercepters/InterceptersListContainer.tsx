import { useStickToBottom } from "use-stick-to-bottom";
import { InterceptersList, InterceptersListProps } from "./InterceptersList";

export function InterceptersListContainer(props: InterceptersListProps) {
  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

  if (props.intercepters.length === 0) {
    return (
      <div
        style={{
          fontSize: "16px",
        }}
      >
        Intercepters are empty
      </div>
    );
  }

  return (
    <div ref={scrollRef}>
      <InterceptersList ref={contentRef} {...props} />
    </div>
  );
}
