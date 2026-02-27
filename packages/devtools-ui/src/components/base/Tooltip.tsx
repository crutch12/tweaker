import cn from "classnames";
import { Tooltip as RadixTooltip } from "@radix-ui/themes";
import { useContainerQueryRoot } from "../container-query/ContainerQueryRootProvider";
import { DefaultScrollbarClassName } from "../../utils/styles";

export function Tooltip(props: Parameters<typeof RadixTooltip>[0]) {
  const { container } = useContainerQueryRoot();
  return (
    <RadixTooltip
      container={container.current}
      {...props}
      className={cn(DefaultScrollbarClassName, props.className)}
    />
  );
}
