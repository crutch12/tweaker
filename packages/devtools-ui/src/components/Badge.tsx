import styled from "@emotion/styled";
import { ReactNode } from "react";
import { css } from "@emotion/css";
import cn from "classnames";

const APPEARANCES = {
  primary: css`
    background-color: rgb(26, 115, 232);
  `,
  secondary: css`
    background-color: rgb(88, 119, 160);
  `,
  warn: css`
    background-color: rgb(236, 143, 45);
  `,
};

const POSITIONS = {
  "top-left": css`
    top: 0;
    left: 0;
    border-bottom-right-radius: 10px;
  `,
  "top-right": css`
    top: 0;
    right: 0;
    border-bottom-left-radius: 10px;
  `,
  "bottom-left": css`
    bottom: 0;
    left: 0;
    border-top-right-radius: 10px;
  `,
  "bottom-right": css`
    bottom: 0;
    right: 0;
    border-top-left-radius: 10px;
  `,
};

export interface BadgeProps {
  children: ReactNode;
  appearance: keyof typeof APPEARANCES;
  position: keyof typeof POSITIONS;
  className?: string;
}

export function Badge({
  children,
  className,
  position,
  appearance,
  ...props
}: BadgeProps) {
  return (
    <BadgeContainer
      {...props}
      className={cn(className, POSITIONS[position], APPEARANCES[appearance])}
    >
      {children}
    </BadgeContainer>
  );
}

const BadgeContainer = styled.div`
  position: absolute;
  color: white;
  padding: 5px 10px;
  user-select: none;
`;
