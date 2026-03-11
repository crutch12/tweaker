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
import { EXTENSION_OWNER, InterceptorPayload } from "@tweaker/extension-plugin";
import { parsePatterns, serializePatterns } from "../../../utils/pattern";
import { css } from "@emotion/css";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isJsSyntaxValid } from "../../../utils/isJsSyntaxValid";
import { DefaultInterceptor } from "@tweaker/core";

export interface DefaultInterceptorFormProps extends InterceptorItemProps<
  InterceptorPayload<DefaultInterceptor>
> {
  patterns: string;
  setPatterns: Dispatch<SetStateAction<string>>;
  hasChanges: boolean;
}

export function DefaultInterceptorForm({
  interceptor,
  onChange,
  onHightLightInterceptor,
  patterns,
  setPatterns,
  hasChanges,
}: DefaultInterceptorFormProps) {
  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

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
    </Flex>
  );
}
