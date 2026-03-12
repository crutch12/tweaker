import { ReactNode } from "react";
import { Theme } from "@radix-ui/themes";
import { css } from "@emotion/css";
import cn from "classnames";
import { useEditorTheme } from "prism-react-editor/themes";
import { DefaultScrollbarClassName } from "../../utils/styles";
import { ContainerQueryRootClassName } from "../container-query/styles";
import { useColorScheme } from "./ColorSchemeProvider";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  const prismThemeCss = useEditorTheme(
    colorScheme === "dark" ? "github-dark" : "github-light",
  );

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
      <style>{prismThemeCss}</style>
      {children}
    </Theme>
  );
}
