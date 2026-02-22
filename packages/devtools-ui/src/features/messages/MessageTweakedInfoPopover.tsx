import { HoverCard, DataList, Badge, Text } from "@radix-ui/themes";
import { ButtonIcon } from "../../components/ButtonIcon";
import { MoreInfoIcon } from "@devtools-ds/icon";
import styled from "@emotion/styled";
import { PluginMessages } from "@tweaker/extension-plugin";
import { HoverCardContent } from "../../components/base/HoverCardContent";
import type { InterceptorId } from "@tweaker/core";

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
}: {
  id?: string;
  interceptorId?: InterceptorId;
}) {
  return (
    <DataList.Root>
      {id && (
        <DataList.Item align="center">
          <DataListLabel>Message ID</DataListLabel>
          <DataListValue>
            <Badge>
              <Text size="1" weight="bold">
                {id}
              </Text>
            </Badge>
          </DataListValue>
        </DataList.Item>
      )}
      {interceptorId && (
        <DataList.Item align="center">
          <DataListLabel>Interceptor ID</DataListLabel>
          <DataListValue>
            <Badge color="cyan">
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

export function MessageTweakedInfoPopover({
  message,
}: {
  message: PluginMessages.ValueMessage["payload"];
}) {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <ButtonIcon cursor="default">
          <MoreInfoIcon size="medium" />
        </ButtonIcon>
      </HoverCard.Trigger>
      <HoverCardContent maxWidth="300px">
        <MessageTweakedInfo
          interceptorId={message.interceptorId}
          id={message.id}
        />
      </HoverCardContent>
    </HoverCard.Root>
  );
}
