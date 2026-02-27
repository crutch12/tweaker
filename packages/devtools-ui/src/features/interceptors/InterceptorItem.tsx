import { css, keyframes } from "@emotion/css";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { EXTENSION_OWNER, InterceptorPayload } from "@tweaker/extension-plugin";
import { getTextColor } from "../../utils/colors";
import equal from "fast-deep-equal";
import { Badge } from "../../components/Badge";
import { DeleteIcon, SelectIcon, ExportIcon } from "@devtools-ds/icon";
import { ButtonIcon } from "../../components/ButtonIcon";
import { isJsSyntaxValid } from "../../utils/isJsSyntaxValid";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { parsePatterns, serializePatterns } from "../../utils/pattern";
import { InfoIcon } from "@devtools-ds/icon";
import {
  Text,
  Code,
  Skeleton,
  Flex,
  Box,
  TextField,
  Checkbox,
  Badge as RadixBadge,
  Kbd,
} from "@radix-ui/themes";
import { BlueButton } from "../../components/BlueButton";
import { SourceCodePopover } from "../../components/SourceCodePopover";
import { CSSTransition } from "react-transition-group";
import { Tooltip } from "../../components/base/Tooltip";

const ExpressionCodeBlock = lazy(() =>
  import("./ExpressionCodeBlock").then((r) => ({
    default: r.ExpressionCodeBlock,
  })),
);
const ExpressionCodeBlockContainer = lazy(() =>
  import("./ExpressionCodeBlock").then((r) => ({
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

export type ExtensionInterceptor = InterceptorPayload<unknown> & {
  // sampleIds?: string[];
  // fromKey?: string;
  // sampleId?: string;
};

export interface InterceptorItemProps {
  interceptor: ExtensionInterceptor;
  onChange?: (interceptor: ExtensionInterceptor) => void;
  onRemove?: (interceptor: ExtensionInterceptor) => void;
  onFilterMessages?: (patterns: string[]) => void;
  onDuplicate?: (interceptor: ExtensionInterceptor) => void;
  onHightLightInterceptor?: (
    interceptor: ExtensionInterceptor | undefined,
  ) => void;
}

export function InterceptorItem({
  interceptor,
  onChange,
  onRemove,
  onFilterMessages,
  onDuplicate,
  onHightLightInterceptor,
}: InterceptorItemProps) {
  const [expression, setExpression] = useState(() => interceptor.expression);
  const [initialExpression, setInitialExpression] = useState(
    () => interceptor.expression,
  );

  const actualizeCodeExpression = useEffectEvent((force: boolean) => {
    if (force || interceptor.expression !== expression) {
      setUpdatesCount((v) => v + 1);
      setInitialExpression(interceptor.expression);
      setExpression(interceptor.expression);
    }
  });

  useEffect(() => {
    actualizeCodeExpression(false);
  }, [interceptor.expression]);

  const { data: expressionError } = useQuery({
    queryKey: ["validateExpression", expression],
    queryFn: () => {
      if (!expression) return { valid: true, error: undefined };
      return isJsSyntaxValid("() => {\n" + expression + "\n}");
    },
    select: ({ error }) => {
      if (error) {
        return `${error.name} - ${error.message}`;
      }
      return undefined;
    },
    placeholderData: keepPreviousData,
  });

  const [patterns, setPatterns] = useState(() =>
    serializePatterns(interceptor.patterns),
  );

  const canChangeExpression = interceptor.owner === EXTENSION_OWNER;

  useEffect(() => {
    setPatterns(serializePatterns(interceptor.patterns));
  }, [interceptor.patterns]);

  const hasChanges = useMemo(() => {
    return !equal(
      {
        expression: interceptor.expression,
      },
      {
        expression,
      },
    );
  }, [expression, interceptor.expression]);

  const onCodeUpdate = useCallback((code: string) => {
    setExpression((v) => code || undefined);
  }, []);

  const [updatesCount, setUpdatesCount] = useState(0);

  const discardChanges = useCallback(() => {
    actualizeCodeExpression(true);
  }, []);

  const appColor = getTextColor(interceptor.name);

  const patternsError = useMemo(() => {
    return patterns.trim().length === 0;
  }, [patterns]);

  const onHightLight = useEffectEvent(
    (interceptor: ExtensionInterceptor | undefined) => {
      onHightLightInterceptor?.(interceptor);
    },
  );

  useEffect(() => {
    return () => {
      onHightLight(undefined);
    };
  }, []);

  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

  const nodeRef = useRef(null);

  const inAnimate = useMemo(() => {
    return Date.now() - interceptor.timestamp < 500;
  }, [interceptor.timestamp]);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={inAnimate}
      appear
      timeout={1000}
      classNames="bounce"
    >
      <Flex
        ref={nodeRef}
        onMouseEnter={() =>
          onHightLight({
            ...interceptor,
            patterns: parsePatterns(patterns),
          })
        }
        onMouseLeave={() => onHightLight(undefined)}
        direction="column"
        p="3"
        gap="2"
        position="relative"
        className={css`
          border: 1.5px solid ${appColor};
          border-radius: 10px;
          opacity: ${interceptor.enabled ? undefined : 0.6};

          :hover {
            box-shadow:
              inset 1px 1px 2px ${appColor},
              inset -1px -1px 2px ${appColor},
              var(--shadow-2);
          }
          &.bounce-appear-active {
            animation: ${bounceIn} 1s ease;
          }
        `}
      >
        <Flex gap="2" align="center" wrap="wrap">
          <Checkbox
            id={`${uniqueId}-enabled`}
            checked={interceptor.enabled}
            onCheckedChange={(checked) => {
              onChange?.({
                ...interceptor,
                enabled: Boolean(checked),
              });
            }}
          />
          <Text
            as="label"
            htmlFor={`${uniqueId}-enabled`}
            weight="bold"
            size="3"
            className={css`
              color: ${appColor};
            `}
          >
            {interceptor.name}
          </Text>
          <ButtonIcon
            title="Remove interceptor"
            onClick={() => onRemove?.(interceptor)}
          >
            <DeleteIcon size="medium" />
          </ButtonIcon>
          {onFilterMessages && (
            <ButtonIcon
              disabled={parsePatterns(patterns).length === 0}
              title={
                parsePatterns(patterns).length === 0
                  ? undefined
                  : `Filter messages by patterns "${patterns}"`
              }
              onClick={() => onFilterMessages(interceptor.patterns)}
            >
              <SelectIcon size="medium" />
            </ButtonIcon>
          )}
          {onDuplicate && (
            <ButtonIcon
              title="Duplicate interceptor"
              onClick={() => onDuplicate(interceptor)}
            >
              <ExportIcon size="medium" />
            </ButtonIcon>
          )}
          {(interceptor.sourceCode || interceptor.stack) && (
            <SourceCodePopover
              code={interceptor.sourceCode}
              stack={interceptor.stack}
              title="Show interceptor source code (formatted)"
            />
          )}
          <RadixBadge
            title={new Date(interceptor.timestamp).toLocaleString()}
            color="cyan"
          >
            <Text size="1" weight="bold">
              {interceptor.id}
            </Text>
          </RadixBadge>
        </Flex>
        <Flex gap="2" wrap="wrap">
          <Flex direction="column" gap="2">
            <Flex direction="column">
              <Flex align="center" gap="1">
                <Text size="2" as="label" htmlFor={`${uniqueId}-patterns`}>
                  Patterns
                </Text>
                <Tooltip
                  content={
                    <Flex asChild direction="column" gap="1">
                      <ul
                        className={css`
                          padding-inline-start: var(--space-4);
                          margin: 0;
                        `}
                      >
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
                onFocus={(ev) => {
                  ev.target.setSelectionRange(0, Number.MAX_SAFE_INTEGER);
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
                  width: 150px;
                `}
              />
            </Flex>
            <Flex align="center" gap="2">
              <Checkbox
                id={`${uniqueId}-interactive`}
                checked={interceptor.interactive}
                disabled={!interceptor.enabled}
                onCheckedChange={(checked) => {
                  onChange?.({
                    ...interceptor,
                    interactive: Boolean(checked),
                  });
                }}
              />
              <Flex gap="1" align="center">
                <Text as="label" htmlFor={`${uniqueId}-interactive`} size="2">
                  Interactive
                </Text>
                <Tooltip
                  content={
                    <Text size="2">
                      Stops code via{" "}
                      <Code variant="solid" color="yellow">
                        debugger
                      </Code>{" "}
                      before result return
                    </Text>
                  }
                >
                  <ButtonIcon>
                    <InfoIcon size="medium" />
                  </ButtonIcon>
                </Tooltip>
              </Flex>
            </Flex>
          </Flex>
          {canChangeExpression && (
            <Box flexGrow="1" overflow="hidden">
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
                          <ul
                            className={css`
                              padding-inline-start: var(--space-4);
                              margin: 0;
                            `}
                          >
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
                                Press <Kbd size="1">Ctrl + S</Kbd> to save
                                changes
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
                  <BlueButton
                    onClick={() => onChange?.({ ...interceptor, expression })}
                  >
                    Save
                  </BlueButton>
                )}
                {hasChanges && (
                  <BlueButton onClick={discardChanges}>Discard</BlueButton>
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
                    code={initialExpression ?? ""}
                    onUpdate={onCodeUpdate}
                    readOnly={!interceptor.enabled}
                    onSave={() =>
                      hasChanges && onChange?.({ ...interceptor, expression })
                    }
                  />
                </ExpressionCodeBlockContainer>
              </Suspense>
              {expressionError && (
                <Text size="2" color="red">
                  {expressionError}
                </Text>
              )}
            </Box>
          )}
        </Flex>
        <Badge
          position="bottom-right"
          appearance={canChangeExpression ? "primary" : "secondary"}
        >
          {interceptor.owner}
        </Badge>
        {hasChanges && (
          <Badge position="top-right" appearance="warn">
            *
          </Badge>
        )}
      </Flex>
    </CSSTransition>
  );
}

const bounceIn = keyframes`
  from { background-color: rgba(255, 204, 102, 1); }
  to { background-color: rgba(255, 204, 102, 0); }
`;
