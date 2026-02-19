import { RefObject, useEffect, useEffectEvent } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";

export interface UseResizerOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  dividerRef: RefObject<HTMLDivElement | null>;
  getMode: () => "horizontal" | "vertical";
  widthVariable?: string;
  heightVariable?: string;
  minSize?: number;
  maxSize?: number;
}

export function useResizer({
  containerRef,
  dividerRef,
  widthVariable = "--local-resizing-width",
  heightVariable = "--local-resizing-height",
  minSize = 10,
  maxSize = 90,
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

    return draggable({
      element: dividerRef.current,
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        disableNativeDragPreview({ nativeSetDragImage });
        preventUnhandled.start();
      },
      onDrag: ({ location }) => {
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const isHorizontal = getMode() === "horizontal";

        const { minSize, maxSize } = getSizes();

        if (isHorizontal) {
          const relativeX = location.current.input.clientX - containerRect.left;
          const percentage = (relativeX / containerRect.width) * 100;

          container.style.setProperty(
            widthVariable,
            `${Math.min(Math.max(percentage, minSize), maxSize)}%`,
          );
        } else {
          const relativeY = location.current.input.clientY - containerRect.top;
          const percentage = (relativeY / containerRect.height) * 100;
          container.style.setProperty(
            heightVariable,
            `${Math.min(Math.max(percentage, minSize), maxSize)}%`,
          );
        }
      },
      onDrop() {
        preventUnhandled.stop();
      },
    });
  }, []);
}
