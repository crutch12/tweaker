import cn from "classnames";
import { Select } from "@radix-ui/themes";
import { useContainerQueryRoot } from "../container-query/ContainerQueryRootProvider";
import { DefaultScrollbarClassName } from "../../utils/styles";

export function SelectContent(props: Parameters<typeof Select.Content>[0]) {
  const { container } = useContainerQueryRoot();
  return (
    <Select.Content
      container={container.current}
      {...props}
      className={cn(DefaultScrollbarClassName, props.className)}
    />
  );
}
