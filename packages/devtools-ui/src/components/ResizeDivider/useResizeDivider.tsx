import { RefObject, useEffect, useEffectEvent } from "react";

export interface UseResizerOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  dividerRef: RefObject<HTMLDivElement | null>;
  getMode: () => "horizontal" | "vertical";
  widthVariable?: string;
  heightVariable?: string;
  minSize?: number;
  maxSize?: number;
}

export function useResizeDivider({
  containerRef,
  dividerRef,
  widthVariable = "--local-resizing-width",
  heightVariable = "--local-resizing-height",
  minSize = 15,
  maxSize = 85,
  getMode: _getMode,
}: UseResizerOptions) {
  const getSizes = useEffectEvent(() => {
    return {
      minSize,
      maxSize,
    };
  });

  const getMode = useEffectEvent(() => {
    return _getMode();
  });

  useEffect(() => {
    if (!dividerRef.current) return;

    let unsub: Function | undefined;

    (async () => {
      const { disableNativeDragPreview, draggable, preventUnhandled } =
        await import("./pragmatic-drag-and-drop");

      if (!dividerRef.current) return;

      unsub = draggable({
        element: dividerRef.current,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
        },
        onDragStart: ({ source }) => {
          source.element.style.setProperty("pointer-events", "none");
        },
        onDrag: ({ location }) => {
          const container = containerRef.current;
          if (!container) return;

          const containerRect = container.getBoundingClientRect();
          const isHorizontal = getMode() === "horizontal";

          const { minSize, maxSize } = getSizes();

          if (isHorizontal) {
            const relativeX =
              location.current.input.clientX - containerRect.left;
            const percentage = (relativeX / containerRect.width) * 100;

            container.style.setProperty(
              widthVariable,
              `${Math.min(Math.max(percentage, minSize), maxSize)}%`,
            );
          } else {
            const relativeY =
              location.current.input.clientY - containerRect.top;
            const percentage = (relativeY / containerRect.height) * 100;
            container.style.setProperty(
              heightVariable,
              `${Math.min(Math.max(percentage, minSize), maxSize)}%`,
            );
          }
        },
        onDrop({ source }) {
          preventUnhandled.stop();
          source.element.style.removeProperty("pointer-events");
        },
      });
    })();

    return () => {
      unsub?.();
    };
  }, []);
}
