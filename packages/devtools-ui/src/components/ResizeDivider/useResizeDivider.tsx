/**
 * We don't use @atlassian/pragmatic-drag-and-drop since it uses drag-and-drop API which doesn't work in Firefox DevTools Panel
 * @see https://github.com/atlassian/pragmatic-drag-and-drop/issues/238
 */

import { RefObject, useEffectEvent, PointerEvent, useCallback } from "react";

export interface UseResizerOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  getOrientation: () => "horizontal" | "vertical";
  widthVariable?: string;
  heightVariable?: string;
  minSize?: number;
  maxSize?: number;
}

export function useResizeDivider({
  containerRef,
  widthVariable = "--local-resizing-width",
  heightVariable = "--local-resizing-height",
  minSize = 15,
  maxSize = 85,
  getOrientation: _getOrientation,
}: UseResizerOptions) {
  const getVariables = useEffectEvent(() => {
    return {
      widthVariable,
      heightVariable,
    };
  });

  const getSizes = useEffectEvent(() => {
    return {
      minSize,
      maxSize,
    };
  });

  const getOrientation = useEffectEvent(() => {
    return _getOrientation();
  });

  const onResizeStart = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);
    element.classList.add("resizing");
  }, []);

  const onResizeEnd = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.releasePointerCapture(event.pointerId);
    element.classList.remove("resizing");
  }, []);

  const onResize = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const isResizing = element.hasPointerCapture(event.pointerId);
    if (!isResizing) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const isHorizontal = getOrientation() === "horizontal";

    const { widthVariable, heightVariable } = getVariables();
    const { minSize, maxSize } = getSizes();

    if (isHorizontal) {
      const relativeX = event.clientX - containerRect.left;
      const percentage = (relativeX / containerRect.width) * 100;
      container.style.setProperty(
        widthVariable,
        `${Math.min(Math.max(percentage, minSize), maxSize)}%`,
      );
    } else {
      const relativeY = event.clientY - containerRect.top;
      const percentage = (relativeY / containerRect.height) * 100;
      container.style.setProperty(
        heightVariable,
        `${Math.min(Math.max(percentage, minSize), maxSize)}%`,
      );
    }
  }, []);

  return {
    onResizeStart,
    onResize,
    onResizeEnd,
  };
}
