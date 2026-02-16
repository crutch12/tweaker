import styled from "@emotion/styled";
import { HTMLAttributes, ReactNode } from "react";

export interface ButtonIconProps extends HTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

export function ButtonIcon({ children, ...props }: ButtonIconProps) {
  return <ButtonIconContainer {...props}>{children}</ButtonIconContainer>;
}

const ButtonIconContainer = styled.button`
  display: flex;
  align-items: center;
  padding: 5px;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? undefined : "#dbdbdb")};
  }
`;
