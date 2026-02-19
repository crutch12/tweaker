import cn from "classnames";
import { Popover } from "@radix-ui/themes";
import { useContainerQueryRoot } from "../../features/container-query/ContainerQueryRootProvider";
import { DefaultScrollbarClassName } from "../../utils/styles";

export function PopoverContent(props: Parameters<typeof Popover.Content>[0]) {
  const { container } = useContainerQueryRoot();
  return (
    <Popover.Content
      container={container.current}
      {...props}
      className={cn(DefaultScrollbarClassName, props.className)}
    />
  );
}
