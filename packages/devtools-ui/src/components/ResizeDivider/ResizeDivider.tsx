import { HTMLAttributes, RefObject, useMemo } from "react";
import { Box, Separator } from "@radix-ui/themes";
import { css } from "@emotion/css";
import { Container } from "../../utils/styles";

export interface ResizeDividerProps extends HTMLAttributes<HTMLDivElement> {
  ref: RefObject<HTMLDivElement | null>;
  onReset?: () => void;
}

export function ResizeDivider({ ref, onReset, ...props }: ResizeDividerProps) {
  const title = useMemo(() => {
    return ["Drag to resize", onReset ? "Double click to reset" : undefined]
      .filter(Boolean)
      .join("\n");
  }, [onReset]);

  return (
    <Box
      ref={ref}
      onDoubleClick={onReset}
      px={{ initial: "0", xl: "2px" }}
      py={{ initial: "2px", xl: "0" }}
      className={css`
        border-radius: 4px;
        :hover {
          cursor: ns-resize;
          box-shadow:
            inset 1px 1px 2px rgb(26, 115, 232),
            inset -1px -1px 2px rgb(26, 115, 232);

          ${Container.XlAndUp()} {
            cursor: e-resize;
          }
        }
      `}
      title={title}
      {...props}
    >
      <Separator
        size="4"
        orientation={{ initial: "horizontal", xl: "vertical" }}
      />
    </Box>
  );
}
