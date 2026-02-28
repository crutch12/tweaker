import { HTMLAttributes, PointerEventHandler, RefObject, useMemo } from "react";
import { Box, Separator } from "@radix-ui/themes";
import { css } from "@emotion/css";
import { Container } from "../../utils/styles";
import cn from "classnames";

export interface ResizeDividerProps extends HTMLAttributes<HTMLDivElement> {
  onResizeStart: PointerEventHandler;
  onResize: PointerEventHandler;
  onResizeEnd: PointerEventHandler;
  onReset?: () => void;
}

export function ResizeDivider({
  onReset,
  onResizeStart,
  onResize,
  onResizeEnd,
  className,
  ...props
}: ResizeDividerProps) {
  const title = useMemo(() => {
    return ["Drag to resize", onReset ? "Double click to reset" : undefined]
      .filter(Boolean)
      .join("\n");
  }, [onReset]);

  return (
    <Box
      onPointerDown={onResizeStart}
      onPointerMove={onResize}
      onPointerUp={onResizeEnd}
      onDoubleClick={onReset}
      px={{ initial: "0", lg: "calc(var(--space-1) / 2)" }}
      py={{ initial: "calc(var(--space-1) / 2)", lg: "0" }}
      className={cn(
        css`
          position: absolute;

          top: 0;
          bottom: unset;
          right: 0;
          left: 0;

          ${Container.LgAndUp()} {
            top: 0;
            bottom: 0;
            right: unset;
            left: 0;
          }

          :hover {
            cursor: ns-resize;
            box-shadow:
              inset 1px 1px 2px rgb(26, 115, 232),
              inset -1px -1px 2px rgb(26, 115, 232);

            ${Container.LgAndUp()} {
              cursor: e-resize;
            }
          }

          &.resizing {
            background: rgb(26, 115, 232);
            box-shadow: none;
          }
        `,
        className,
      )}
      title={title}
      {...props}
    />
  );
}
