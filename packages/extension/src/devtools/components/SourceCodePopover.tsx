import { Popover, Flex, Code, Text, Skeleton } from "@radix-ui/themes";
import { lazy, Suspense, useMemo, use } from "react";
import { InspectorIcon } from "@devtools-ds/icon";
import { ButtonIcon } from "./ButtonIcon";

export interface SourceCodePopoverProps {
  code?: string;
  stack?: string;
}

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

function FormattedSourceCode({ code }: { code: string }) {
  const formattedCodePromise = useMemo(() => {
    return import("dedent").then((dedent) => dedent.default(code));
  }, [code]);

  return <SourceCode formattedCodePromise={formattedCodePromise} />;
}

export function SourceCodePopover({ code, stack }: SourceCodePopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <ButtonIcon title="Show interceptor source code (formatted)">
          <InspectorIcon size="medium" />
        </ButtonIcon>
      </Popover.Trigger>
      <Popover.Content
        maxWidth="min(70vw, 1200px)"
        maxHeight="min(70vh, 800px)"
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
              <Text as="label">
                <Code>tweaker.intercept()</Code>
              </Text>
              <Code style={{ whiteSpace: "pre" }}>{stack}</Code>
            </Flex>
          )}
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
