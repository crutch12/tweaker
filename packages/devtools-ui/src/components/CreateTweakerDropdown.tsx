import { DropdownMenu, Text, Flex, Button } from "@radix-ui/themes";
import { getTextColor } from "../utils/colors";
import { DropdownMenuContent } from "./base/DropdownMenuContent";
import { css } from "@emotion/css";

export interface CreateTweakerDropdownProps {
  names: string[];
  onCreate?: (name: string) => void;
}

export function CreateTweakerDropdown({
  names,
  onCreate,
}: CreateTweakerDropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={!names.length}>
        <Button size="1" radius="large" color="indigo" disabled={!names.length}>
          <Flex gap="1" align="center">
            New interceptor
            <DropdownMenu.TriggerIcon />
          </Flex>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenuContent variant="soft">
        {names.map((name) => (
          <DropdownMenu.Item
            shortcut="Create"
            key={name}
            onClick={() => onCreate?.(name)}
          >
            <Text
              size="3"
              weight="bold"
              className={css`
                color: ${getTextColor(name)};
              `}
            >
              {name}
            </Text>
          </DropdownMenu.Item>
        ))}
      </DropdownMenuContent>
    </DropdownMenu.Root>
  );
}
