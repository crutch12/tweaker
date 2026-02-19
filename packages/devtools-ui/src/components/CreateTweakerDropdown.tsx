import { DropdownMenu, Text, Flex } from "@radix-ui/themes";
import { BlueButton } from "./BlueButton";
import { getTextColor } from "../utils/colors";
import { DropdownMenuContent } from "./base/DropdownMenuContent";

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
        <BlueButton disabled={!names.length}>
          <Flex gap="1" align="center">
            Create interceptor
            <DropdownMenu.TriggerIcon />
          </Flex>
        </BlueButton>
      </DropdownMenu.Trigger>
      <DropdownMenuContent variant="soft">
        {names.map((name) => (
          <DropdownMenu.Item
            shortcut="Create"
            key={name}
            onClick={() => onCreate?.(name)}
          >
            <Text size="3" weight="bold" style={{ color: getTextColor(name) }}>
              {name}
            </Text>
          </DropdownMenu.Item>
        ))}
      </DropdownMenuContent>
    </DropdownMenu.Root>
  );
}
