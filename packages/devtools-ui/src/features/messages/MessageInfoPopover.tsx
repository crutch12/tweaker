import { HoverCard, DataList, Badge, Text } from "@radix-ui/themes";
import { ButtonIcon } from "../../components/ButtonIcon";
import { MoreInfoIcon } from "@devtools-ds/icon";
import styled from "@emotion/styled";
import { ExtensionPluginMessages } from "@tweaker/extension-plugin";
import { HoverCardContent } from "../../components/base/HoverCardContent";
import type { InterceptorId } from "@tweaker/core";
import { MessageRowProps } from "./MessageRow";
import { getColorName } from "../../utils/colors";

const DataListLabel = styled(DataList.Label)`
  &::before {
    content: "";
  }
`;

const DataListValue = styled(DataList.Value)`
  &::before {
    content: "";
  }
`;

function MessageTweakedInfo({
  id,
  interceptorId,
  type,
}: Partial<Pick<MessageRowProps["message"], "id" | "interceptorId" | "type">>) {
  return (
    <DataList.Root size="1">
      {id && (
        <DataList.Item align="center">
          <DataListLabel>Message ID</DataListLabel>
          <DataListValue>
            <Badge size="1">
              <Text size="1" weight="bold">
                {id}
              </Text>
            </Badge>
          </DataListValue>
        </DataList.Item>
      )}
      {type && (
        <DataList.Item align="center">
          <DataListLabel>Type</DataListLabel>
          <DataListValue>
            <Badge color={getColorName(type)} size="1">
              <Text size="1" weight="bold">
                {type}
              </Text>
            </Badge>
          </DataListValue>
        </DataList.Item>
      )}
      {interceptorId && (
        <DataList.Item align="center">
          <DataListLabel>Interceptor ID</DataListLabel>
          <DataListValue>
            <Badge color="cyan" size="1">
              <Text size="1" weight="bold">
                {interceptorId}
              </Text>
            </Badge>
          </DataListValue>
        </DataList.Item>
      )}
    </DataList.Root>
  );
}

export function MessageInfoPopover({
  message,
}: {
  message: ExtensionPluginMessages.ValueMessage["payload"];
}) {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <ButtonIcon cursor="default">
          <MoreInfoIcon size="small" />
        </ButtonIcon>
      </HoverCard.Trigger>
      <HoverCardContent maxWidth="300px">
        <MessageTweakedInfo {...message} />
      </HoverCardContent>
    </HoverCard.Root>
  );
}
