import { css } from "@emotion/css";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EXTENSION_OWNER, InterceptorPayload } from "@tweaker/extension-plugin";
import { getTextColor } from "../../utils/colors";
import equal from "fast-deep-equal";
import { Badge } from "../../components/Badge";
import { DeleteIcon, SelectIcon, ExportIcon } from "@devtools-ds/icon";
import { ButtonIcon } from "../../components/ButtonIcon";
import { isJsSyntaxValid } from "../../utils/isJsSyntaxValid";
import { useQuery } from "@tanstack/react-query";
import { parsePatterns, serializePatterns } from "../../utils/pattern";
import { InfoIcon } from "@devtools-ds/icon";
import {
  Tooltip,
  Text,
  Code,
  Skeleton,
  Flex,
  Box,
  TextField,
  Checkbox,
  Badge as RadixBadge,
} from "@radix-ui/themes";

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
  });

  const [patterns, setPatterns] = useState(() =>
    serializePatterns(interceptor.patterns),
  );

  const readOnly = interceptor.owner !== EXTENSION_OWNER;

  useEffect(() => {
    setExpression(interceptor.expression);
  }, [interceptor.expression]);

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
    setExpression(interceptor.expression);
    setUpdatesCount((c) => c + 1);
  }, [interceptor]);

  const appColor = getTextColor(interceptor.name);

  return (
    <Flex
      onMouseEnter={() =>
        onHightLightInterceptor?.({
          ...interceptor,
          patterns: parsePatterns(patterns),
        })
      }
      onMouseLeave={() => onHightLightInterceptor?.(undefined)}
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
            inset -1px -1px 2px ${appColor};
        }
      `}
    >
      <Flex gap="2" align="center">
        <Checkbox
          disabled={readOnly}
          checked={interceptor.enabled}
          onCheckedChange={(checked) => {
            onChange?.({
              ...interceptor,
              enabled: Boolean(checked),
            });
          }}
        />
        <Text
          weight="bold"
          size="3"
          style={{
            color: appColor,
          }}
        >
          {interceptor.name}
        </Text>
        <ButtonIcon
          title="Remove interceptor"
          disabled={readOnly}
          onClick={() => onRemove?.(interceptor)}
        >
          <DeleteIcon size="medium" />
        </ButtonIcon>
        {onFilterMessages && (
          <ButtonIcon
            disabled={parsePatterns(patterns).length === 0}
            title="Filter messages"
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
        <RadixBadge title={new Date(interceptor.timestamp).toLocaleString()}>
          {interceptor.id}
        </RadixBadge>
      </Flex>
      <Flex gap="2">
        <Flex direction="column" gap="2">
          <Flex direction="column">
            <Flex align="center" gap="1">
              <Text size="2" as="label">
                Patterns
              </Text>
              <Tooltip
                content={
                  <Text size="2">
                    Write any valid glob (e.g.{" "}
                    <Code variant="solid" color="yellow">
                      *.*
                    </Code>
                    ), separate multiple globs via{" "}
                    <Code variant="solid" color="yellow">
                      ,
                    </Code>
                  </Text>
                }
              >
                <ButtonIcon>
                  <InfoIcon size="medium" />
                </ButtonIcon>
              </Tooltip>
            </Flex>
            <TextField.Root
              type="text"
              placeholder="Patterns"
              value={patterns}
              disabled={readOnly || !interceptor.enabled}
              onChange={(ev) => {
                setPatterns(ev.target.value);
                onHightLightInterceptor?.({
                  ...interceptor,
                  patterns: parsePatterns(ev.target.value),
                });
              }}
              onBlur={() => {
                onChange?.({
                  ...interceptor,
                  patterns: parsePatterns(patterns),
                });
                onHightLightInterceptor?.(undefined);
              }}
            ></TextField.Root>
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox
              checked={interceptor.interactive}
              disabled={readOnly || !interceptor.enabled}
              onCheckedChange={(checked) => {
                onChange?.({
                  ...interceptor,
                  interactive: Boolean(checked),
                });
              }}
            />
            <Flex gap="1" align="center">
              <Text size="2">Interactive</Text>
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
        {!readOnly && (
          <Box flexGrow="1">
            <Flex align="center" gap="1">
              <Flex align="center" gap="1">
                <Text size="2" as="label">
                  Expression
                </Text>
                <Tooltip
                  content={
                    <Text size="2">
                      Write any valid javascript code (even{" "}
                      <Code variant="solid" color="yellow">
                        throw
                      </Code>{" "}
                      and{" "}
                      <Code variant="solid" color="yellow">
                        debugger
                      </Code>
                      ) to return target value
                    </Text>
                  }
                >
                  <ButtonIcon>
                    <InfoIcon size="medium" />
                  </ButtonIcon>
                </Tooltip>
              </Flex>
              {!readOnly && hasChanges && (
                <button
                  onClick={() => onChange?.({ ...interceptor, expression })}
                >
                  Save changes
                </button>
              )}
              {!readOnly && hasChanges && (
                <button onClick={discardChanges}>Discard changes</button>
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
                codeBefore="(key: string, value: any) => {"
                codeAfter="}"
                language="ts"
              >
                <ExpressionCodeBlock
                  key={updatesCount}
                  code={interceptor.expression ?? ""}
                  onUpdate={onCodeUpdate}
                  readOnly={!interceptor.enabled}
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
        appearance={readOnly ? "secondary" : "primary"}
      >
        {interceptor.owner}
      </Badge>
      {hasChanges && (
        <Badge position="top-right" appearance="warn">
          *
        </Badge>
      )}
    </Flex>
  );
}
