import {
  createContext,
  useContext,
  ReactNode,
  useRef,
  RefObject,
  useEffect,
  useMemo,
} from "react";
import { css } from "@emotion/css";
import { ContainerQueryRootClassName } from "./styles";

interface ContainerQueryContextProps {
  container: RefObject<HTMLElement | null>;
}

const ContainerQueryRootContext = createContext<ContainerQueryContextProps>({
  container: { current: null },
});

export function useContainerQueryRoot() {
  return useContext(ContainerQueryRootContext);
}

const ContainerQueryProviderClassName = css`
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  pointer-events: none;

  > * {
    pointer-events: all;
  }
`;

export function ContainerQueryRootProvider({
  children,
}: {
  children: ReactNode;
}) {
  const container = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = document.createElement("div");

    element.classList.add(
      "tdrt", // tweaker-devtools-radix-themes namespace
      ContainerQueryProviderClassName,
      ContainerQueryRootClassName,
    );

    document.body.append(element);

    container.current = element;

    return () => {
      element.remove();
    };
  }, []);

  const value = useMemo(() => {
    return { container };
  }, []);

  return (
    <ContainerQueryRootContext.Provider value={value}>
      {children}
    </ContainerQueryRootContext.Provider>
  );
}
