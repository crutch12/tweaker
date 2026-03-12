import { Button, Flex } from "@radix-ui/themes";

export interface SaveButtonsProps {
  onSave: () => void;
  onDiscard?: () => void;
}

export function SaveButtons({ onSave, onDiscard }: SaveButtonsProps) {
  return (
    <Flex gap="1">
      <Button size="1" radius="large" color="indigo" onClick={onSave}>
        Save
      </Button>
      {onDiscard && (
        <Button
          size="1"
          radius="large"
          color="orange"
          variant="soft"
          onClick={onDiscard}
        >
          Discard
        </Button>
      )}
    </Flex>
  );
}
