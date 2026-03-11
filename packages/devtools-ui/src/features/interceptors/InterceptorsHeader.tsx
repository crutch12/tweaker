import { Flex, IconButton, TextField } from "@radix-ui/themes";
import { ButtonIcon } from "../../components/ButtonIcon";
import { ClearIcon } from "../../icons/ClearIcon";
import { css } from "@emotion/css";
import { ComponentBooleanIcon } from "@radix-ui/react-icons";
import { ConsoleErrorIcon } from "@devtools-ds/icon";
import {
  CreateTweakerDropdown,
  CreateTweakerDropdownProps,
} from "../../components/CreateTweakerDropdown";
import { ExtensionInterceptor } from "./InterceptorItem/InterceptorItem";

export interface InterceptorsHeaderProps {
  interceptors: ExtensionInterceptor[];
  onToggleInterceptors?: () => void;
  onClearInterceptors?: () => void;
  interceptorsFilter?: string | undefined;
  onInterceptorsFilterChange?: (value: string | undefined) => void;
  appNames: string[];
  onInterceptorCreate?: CreateTweakerDropdownProps["onCreate"];
}

export function InterceptorsHeader({
  interceptors,
  onToggleInterceptors,
  onClearInterceptors,
  interceptorsFilter,
  onInterceptorsFilterChange,
  appNames,
  onInterceptorCreate,
}: InterceptorsHeaderProps) {
  return (
    <Flex
      gap="1"
      p="1"
      align="center"
      wrap="wrap"
      className={css`
        border-bottom: 1px solid var(--gray-a6);
      `}
    >
      <ButtonIcon title="Clear Interceptors" onClick={onClearInterceptors}>
        <ClearIcon size="medium" />
      </ButtonIcon>
      <ButtonIcon
        title="Toggle Interceptors"
        disabled={interceptors.length === 0}
        onClick={onToggleInterceptors}
      >
        <ComponentBooleanIcon />
      </ButtonIcon>
      <TextField.Root
        size="1"
        radius="full"
        placeholder="Filter interceptors by id/name/patterns"
        color={interceptorsFilter ? "blue" : undefined}
        variant="soft"
        className={css`
          width: 230px;
        `}
        type="text"
        value={interceptorsFilter ?? ""}
        onChange={(ev) => onInterceptorsFilterChange?.(ev.target.value)}
      >
        <TextField.Slot />
        {interceptorsFilter && (
          <TextField.Slot>
            <IconButton
              onClick={() => onInterceptorsFilterChange?.(undefined)}
              size="1"
              variant="ghost"
            >
              <ConsoleErrorIcon height="14" width="14" />
            </IconButton>
          </TextField.Slot>
        )}
      </TextField.Root>
      {appNames.length > 0 && (
        <CreateTweakerDropdown
          names={appNames}
          onCreate={onInterceptorCreate}
        />
      )}
    </Flex>
  );
}
