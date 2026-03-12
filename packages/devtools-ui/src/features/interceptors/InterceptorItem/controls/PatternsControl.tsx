import { Code, Flex, Text, TextField } from "@radix-ui/themes";
import { Tooltip, TooltipStyles } from "../../../../components/base/Tooltip";
import { ButtonIcon } from "../../../../components/ButtonIcon";
import { InfoIcon } from "@devtools-ds/icon";
import { css } from "@emotion/css";
import { InterceptorPayload } from "@tweaker/extension-plugin";
import { ReactNode, useMemo } from "react";
import { parsePatterns, serializePatterns } from "../../../../utils/pattern";

export interface PatternsControlProps {
  interceptor: InterceptorPayload;
  patterns: string;
  onPatternsChange: (value: string) => void;
  onSave: () => void;
  label?: ReactNode;
  tooltipContent?: ReactNode;
}

export function PatternsControl({
  interceptor,
  patterns,
  onPatternsChange,
  onSave,
  label,
  tooltipContent,
}: PatternsControlProps) {
  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

  const patternsError = useMemo(() => {
    return patterns.trim().length === 0;
  }, [patterns]);

  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="1">
        <Text size="2" as="label" htmlFor={`${uniqueId}-patterns`}>
          {label ?? "Patterns"}
        </Text>
        <Tooltip
          content={
            tooltipContent ?? (
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
            )
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
          onPatternsChange(ev.target.value);
        }}
        onBlur={() => {
          serializePatterns(interceptor.patterns) !==
            serializePatterns(parsePatterns(patterns)) && onSave();
        }}
        className={css`
          width: 250px;
        `}
      />
    </Flex>
  );
}
