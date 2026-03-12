import { Flex } from "@radix-ui/themes";
import { InterceptorItemProps } from "../InterceptorItem";
import { Dispatch, SetStateAction, useEffectEvent, useMemo } from "react";
import { InterceptorPayload } from "@tweaker/extension-plugin";
import { parsePatterns, serializePatterns } from "../../../../utils/pattern";
import { DefaultInterceptor } from "@tweaker/core";
import { PatternsControl } from "../controls/PatternsControl";

export interface InterceptorItemDefaultFormProps extends InterceptorItemProps<
  InterceptorPayload<DefaultInterceptor>
> {
  patterns: string;
  onPatternsChange: (value: string) => void;
}

export function DefaultInterceptorForm({
  interceptor,
  onChange,
  onHightLightInterceptor,
  patterns,
  onPatternsChange,
}: InterceptorItemDefaultFormProps) {
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
    </Flex>
  );
}
