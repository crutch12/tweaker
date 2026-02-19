import styled from "@emotion/styled";
// import styled from "@emotion/styled";
import { ReactNode } from "react";
import { css } from "@emotion/react";

const APPEARANCES = {
  primary: "rgb(26, 115, 232)",
  secondary: "rgb(88, 119, 160)",
  warn: "rgb(236, 143, 45)",
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
}

export function Badge({ children, ...props }: BadgeProps) {
  return <BadgeContainer {...props}>{children}</BadgeContainer>;
}

const BadgeContainer = styled.div<BadgeProps>`
  position: absolute;
  color: white;
  font-weight: 700;
  background-color: ${({ appearance }) => APPEARANCES[appearance]};
  padding: 5px 10px;
  ${({ position }) => POSITIONS[position]}
`;
