import { useStickToBottom } from "use-stick-to-bottom";
import { InterceptorsList, InterceptorsListProps } from "./InterceptorsList";

export function InterceptorsListContainer(props: InterceptorsListProps) {
  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

  if (props.interceptors.length === 0) {
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
        Interceptors are empty
      </div>
    );
  }

  return (
    <div ref={scrollRef}>
      <InterceptorsList ref={contentRef} {...props} />
    </div>
  );
}
