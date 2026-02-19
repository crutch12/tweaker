import { HoverCard, DataList, Badge, Text } from "@radix-ui/themes";
import { ButtonIcon } from "../../components/ButtonIcon";
import { MoreInfoIcon } from "@devtools-ds/icon";
import styled from "@emotion/styled";
import { PluginMessages } from "@tweaker/extension-plugin";
import { HoverCardContent } from "../../components/base/HoverCardContent";

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
  interceptorId,
}: {
  interceptorId?: string | number;
}) {
  return (
    <DataList.Root>
      {interceptorId && (
        <DataList.Item align="center">
          <DataListLabel>Interceptor ID</DataListLabel>
          <DataListValue>
            <Badge>
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
        <ButtonIcon>
          <MoreInfoIcon size="medium" />
        </ButtonIcon>
      </HoverCard.Trigger>
      <HoverCardContent maxWidth="300px">
        <MessageTweakedInfo interceptorId={message.interceptorId} />
      </HoverCardContent>
    </HoverCard.Root>
  );
}
