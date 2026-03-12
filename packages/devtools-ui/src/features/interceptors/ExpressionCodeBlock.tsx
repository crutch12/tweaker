import { ReactNode, useEffect, useEffectEvent, useRef } from "react";
import { css } from "@emotion/css";
import cn from "classnames";

import { Editor } from "prism-react-editor";
import type { PrismEditor } from "prism-react-editor";

// Adding the JS grammar
import "prism-react-editor/prism/languages/javascript";
import "prism-react-editor/prism/languages/typescript";
import "prism-react-editor/prism/languages/json";

import "prism-react-editor/layout.css";

import {
  useDefaultCommands,
  useEditHistory,
} from "prism-react-editor/commands";
import { IndentGuides } from "prism-react-editor/guides";
import { useBracketMatcher } from "prism-react-editor/match-brackets";
import { useHighlightBracketPairs } from "prism-react-editor/highlight-brackets";
import {
  useTagMatcher,
  useHighlightMatchingTags,
} from "prism-react-editor/match-tags";
import { usePrismEditor } from "prism-react-editor/extensions";
import {
  useHighlightSelectionMatches,
  useShowInvisibles,
} from "prism-react-editor/search";
import { useCursorPosition } from "prism-react-editor/cursor";

const BasicSetup = () => {
  const [editor] = usePrismEditor();
  useBracketMatcher(editor);
  useHighlightBracketPairs(editor);
  useTagMatcher(editor);
  useHighlightMatchingTags(editor);
  useDefaultCommands(editor);
  useEditHistory(editor);
  // useSearchWidget(editor); // disabled
  useHighlightSelectionMatches(editor);
  useShowInvisibles(editor);
  useCursorPosition(editor);
  return <IndentGuides />;
};

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
  showBorders?: boolean;
}

export function ExpressionCodeBlock({
  code,
  onUpdate,
  language = "js",
  readOnly = false,
  disabled,
  onSave,
  showBorders = true,
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
      className={cn(
        styles.Editor,
        disabled && styles.Disabled,
        readOnly && styles.ReadOnly,
        showBorders && styles.Borders,
      )}
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
    <div className={cn(styles.Borders)}>
      {codeBefore && (
        <ExpressionCodeBlock
          disabled
          language={language}
          readOnly
          code={codeBefore}
          showBorders={false}
        />
      )}
      {children}
      {codeAfter && (
        <ExpressionCodeBlock
          disabled
          language={language}
          readOnly
          code={codeAfter}
          showBorders={false}
        />
      )}
    </div>
  );
}

const styles = {
  Editor: css`
    .pce-wrapper {
      margin: 0;
    }
  `,
  Disabled: css`
    opacity: 0.5;
    cursor: default;

    .pce-wrapper {
      overflow: hidden;
    }
  `,
  ReadOnly: css`
    cursor: default;
  `,
  Borders: css`
    border: 1px solid var(--gray-a7);
    border-radius: 3px;
  `,
};
