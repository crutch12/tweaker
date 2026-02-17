import { Editor } from "prism-react-editor";
import type { PrismEditor } from "prism-react-editor";
import { BasicSetup } from "prism-react-editor/setups";

// Adding the JS grammar
import "prism-react-editor/prism/languages/javascript";
import "prism-react-editor/prism/languages/typescript";

import "prism-react-editor/layout.css";
import "prism-react-editor/themes/github-light.css";
import styled from "@emotion/styled";
import { ReactNode, useEffect, useEffectEvent, useRef } from "react";
import { css } from "@emotion/css";

export interface ExpressionCodeBlockProps {
  /**
   * (!) ExpressionCodeBlock is uncontrolled, DO NOT change code
   */
  code: string;
  onUpdate?: (code: string) => void;
  language?: string;
  readOnly?: boolean;
  disabled?: boolean;
  onSave?: () => void;
}

export function ExpressionCodeBlock({
  code,
  onUpdate,
  language = "js",
  readOnly = false,
  disabled,
  onSave,
}: ExpressionCodeBlockProps) {
  const ref = useRef<PrismEditor>(null);

  const onSaveHandler = useEffectEvent(() => {
    onSave?.();
  });

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (ev.key.toLocaleLowerCase() === "s" && ev.ctrlKey) {
        ev.preventDefault();
        onSaveHandler();
      }
    };
    ref?.current?.container?.addEventListener("keydown", handler);
    return () => {
      ref?.current?.container?.removeEventListener("keydown", handler);
    };
  }, []);

  return (
    <Editor
      className={css`
        opacity: ${disabled ? 0.5 : undefined};
        cursor: ${disabled || readOnly ? "default" : undefined};

        .pce-wrapper {
          margin: 0;
        }
      `}
      language={language}
      value={code}
      lineNumbers={false}
      onUpdate={onUpdate}
      readOnly={readOnly}
      ref={ref}
    >
      <BasicSetup />
    </Editor>
  );
}

export interface ExpressionCodeBlockContainerProps {
  language?: string;
  codeBefore?: string;
  codeAfter?: string;
  children: ReactNode;
}

export function ExpressionCodeBlockContainer({
  language,
  codeAfter,
  codeBefore,
  children,
}: ExpressionCodeBlockContainerProps) {
  return (
    <ExpressionCodeBlockContainerStyled>
      {codeBefore && (
        <ExpressionCodeBlock
          disabled
          language={language}
          readOnly
          code={codeBefore}
        />
      )}
      {children}
      {codeAfter && (
        <ExpressionCodeBlock
          disabled
          language={language}
          readOnly
          code={codeAfter}
        />
      )}
    </ExpressionCodeBlockContainerStyled>
  );
}

const ExpressionCodeBlockContainerStyled = styled.div``;
