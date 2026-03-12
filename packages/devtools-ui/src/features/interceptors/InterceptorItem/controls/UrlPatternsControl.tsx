import { Code, Flex, Text, TextField } from "@radix-ui/themes";
import { Tooltip, TooltipStyles } from "../../../../components/base/Tooltip";
import { ButtonIcon } from "../../../../components/ButtonIcon";
import { InfoIcon } from "@devtools-ds/icon";
import { css } from "@emotion/css";
import { InterceptorPayload } from "@tweaker/extension-plugin";
import { useEffect, useMemo, useState } from "react";
import { parsePatterns, serializePatterns } from "../../../../utils/pattern";

export interface PatternsControlProps {
  interceptor: InterceptorPayload;
  patterns: string;
  onPatternsChange: (value: string) => void;
  onSave: () => void;
}

export function PatternsControl({
  interceptor,
  patterns,
  onPatternsChange,
  onSave,
}: PatternsControlProps) {
  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

  const patternsError = useMemo(() => {
    return patterns.trim().length === 0;
  }, [patterns]);

  const [urlPatterns, setUrlPatterns] = useState(
    () => patternsToState(patterns).patterns,
  );

  useEffect(() => {
    setUrlPatterns(patternsToState(patterns).patterns);
  }, [patterns]);

  return (
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
                      */**
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
          onPatternsChange(ev.target.value);
          // setUrlPatterns(ev.target.value);
          // onPatternsChange(urlPatternsToPatterns(method, ev.target.value))
          // onHightLight({
          //   ...interceptor,
          //   patterns: urlPatternsToPatterns(method, ev.target.value),
          // });
        }}
        onBlur={() => {
          serializePatterns(interceptor.patterns) !==
            serializePatterns(parsePatterns(patterns)) && onSave();
          // serializePatterns(interceptor.patterns) !==
          //   serializePatterns(urlPatternsToPatterns(method, urlPatterns)) &&
          //   onChange?.({
          //     ...interceptor,
          //     patterns: urlPatternsToPatterns(method, urlPatterns),
          //   });
          // onHightLight(undefined);
        }}
        className={css`
          width: 250px;
        `}
      />
    </Flex>
  );
}
