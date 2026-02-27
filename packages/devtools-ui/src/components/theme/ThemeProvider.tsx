import { ReactNode } from "react";
import { Theme } from "@radix-ui/themes";
import { css } from "@emotion/css";
import cn from "classnames";
import { DefaultScrollbarClassName } from "../../utils/styles";
import { ContainerQueryRootClassName } from "../container-query/styles";
import { useColorScheme } from "./ColorSchemeProvider";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  return (
    <Theme
      appearance={colorScheme ? colorScheme : "inherit"}
      className={cn(
        css`
          min-height: unset;
        `,
        DefaultScrollbarClassName,
        ContainerQueryRootClassName,
      )}
    >
      {children}
    </Theme>
  );
}
