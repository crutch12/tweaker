import { css } from "@emotion/css";
import { HTMLAttributes } from "react";

export interface BlueButtonProps extends HTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

export function BlueButton({
  onClick,
  children,
  disabled,
  ...rest
}: BlueButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={onClick}
      className={css`
        background-color: rgb(26, 115, 232);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 5px 12px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 500;

        :disabled {
          opacity: 0.5;
          cursor: default;
        }
      `}
    >
      {children}
    </button>
  );
}
