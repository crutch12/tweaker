import { Popover, Flex, Code, Text, Skeleton, Kbd } from "@radix-ui/themes";
import { lazy, Suspense, useMemo, use } from "react";
import { InspectorIcon } from "@devtools-ds/icon";
import { CodeIcon, CopyIcon } from "@radix-ui/react-icons";
import { ButtonIcon } from "./ButtonIcon";
import { PopoverContent } from "./base/PopoverContent";
import { css } from "@emotion/css";
import { IconPropsSize } from "../icons/props";
import * as stackTraceParser from "stacktrace-parser";
import { useDevtools } from "../features/devtools/DevtoolsProvider";
import { notify } from "../features/notifications/notify";
import { Tooltip } from "./base/Tooltip";

const ExpressionCodeBlock = lazy(() =>
  import("../features/interceptors/ExpressionCodeBlock").then((r) => ({
    default: r.ExpressionCodeBlock,
  })),
);

function SourceCode({
  formattedCodePromise,
}: {
  formattedCodePromise: Promise<string>;
}) {
  const formattedCode = use(formattedCodePromise);

  return (
    <ExpressionCodeBlock readOnly language="javascript" code={formattedCode} />
  );
}

export function FormattedSourceCode({ code }: { code: string }) {
  const formattedCodePromise = useMemo(() => {
    return import("dedent").then((dedent) => dedent.default(code));
  }, [code]);

  return <SourceCode formattedCodePromise={formattedCodePromise} />;
}

function generateSourceCodePath(line: stackTraceParser.StackFrame) {
  const url = line.file ? new URL(line.file) : undefined;
  const path = url ? [url.pathname, url.search, url.hash].join("") : line.file;
  const text = [path, line.lineNumber, line.column].filter(Boolean).join(":");
  return text;
}

function CopySourceCodePathButton({
  line,
  size = "medium",
}: {
  line: stackTraceParser.StackFrame;
  size?: "small" | "medium";
}) {
  return (
    <ButtonIcon
      title="Copy"
      onClick={() => {
        const text = generateSourceCodePath(line);
        navigator.clipboard
          .writeText(text)
          .then(() => {
            notify(
              <Text>
                Copied to clipboard: <Code>{text}</Code>
              </Text>,
              "success",
            );
          })
          .catch((err: Error) => {
            notify(err.message, "error");
          });
      }}
    >
      <CopyIcon
        width={size === "small" ? 10 : 15}
        height={size === "small" ? 10 : 15}
        color="var(--blue-9)"
      />
    </ButtonIcon>
  );
}

export interface SourceCodePopoverProps {
  code?: string;
  stack?: string;
  stackLabel?: string;
  title?: string;
  size?: IconPropsSize["size"];
}

export function SourceCodePopover({
  code,
  stack,
  stackLabel = "tweaker.intercept()",
  title,
  size = "small",
}: SourceCodePopoverProps) {
  const { canViewSourceCode, viewSourceCode } = useDevtools();
  const parsedStack = useMemo(
    () => (stack ? stackTraceParser.parse(stack) : []),
    [stack],
  );
  return (
    <Popover.Root>
      <Popover.Trigger>
        <ButtonIcon title={title}>
          <InspectorIcon size={size} />
        </ButtonIcon>
      </Popover.Trigger>
      <PopoverContent
        maxWidth="min(70cqw, 1200px)"
        maxHeight="min(70cqh, 800px)"
      >
        <Flex
          gap="2"
          direction="column"
          width="fit-content"
          height="fit-content"
        >
          {code && (
            <Flex direction="column" gap="1">
              <Text as="label">
                <Code>interceptor.handler</Code>
              </Text>
              <Suspense
                fallback={
                  <Flex direction="column" gap="1">
                    <Skeleton height="18px" />
                    <Skeleton height="18px" />
                    <Skeleton height="18px" />
                  </Flex>
                }
              >
                <FormattedSourceCode code={code} />
              </Suspense>
            </Flex>
          )}
          {stack && (
            <Flex direction="column" gap="1">
              <Flex gap="1">
                <Text as="label">
                  <Code>{stackLabel}</Code>
                </Text>
              </Flex>
              {parsedStack.length > 0 && (
                <Flex direction="column">
                  {parsedStack.map((line, idx) => (
                    <Flex key={idx} gap="1">
                      <CopySourceCodePathButton line={line} />
                      <Tooltip
                        content={
                          canViewSourceCode ? (
                            "View source for this call"
                          ) : (
                            <Flex direction="column" gap="1">
                              <Text size="2">
                                Viewing source is not available, you should open
                                sources manually:
                              </Text>
                              <Flex asChild direction="column" gap="1">
                                <ul className={styles.TooltipContentList}>
                                  <li>
                                    <Flex gap="1">
                                      <Text size="2">Press Copy</Text>
                                      <CopySourceCodePathButton
                                        size="small"
                                        line={line}
                                      />
                                    </Flex>
                                  </li>
                                  <li>
                                    <Text size="2">Open Devtools</Text>
                                  </li>
                                  <li>
                                    <Text size="2">Open Sources panel</Text>
                                  </li>
                                  <li>
                                    <Text size="2">
                                      Press <Kbd>Ctrl + P</Kbd>
                                    </Text>
                                  </li>
                                  <li>
                                    <Text size="2">Paste copied path</Text>
                                  </li>
                                  <li>
                                    <Text size="2">
                                      Press <Kbd>Enter</Kbd>
                                    </Text>
                                  </li>
                                </ul>
                              </Flex>
                            </Flex>
                          )
                        }
                      >
                        <ButtonIcon
                          title={
                            canViewSourceCode
                              ? "View source for this call"
                              : "Viewing source is not available"
                          }
                          disabled={!canViewSourceCode}
                          onClick={() => {
                            if (
                              line &&
                              line.file &&
                              line.lineNumber &&
                              line.column
                            ) {
                              viewSourceCode(
                                line.file,
                                line.lineNumber,
                                line.column,
                              );
                            }
                          }}
                        >
                          <CodeIcon color="var(--indigo-9)" />
                        </ButtonIcon>
                      </Tooltip>
                      <Code
                        className={css`
                          white-space: pre;
                        `}
                      >
                        {line.file}:{line.lineNumber}:{line.column} (
                        {line.methodName})
                      </Code>
                    </Flex>
                  ))}
                </Flex>
              )}
            </Flex>
          )}
        </Flex>
      </PopoverContent>
    </Popover.Root>
  );
}

const styles = {
  TooltipContentList: css`
    padding-inline-start: var(--space-4);
    margin: 0;
  `,
};
