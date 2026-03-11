import { Flex, IconButton, TextField } from "@radix-ui/themes";
import { ButtonIcon } from "../../components/ButtonIcon";
import { ClearIcon } from "../../icons/ClearIcon";
import { parsePatterns, serializePatterns } from "../../utils/pattern";
import { ConsoleErrorIcon } from "@devtools-ds/icon";
import { css } from "@emotion/css";

export interface MessagesHeaderProps {
  filterPatterns?: string | undefined;
  onFilterPatternsChange?: (value: string | undefined) => void;
  onClearMessages?: () => void;
}

export function MessagesHeader({
  filterPatterns,
  onFilterPatternsChange,
  onClearMessages,
}: MessagesHeaderProps) {
  return (
    <Flex gap="1" align="center" wrap="wrap" p="1">
      <ButtonIcon title="Clear Messages" onClick={onClearMessages}>
        <ClearIcon size="medium" />
      </ButtonIcon>
      <TextField.Root
        size="1"
        radius="full"
        placeholder="Filter messages by key (glob, e.g. *.*)"
        color={filterPatterns ? "blue" : undefined}
        variant="soft"
        className={css`
          width: 230px;
        `}
        type="text"
        value={filterPatterns ?? ""}
        onChange={(ev) => onFilterPatternsChange?.(ev.target.value)}
        onBlur={(ev) => {
          onFilterPatternsChange?.(
            serializePatterns(parsePatterns(ev.target.value)),
          );
        }}
      >
        <TextField.Slot />
        {filterPatterns && (
          <TextField.Slot>
            <IconButton
              onClick={() => onFilterPatternsChange?.(undefined)}
              size="1"
              variant="ghost"
            >
              <ConsoleErrorIcon height="14" width="14" />
            </IconButton>
          </TextField.Slot>
        )}
      </TextField.Root>
    </Flex>
  );
}
