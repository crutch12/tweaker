import { ReactNode, useCallback, useRef } from "react";
import { Container, Runtime } from "../../utils/styles";
import { useResizeDivider } from "../../components/ResizeDivider/useResizeDivider";
import { Flex, Grid } from "@radix-ui/themes";
import { css } from "@emotion/css";
import { ResizeDivider } from "../../components/ResizeDivider/ResizeDivider";
import { ButtonIcon } from "../../components/ButtonIcon";

export interface MainContainerProps {
  First: ReactNode;
  Second: ReactNode;
}

export function MainContainer({ First, Second }: MainContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getResizerMode = useCallback(() => {
    if (!containerRef.current) return "vertical";
    return Runtime.LgAndUp(containerRef.current) ? "horizontal" : "vertical";
  }, []);

  const resizeDividerProps = useResizeDivider({
    containerRef,
    heightVariable: "--local-resizing-height",
    widthVariable: "--local-resizing-width",
    getOrientation: getResizerMode,
  });

  const resetResizer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const isHorizontal = getResizerMode() === "horizontal";
    if (isHorizontal) {
      container.style.setProperty("--local-resizing-width", "50%");
    } else {
      container.style.setProperty("--local-resizing-height", "50%");
    }
  }, []);

  return (
    <Grid
      minHeight="0"
      flexGrow="1"
      ref={containerRef}
      rows={{
        initial: `var(--local-resizing-height) 1fr`,
        lg: "1fr",
      }}
      columns={{
        initial: "1fr",
        lg: `var(--local-resizing-width) 1fr`,
      }}
      className={css`
        --local-resizing-width: 50%;
        --local-resizing-height: 50%;
      `}
    >
      <Flex direction="column" overflow="auto">
        {First}
      </Flex>
      <Flex
        direction="column"
        overflow="auto"
        position="relative"
        className={css`
          border-top: 1px solid var(--gray-a6);

          ${Container.LgAndUp()} {
            border-top: unset;
            border-left: 1px solid var(--gray-a6);
          }
        `}
      >
        <ResizeDivider onReset={resetResizer} {...resizeDividerProps} />
        {Second}
      </Flex>
    </Grid>
  );
}
