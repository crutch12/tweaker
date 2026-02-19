import cn from "classnames";
import { HoverCard } from "@radix-ui/themes";
import { useContainerQueryRoot } from "../../features/container-query/ContainerQueryRootProvider";
import { DefaultScrollbarClassName } from "../../utils/styles";

export function HoverCardContent(
  props: Parameters<typeof HoverCard.Content>[0],
) {
  const { container } = useContainerQueryRoot();
  return (
    <HoverCard.Content
      container={container.current}
      {...props}
      className={cn(DefaultScrollbarClassName, props.className)}
    />
  );
}
