import cn from "classnames";
import { DropdownMenu } from "@radix-ui/themes";
import { useContainerQueryRoot } from "../container-query/ContainerQueryRootProvider";
import { DefaultScrollbarClassName } from "../../utils/styles";

export function DropdownMenuContent(
  props: Parameters<typeof DropdownMenu.Content>[0],
) {
  const { container } = useContainerQueryRoot();
  return (
    <DropdownMenu.Content
      container={container.current}
      {...props}
      className={cn(DefaultScrollbarClassName, props.className)}
    />
  );
}
