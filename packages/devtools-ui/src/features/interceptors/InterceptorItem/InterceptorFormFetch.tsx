import {
  Box,
  BoxProps,
  Button,
  Code,
  Flex,
  FlexProps,
  Kbd,
  Select,
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
import { EXTENSION_OWNER } from "@tweaker/extension-plugin";
import { parsePatterns, serializePatterns } from "../../../utils/pattern";
import { css } from "@emotion/css";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isJsSyntaxValid } from "../../../utils/isJsSyntaxValid";
import { SelectContent } from "../../../components/base/SelectContent";

const ExpressionCodeBlock = lazy(() =>
  import("../ExpressionCodeBlock").then((r) => ({
    default: r.ExpressionCodeBlock,
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
  "TRACE",
  "CONNECT",
];

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
          <Select.Item value="TRACE">TRACE</Select.Item>
          <Select.Item value="CONNECT">CONNECT</Select.Item>
        </Select.Group>
        <Select.Separator />
      </SelectContent>
    </Select.Root>
  );
}

function FetchResponseBodySelect(props: Select.RootProps) {
  return (
    <Select.Root defaultValue="json" {...props}>
      <Select.Trigger />
      <SelectContent>
        <Select.Group>
          <Select.Item value="json">JSON</Select.Item>
          <Select.Item value="text">Text</Select.Item>
          <Select.Item value="blob">Blob</Select.Item>
          <Select.Item value="formData">Form Data</Select.Item>
          <Select.Item value="arrayBuffer">Array Buffer</Select.Item>
        </Select.Group>
      </SelectContent>
    </Select.Root>
  );
}

export interface InterceptorFormFetchProps extends InterceptorItemProps {
  data: ExtensionInterceptor["data"];
  setData: Dispatch<SetStateAction<ExtensionInterceptor["data"]>>;
  patterns: string;
  setPatterns: Dispatch<SetStateAction<string>>;
  hasChanges: boolean;
}

export function InterceptorFormFetch({
  interceptor,
  onChange,
  onHightLightInterceptor,
  data,
  setData,
  patterns,
  setPatterns,
  hasChanges,
}: InterceptorFormFetchProps) {
  const [initialData, setInitialData] = useState(() => interceptor.data);

  const [method, setMethod] = useState(() => patternsToState(patterns).method);
  const [bodyType, setBodyType] = useState("json");

  const actualizeCodeExpression = useEffectEvent((force: boolean) => {
    if (
      force ||
      interceptor.data?.[bodyType]?.static !== data?.[bodyType]?.static
    ) {
      setUpdatesCount((v) => v + 1);
      setInitialData(interceptor.data);
      setData(interceptor.data);
    }
  });

  useEffect(() => {
    actualizeCodeExpression(false);
  }, [interceptor.data?.[bodyType]?.static]);

  const [updatesCount, setUpdatesCount] = useState(0);

  const discardChanges = useCallback(() => {
    actualizeCodeExpression(true);
  }, []);

  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

  const patternsError = useMemo(() => {
    return patterns.trim().length === 0;
  }, [patterns]);

  const onHightLight = useEffectEvent(
    (interceptor: ExtensionInterceptor | undefined) => {
      onHightLightInterceptor?.(interceptor);
    },
  );

  const [urlPatterns, setUrlPatterns] = useState(
    () => patternsToState(patterns).patterns,
  );

  useEffect(() => {
    setUrlPatterns(patternsToState(patterns).patterns);
  }, [patterns]);

  const onCodeUpdate = useCallback(
    (code: string) => {
      setData((v) => ({
        ...v,
        [bodyType]: {
          static: code,
        },
      }));
    },
    [bodyType],
  );

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
      if (!data?.[bodyType]?.static) return { valid: true, error: undefined };
      const value = data?.[bodyType].static;
      try {
        JSON.parse(value);
        return { valid: true, error: undefined };
      } catch (error) {
        return { valid: false, error: error as Error };
      }
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
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1">
            <Text size="2" as="label" htmlFor={`${uniqueId}-url-patterns`}>
              Url patterns
            </Text>
            <Tooltip
              content={
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
            id={`${uniqueId}-url-patterns`}
            type="text"
            placeholder="Fetch Patterns"
            value={urlPatterns}
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
              setUrlPatterns(ev.target.value);
              onHightLight({
                ...interceptor,
                patterns: urlPatternsToPatterns(method, ev.target.value),
              });
            }}
            onBlur={() => {
              serializePatterns(interceptor.patterns) !==
                serializePatterns(urlPatternsToPatterns(method, urlPatterns)) &&
                onChange?.({
                  ...interceptor,
                  patterns: urlPatternsToPatterns(method, urlPatterns),
                });
              onHightLight(undefined);
            }}
            className={css`
              width: 250px;
            `}
          />
        </Flex>
      </Flex>
      <Flex flexGrow="1" overflow="hidden" gap="1" direction="column">
        <Flex align="center" gap="1">
          <Flex align="center" gap="1">
            <Text size="2" as="label">
              Mock Response
            </Text>
            <FetchResponseBodySelect
              value={bodyType}
              onValueChange={setBodyType}
            />
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
          <ExpressionCodeBlock
            language="json"
            key={updatesCount}
            code={initialData?.[bodyType]?.static ?? ""}
            onUpdate={onCodeUpdate}
            readOnly={!interceptor.enabled}
            onSave={() => hasChanges && onChange?.({ ...interceptor, data })}
          />
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
