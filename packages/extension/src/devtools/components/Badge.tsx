import styled from "@emotion/styled";
// import styled from "@emotion/styled";
import { ReactNode } from "react";
import { css } from "@emotion/react";

const APPEARANCES = {
  primary: "rgb(26, 115, 232)",
  secondary: "rgb(88, 119, 160)",
};

const POSITIONS = {
  "top-left": {
    top: 0,
    bottom: undefined,
    left: 0,
    right: undefined,
  },
  "top-right": {
    top: 0,
    bottom: undefined,
    left: undefined,
    right: 0,
  },
  "bottom-left": {
    top: undefined,
    bottom: 0,
    left: 0,
    right: undefined,
  },
  "bottom-right": {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
  },
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
  border-top-left-radius: 10px;
  top: ${({ position }) => POSITIONS[position].top};
  bottom: ${({ position }) => POSITIONS[position].bottom};
  left: ${({ position }) => POSITIONS[position].left};
  right: ${({ position }) => POSITIONS[position].right};
`;
