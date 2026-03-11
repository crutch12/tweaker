import {
  Button,
  Code,
  Flex,
  Kbd,
  Skeleton,
  Text,
  TextField,
} from "@radix-ui/themes";
import { ExtensionInterceptor, InterceptorItemProps } from "./InterceptorItem";
import {
  Dispatch,
  lazy,
  SetStateAction,
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { Tooltip, TooltipStyles } from "../../../components/base/Tooltip";
import { ButtonIcon } from "../../../components/ButtonIcon";
import { InfoIcon } from "@devtools-ds/icon";
import {
  EXTENSION_OWNER,
  InterceptorPayload,
  ManualInterceptor,
} from "@tweaker/extension-plugin";
import { parsePatterns, serializePatterns } from "../../../utils/pattern";
import { css } from "@emotion/css";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isJsSyntaxValid } from "../../../utils/isJsSyntaxValid";

const ExpressionCodeBlock = lazy(() =>
  import("../ExpressionCodeBlock").then((r) => ({
    default: r.ExpressionCodeBlock,
  })),
);
const ExpressionCodeBlockContainer = lazy(() =>
  import("../ExpressionCodeBlock").then((r) => ({
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

export interface InterceptorFormManualProps extends InterceptorItemProps<
  InterceptorPayload<ManualInterceptor>
> {
  data: ManualInterceptor["data"];
  setData: Dispatch<SetStateAction<ManualInterceptor["data"]>>;
  patterns: string;
  setPatterns: Dispatch<SetStateAction<string>>;
  hasChanges: boolean;
}

export function InterceptorFormManual({
  interceptor,
  onChange,
  onHightLightInterceptor,
  data,
  setData,
  patterns,
  setPatterns,
  hasChanges,
}: InterceptorFormManualProps) {
  const [initialData, setInitialData] = useState(() => interceptor.data);

  const actualizeCodeExpression = useEffectEvent((force: boolean) => {
    if (force || interceptor.data?.expression !== data?.expression) {
      setUpdatesCount((v) => v + 1);
      setInitialData(interceptor.data);
      setData(interceptor.data);
    }
  });

  useEffect(() => {
    actualizeCodeExpression(false);
  }, [interceptor.data?.expression]);

  const onCodeUpdate = useCallback((code: string) => {
    setData((v) => ({
      ...v,
      expression: code || undefined,
    }));
  }, []);

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

  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

  const isByExtension = interceptor.owner === EXTENSION_OWNER;
  const canChangeExpression = isByExtension;

  const patternsError = useMemo(() => {
    return patterns.trim().length === 0;
  }, [patterns]);

  const onHightLight = useEffectEvent(
    (_interceptor: typeof interceptor | undefined) => {
      onHightLightInterceptor?.(_interceptor);
    },
  );

  return (
    <Flex gap="2" wrap="wrap">
      <Flex direction="column" gap="2">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1">
            <Text size="2" as="label" htmlFor={`${uniqueId}-patterns`}>
              Patterns
            </Text>
            <Tooltip
              content={
                <Flex asChild direction="column" gap="1">
                  <ul className={TooltipStyles.ContentList}>
                    <li>
                      <Text size="2">
                        Write any valid glob (e.g.{" "}
                        <Code variant="solid" color="yellow">
                          *.*
                        </Code>
                        )
                      </Text>
                    </li>
                    <li>
                      <Text size="2">
                        Separate multiple globs using{" "}
                        <Code variant="solid" color="yellow">
                          ,
                        </Code>
                      </Text>
                    </li>
                  </ul>
                </Flex>
              }
            >
              <ButtonIcon>
                <InfoIcon size="medium" />
              </ButtonIcon>
            </Tooltip>
          </Flex>
          <TextField.Root
            id={`${uniqueId}-patterns`}
            type="text"
            placeholder="Patterns"
            value={patterns}
            color={patternsError ? "red" : undefined}
            variant={patternsError ? "soft" : undefined}
            disabled={!interceptor.enabled}
            onKeyDown={(ev) => {
              if (ev.key === "Escape") {
                ev.stopPropagation();
                ev.currentTarget.blur();
              }
            }}
            onChange={(ev) => {
              setPatterns(ev.target.value);
              onHightLight({
                ...interceptor,
                patterns: parsePatterns(ev.target.value),
              });
            }}
            onBlur={() => {
              serializePatterns(interceptor.patterns) !==
                serializePatterns(parsePatterns(patterns)) &&
                onChange?.({
                  ...interceptor,
                  patterns: parsePatterns(patterns),
                });
              onHightLight(undefined);
            }}
            className={css`
              width: 250px;
            `}
          />
        </Flex>
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
              <Button
                size="1"
                radius="large"
                color="indigo"
                onClick={() => onChange?.({ ...interceptor, data })}
              >
                Save
              </Button>
            )}
            {hasChanges && (
              <Button
                size="1"
                radius="large"
                color="orange"
                variant="soft"
                onClick={discardChanges}
              >
                Discard
              </Button>
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
