import { css } from "@emotion/css";
import {
  Flex,
  Heading,
  IconButton,
  Link,
  Separator,
  Text,
} from "@radix-ui/themes";
import { version, name } from "../../../package.json";
import { BlueButton } from "../../components/BlueButton";
import { sendMessageToPlugin } from "../../utils/sendMessageToPlugin";
import { useDevtools } from "../devtools/DevtoolsProvider";
import { useColorScheme } from "../../components/theme/ColorSchemeProvider";
import { useMemo } from "react";
import {
  EnterFullScreenIcon,
  GitHubLogoIcon,
  LoopIcon,
  MoonIcon,
  ReloadIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { homepage } from "../../../../../package.json";

export function Header() {
  const reloadPage = () => {
    chrome.devtools.inspectedWindow.reload({
      ignoreCache: true, // Equivalent to Shift + F5
      userAgent: "Optional UA", // Can spoof user agents
      injectedScript: "console.log('Reloaded!')", // Runs immediately after reload
    });
  };

  const evalTweaker = () => {
    chrome.devtools.inspectedWindow.eval(
      "globalThis.__TWEAKER_DEVTOOLS_GLOBAL_HOOK__.version",
      (result) => {
        alert(result);
      },
    );
  };

  const { colorScheme, setColorScheme } = useColorScheme();

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  const date = useMemo(() => new Date(), []);

  const { tabId, reloadApp, reinstallExtension } = useDevtools();

  const extensionDevtoolsHref = useMemo(() => {
    if (typeof location === "undefined" || !tabId) return undefined;
    const url = new URL(location.href);
    url.searchParams.set("tabId", String(tabId));
    return url.href;
  }, [tabId]);

  return (
    <Flex
      gap="1"
      align="center"
      justify="between"
      wrap="wrap"
      py="1"
      px="2"
      className={css`
        border-bottom: 1px solid var(--gray-a6);
      `}
    >
      <Flex gap="2" align="center" wrap="wrap">
        <Heading size="2">Tweaker DevTools</Heading>
        <Separator orientation="vertical" size="1" />
        <Text color="gray" size="1">
          v{version} ({date.toLocaleTimeString()})
        </Text>
        {false && (
          <BlueButton onClick={reloadPage}>Reload Current Page</BlueButton>
        )}
        {false && <BlueButton onClick={evalTweaker}>Eval Tweaker</BlueButton>}
        {false && (
          <BlueButton
            onClick={() =>
              sendMessageToPlugin(
                "init",
                {
                  // name: "test",
                  timestamp: Date.now(),
                  enabled: true,
                  interceptors: [], // TODO: remove
                  // data: ["Message from extension!"],
                },
                tabId,
              )
            }
          >
            Send Message
          </BlueButton>
        )}
      </Flex>
      <Flex gap="4" align="center" wrap="wrap">
        {reinstallExtension && (
          <IconButton
            color="red"
            size="2"
            variant="ghost"
            title="Press double click to reinstall Tweaker DevTools extension"
            onDoubleClick={reinstallExtension}
          >
            <LoopIcon />
          </IconButton>
        )}
        <IconButton
          asChild
          color="gray"
          size="2"
          variant="ghost"
          title="View GitHub"
        >
          <Link color="gray" target="_blank" href={homepage}>
            <GitHubLogoIcon />
          </Link>
        </IconButton>
        {extensionDevtoolsHref && (
          <IconButton
            asChild
            color="gray"
            size="2"
            variant="ghost"
            title="Open Tweaker DevTools in separate tab"
          >
            <Link color="gray" target="_blank" href={extensionDevtoolsHref}>
              <EnterFullScreenIcon />
            </Link>
          </IconButton>
        )}
        <IconButton
          color="gray"
          size="2"
          variant="ghost"
          title="Reload Tweaker DevTools"
          onClick={reloadApp}
        >
          <ReloadIcon />
        </IconButton>
        <IconButton
          color="gray"
          size="2"
          variant="ghost"
          title="Toggle theme"
          onClick={toggleColorScheme}
        >
          {colorScheme === "dark" ? <MoonIcon /> : <SunIcon />}
        </IconButton>
      </Flex>
    </Flex>
  );
}
