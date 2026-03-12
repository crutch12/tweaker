import { Button, Code, Flex, Kbd, Skeleton, Text } from "@radix-ui/themes";
import { InterceptorItemProps } from "../InterceptorItem";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { Tooltip, TooltipStyles } from "../../../../components/base/Tooltip";
import { ButtonIcon } from "../../../../components/ButtonIcon";
import { InfoIcon } from "@devtools-ds/icon";
import {
  EXTENSION_OWNER,
  InterceptorPayload,
  ManualInterceptor,
} from "@tweaker/extension-plugin";
import { parsePatterns } from "../../../../utils/pattern";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isJsSyntaxValid } from "../../../../utils/isJsSyntaxValid";
import { PatternsControl } from "../controls/PatternsControl";
import { SaveButtons } from "../controls/SaveButtons";

const ExpressionCodeBlock = lazy(() =>
  import("../../ExpressionCodeBlock").then((r) => ({
    default: r.ExpressionCodeBlock,
  })),
);
const ExpressionCodeBlockContainer = lazy(() =>
  import("../../ExpressionCodeBlock").then((r) => ({
    default: r.ExpressionCodeBlockContainer,
  })),
);

const ExpressionTypeDefinition = `type ExpressionCallback<T extends any> = (
  key: string,
  value: T,
  ctx: {
    params: Record<string, any>;
    bypass: symbol;
  },
) => T | symbol`;

export interface InterceptorItemManualFormProps extends InterceptorItemProps<
  InterceptorPayload<ManualInterceptor>
> {
  data: ManualInterceptor["data"];
  onDataChange: (value: ManualInterceptor["data"]) => void;
  patterns: string;
  onPatternsChange: (value: string) => void;
  hasChanges: boolean;
}

export function InterceptorItemManualForm({
  interceptor,
  onChange,
  onHightLightInterceptor,
  data,
  onDataChange,
  patterns,
  onPatternsChange,
  hasChanges,
}: InterceptorItemManualFormProps) {
  const [initialData, setInitialData] = useState(() => interceptor.data);

  const actualizeCodeExpression = useEffectEvent((force: boolean) => {
    if (force || interceptor.data?.expression !== data?.expression) {
      setUpdatesCount((v) => v + 1);
      setInitialData(interceptor.data);
      onDataChange(interceptor.data);
    }
  });

  useEffect(() => {
    actualizeCodeExpression(false);
  }, [interceptor.data?.expression]);

  const onCodeUpdate = useCallback(
    (code: string) => {
      onDataChange({
        ...data,
        expression: code || undefined,
      });
    },
    [onDataChange, data],
  );

  const [updatesCount, setUpdatesCount] = useState(0);

  const discardChanges = useCallback(() => {
    actualizeCodeExpression(true);
  }, []);

  const { data: expressionError } = useQuery({
    queryKey: ["validateExpression", data?.expression],
    queryFn: () => {
      if (!data?.expression) return { valid: true, error: undefined };
      return isJsSyntaxValid("() => {\n" + data.expression + "\n}");
    },
    select: ({ error }) => {
      if (error) {
        return `${error.name} - ${error.message}`;
      }
      return undefined;
    },
    placeholderData: keepPreviousData,
  });

  const isByExtension = interceptor.owner === EXTENSION_OWNER;
  const canChangeExpression = isByExtension;

  const onHightLight = useEffectEvent(
    (_interceptor: typeof interceptor | undefined) => {
      onHightLightInterceptor?.(_interceptor);
    },
  );

  return (
    <Flex gap="2" wrap="wrap">
      <Flex direction="column" gap="2">
        <PatternsControl
          interceptor={interceptor}
          patterns={patterns}
          onPatternsChange={(value) => {
            onPatternsChange(value);
            onHightLight({
              ...interceptor,
              patterns: parsePatterns(value),
            });
          }}
          onSave={() => {
            onChange?.({
              ...interceptor,
              patterns: parsePatterns(patterns),
            });
            onHightLight(undefined);
          }}
        />
      </Flex>
      {canChangeExpression && (
        <Flex flexGrow="1" overflow="hidden" gap="1" direction="column">
          <Flex align="center" gap="1">
            <Flex align="center" gap="1">
              <Text size="2" as="label">
                Expression
              </Text>
              <Tooltip
                minWidth="400px"
                content={
                  <Flex direction="column" gap="1">
                    <Flex asChild direction="column" gap="1">
                      <ul className={TooltipStyles.ContentList}>
                        <li>
                          <Text size="2">
                            Write any valid javascript code to return target
                            value
                          </Text>
                        </li>
                        <li>
                          <Text size="2">
                            Even{" "}
                            <Code variant="solid" color="yellow">
                              throw
                            </Code>{" "}
                            and{" "}
                            <Code variant="solid" color="yellow">
                              debugger
                            </Code>{" "}
                            are available
                          </Text>
                        </li>
                        <li>
                          <Text size="2">
                            Return{" "}
                            <Code variant="solid" color="yellow">
                              ctx.bypass
                            </Code>{" "}
                            to skip current interceptor
                          </Text>
                        </li>
                        <li>
                          <Text size="2">
                            Press <Kbd size="1">Ctrl + S</Kbd> to save changes
                          </Text>
                        </li>
                      </ul>
                    </Flex>
                    <Flex direction="column" gap="1" pb="1">
                      <Text size="2" weight="bold">
                        Types Definition
                      </Text>
                      <Suspense
                        fallback={
                          <Flex direction="column" gap="1">
                            <Skeleton height="18px" />
                          </Flex>
                        }
                      >
                        <ExpressionCodeBlock
                          code={ExpressionTypeDefinition}
                          readOnly
                          language="ts"
                        />
                      </Suspense>
                    </Flex>
                  </Flex>
                }
              >
                <ButtonIcon>
                  <InfoIcon size="medium" />
                </ButtonIcon>
              </Tooltip>
            </Flex>
            {hasChanges && (
              <SaveButtons
                onSave={() => onChange?.({ ...interceptor, data })}
                onDiscard={discardChanges}
              />
            )}
          </Flex>
          <Suspense
            fallback={
              <Flex direction="column" gap="1">
                <Skeleton height="18px" />
                <Skeleton height="18px" />
                <Skeleton height="18px" />
              </Flex>
            }
          >
            <ExpressionCodeBlockContainer
              codeBefore="(key: string, value: T, ctx: Context) => {"
              codeAfter="}"
              language="ts"
            >
              <ExpressionCodeBlock
                key={updatesCount}
                code={initialData?.expression ?? ""}
                onUpdate={onCodeUpdate}
                readOnly={!interceptor.enabled}
                onSave={() =>
                  hasChanges && onChange?.({ ...interceptor, data })
                }
                showBorders={false}
              />
            </ExpressionCodeBlockContainer>
          </Suspense>
          {expressionError && (
            <Text size="2" color="red">
              {expressionError}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  );
}
