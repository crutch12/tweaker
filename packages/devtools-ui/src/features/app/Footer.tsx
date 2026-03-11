import { css } from "@emotion/css";
import { Badge, Flex, Separator, Text } from "@radix-ui/themes";
import { ExtensionPluginMessages } from "@tweaker/extension-plugin";
import { useMemo } from "react";
import { ExtensionInterceptor } from "../interceptors/InterceptorItem/InterceptorItem";
import { useDevtools } from "../devtools/DevtoolsProvider";

export interface FooterProps {
  connected: boolean;
  messages: ExtensionPluginMessages.ValueMessage["payload"][];
  interceptors: ExtensionInterceptor[];
}

export function Footer({ connected, messages, interceptors }: FooterProps) {
  const tweakedMessages = useMemo(
    () => messages.filter((x) => x.tweaked),
    [messages],
  );

  const activeInterceptors = useMemo(
    () => interceptors.filter((x) => x.enabled),
    [interceptors],
  );

  const { url } = useDevtools();

  const host = useMemo(() => {
    if (url) return new URL(url).host;
    return undefined;
  }, []);

  return (
    <Flex
      gap="2"
      align="center"
      justify="between"
      wrap="wrap"
      py="1"
      px="2"
      className={css`
        border-top: 1px solid var(--gray-a6);
      `}
    >
      <Flex gap="2">
        <Flex gap="1" align="center">
          <Badge
            color={connected ? "green" : "gray"}
            variant="solid"
            radius="full"
            style={{ padding: 0, width: "8px", height: "8px" }}
          />
          <Text size="1" color="gray">
            {connected ? "Connected" : "Not connected"}
          </Text>
        </Flex>
        <Separator orientation="vertical" />
        <Flex gap="1">
          <Text size="1" color="gray">
            Logs:{" "}
          </Text>
          <Text size="1" color="gray" weight="bold">
            {tweakedMessages.length}/{messages.length} tweaked
          </Text>
        </Flex>
        <Separator orientation="vertical" />
        <Flex gap="1">
          <Text size="1" color="gray">
            Interceptors:{" "}
          </Text>
          <Text size="1" color="gray" weight="bold">
            {activeInterceptors.length}/{interceptors.length} active
          </Text>
        </Flex>
      </Flex>
      {host && (
        <Flex gap="2">
          <Flex gap="1">
            <Text size="1" color="gray">
              HOST:{" "}
            </Text>
            <Text size="1" color="gray" weight="bold">
              {host}
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
