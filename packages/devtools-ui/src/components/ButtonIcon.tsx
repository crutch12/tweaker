import styled from "@emotion/styled";
import { HTMLAttributes, CSSProperties } from "react";

export interface ButtonIconProps extends HTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  cursor?: CSSProperties["cursor"];
}

export function ButtonIcon({ children, ...props }: ButtonIconProps) {
  return <ButtonIconContainer {...props}>{children}</ButtonIconContainer>;
}

const ButtonIconContainer = styled.button<ButtonIconProps>`
  display: flex;
  align-items: center;
  padding: 5px;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: ${({ disabled, cursor }) =>
    disabled ? "default" : cursor ? cursor : "pointer"};

  &:hover {
    background-color: ${({ disabled }) =>
      disabled ? undefined : "var(--gray-8)"};
  }
`;
