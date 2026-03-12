import {
  Box,
  Button,
  Code,
  Flex,
  Select,
  Skeleton,
  Text,
} from "@radix-ui/themes";
import { InterceptorItemProps } from "../InterceptorItem";
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
import { Tooltip, TooltipStyles } from "../../../../components/base/Tooltip";
import { ButtonIcon } from "../../../../components/ButtonIcon";
import { InfoIcon } from "@devtools-ds/icon";
import { InterceptorPayload } from "@tweaker/extension-plugin";
import { parsePatterns, serializePatterns } from "../../../../utils/pattern";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SelectContent } from "../../../../components/base/SelectContent";
import JSON5 from "json5";
import { FetchInterceptor, FetchResponseType } from "@tweaker/fetch-plugin";
import { PatternsControl } from "../controls/PatternsControl";
import { SaveButtons } from "../controls/SaveButtons";
import { useEditorCode } from "../useEditorCode";
import { isJsSyntaxValid } from "../../../../utils/isJsSyntaxValid";

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

const METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

function patternsToState(patterns: string) {
  const patternsArray = parsePatterns(patterns)
    .map((p) => {
      return p.replace(new RegExp(`^(${METHODS.join("|")}) `), "").trim();
    })
    .filter(Boolean);

  return {
    method: patterns.split(/\s+/)[0] || METHODS[0],
    patterns: serializePatterns(patternsArray),
  };
}

function urlPatternsToPatterns(method: string, urlPatterns: string) {
  return parsePatterns(urlPatterns).map((p) => `${method} ${p}`);
}

function FetchMethodSelect(props: Select.RootProps) {
  return (
    <Select.Root defaultValue="GET" {...props}>
      <Select.Trigger />
      <SelectContent>
        <Select.Group>
          <Select.Item value="GET">GET</Select.Item>
          <Select.Item value="POST">POST</Select.Item>
          <Select.Item value="PUT">PUT</Select.Item>
          <Select.Item value="PATCH">PATCH</Select.Item>
          <Select.Item value="DELETE">DELETE</Select.Item>
        </Select.Group>
        <Select.Separator />
        <Select.Group>
          <Select.Item value="HEAD">HEAD</Select.Item>
          <Select.Item value="OPTIONS">OPTIONS</Select.Item>
        </Select.Group>
      </SelectContent>
    </Select.Root>
  );
}

function FetchResponseBodySelect(
  props: Omit<Select.RootProps, "value" | "defaultValue" | "onValueChange"> & {
    value?: FetchResponseType;
    defaultValue?: FetchResponseType;
    onValueChange?(value: FetchResponseType): void;
  },
) {
  return (
    <Select.Root defaultValue="json" {...props}>
      <Select.Trigger />
      <SelectContent>
        <Select.Group>
          <Select.Item value="json">JSON</Select.Item>
          <Select.Item value="text">Text</Select.Item>
          <Select.Item value="expression">Expression</Select.Item>
        </Select.Group>
      </SelectContent>
    </Select.Root>
  );
}

export interface InterceptorItemFetchFormProps extends InterceptorItemProps<
  InterceptorPayload<FetchInterceptor>
> {
  data: FetchInterceptor["data"];
  onDataChange: (value: FetchInterceptor["data"]) => void;
  hasChanges: boolean;
}

export function InterceptorItemFetchForm({
  interceptor,
  onChange,
  onHightLightInterceptor,
  data,
  onDataChange,
  hasChanges,
}: InterceptorItemFetchFormProps) {
  const [bodyType, setBodyType] = useState<FetchResponseType>("json");

  const onCodeUpdate = useCallback(
    (code: string | undefined) => {
      onDataChange({
        ...data,
        [bodyType]: data?.[bodyType],
      });
    },
    [onDataChange, data, bodyType],
  );

  const { discardChanges, initialCode, updatesCount } = useEditorCode({
    initialCode: interceptor.data?.[bodyType],
    code: data?.[bodyType],
    onCodeChange: onCodeUpdate,
  });

  const [method, setMethod] = useState(
    () => patternsToState(serializePatterns(interceptor.patterns)).method,
  );

  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

  const onHightLight = useEffectEvent(
    (_interceptor: typeof interceptor | undefined) => {
      onHightLightInterceptor?.(_interceptor);
    },
  );

  const [urlPatterns, setUrlPatterns] = useState(
    () => patternsToState(serializePatterns(interceptor.patterns)).patterns,
  );

  useEffect(() => {
    setUrlPatterns(
      patternsToState(serializePatterns(interceptor.patterns)).patterns,
    );
  }, [interceptor.patterns]);

  const onMethodChange = useEffectEvent(() => {
    serializePatterns(interceptor.patterns) !==
      serializePatterns(urlPatternsToPatterns(method, urlPatterns)) &&
      onChange?.({
        ...interceptor,
        patterns: urlPatternsToPatterns(method, urlPatterns),
      });
  });

  useEffect(() => {
    onMethodChange();
  }, [method, interceptor.patterns]);

  const { data: expressionError } = useQuery({
    queryKey: ["validateFetchExpression", data?.[bodyType], bodyType],
    queryFn: () => {
      if (!data?.[bodyType]) return { valid: true, error: undefined };

      const value = data?.[bodyType];

      if (bodyType === "json") {
        try {
          JSON5.parse(value);
          return { valid: true, error: undefined };
        } catch (error) {
          return { valid: false, error: error as Error };
        }
      }

      if (bodyType === "expression") {
        return isJsSyntaxValid("async () => {\n" + value + "\n}");
      }

      return { valid: true, error: undefined };
    },
    select: ({ error }) => {
      if (error) {
        return `${error.name} - ${error.message}`;
      }
      return undefined;
    },
    placeholderData: keepPreviousData,
  });

  return (
    <Flex gap="2" direction="column">
      <Flex gap="2">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1">
            <Text size="2" as="label" htmlFor={`${uniqueId}-method`}>
              Method
            </Text>
            <Tooltip content={"HTTP Method"}>
              <ButtonIcon>
                <InfoIcon size="medium" />
              </ButtonIcon>
            </Tooltip>
          </Flex>
          <Box asChild id={`${uniqueId}-method`}>
            <FetchMethodSelect value={method} onValueChange={setMethod} />
          </Box>
        </Flex>
        <PatternsControl
          interceptor={interceptor}
          patterns={urlPatterns}
          onPatternsChange={(value) => {
            setUrlPatterns(value);

            onHightLight({
              ...interceptor,
              patterns: urlPatternsToPatterns(method, value),
            });
          }}
          onSave={() => {
            onChange?.({
              ...interceptor,
              patterns: urlPatternsToPatterns(method, urlPatterns),
            });
            onHightLight(undefined);
          }}
          label="Url Patterns"
          tooltipContent={
            <Flex asChild direction="column" gap="1">
              <ul className={TooltipStyles.ContentList}>
                <li>
                  <Text size="2">
                    Write any valid url glob (e.g.{" "}
                    <Code variant="solid" color="yellow">
                      /**
                    </Code>
                    )
                  </Text>
                </li>
                <li>
                  <Text size="2">
                    Don't add any protocol (e.g.{" "}
                    <Code variant="solid" color="yellow">
                      https://
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
        />
      </Flex>
      <Flex flexGrow="1" overflow="hidden" gap="1" direction="column">
        <Flex align="center" gap="1">
          <Flex align="center" gap="1">
            <Text size="2" as="label">
              Mock Response
            </Text>
            <FetchResponseBodySelect
              value={bodyType}
              onValueChange={(v) => {
                onDataChange(interceptor.data);
                setBodyType(v);
              }}
            />
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
          {bodyType === "expression" ? (
            <ExpressionCodeBlockContainer
              codeBefore="async (key: string, response: Response, ctx: Context) => {"
              codeAfter="}"
              language="ts"
            >
              <ExpressionCodeBlock
                key={updatesCount}
                code={initialCode ?? ""}
                onUpdate={onCodeUpdate}
                readOnly={!interceptor.enabled}
                onSave={() =>
                  hasChanges && onChange?.({ ...interceptor, data })
                }
                showBorders={false}
              />
            </ExpressionCodeBlockContainer>
          ) : (
            <ExpressionCodeBlock
              language={bodyType === "text" ? "text" : "js"}
              key={updatesCount}
              code={initialCode ?? ""}
              onUpdate={onCodeUpdate}
              readOnly={!interceptor.enabled}
              onSave={() => hasChanges && onChange?.({ ...interceptor, data })}
            />
          )}
        </Suspense>
        {expressionError && (
          <Text size="2" color="red">
            {expressionError}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
