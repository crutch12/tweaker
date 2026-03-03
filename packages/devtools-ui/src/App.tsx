import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExtensionPluginMessages,
  EXTENSION_OWNER,
  isForDevtoolsMessage,
} from "@tweaker/extension-plugin";
import { generateNumberId } from "@tweaker/core/utils";
import type { InterceptorId } from "@tweaker/core";
import { version, name } from "../package.json";
import { useInterceptorsStore } from "./features/interceptors/useInterceptorsStore";
import { css } from "@emotion/css";
import { sendMessageToPlugin } from "./utils/sendMessageToPlugin";
import { MessagesTableContainer } from "./features/messages/MessagesTableContainer";
import { InterceptorsListContainer } from "./features/interceptors/InterceptorsListContainer";
import { parsePatterns, serializePatterns } from "./utils/pattern";
import { ButtonIcon } from "./components/ButtonIcon";
import { ClearIcon } from "./icons/ClearIcon";
import {
  Separator,
  TextField,
  IconButton,
  Flex,
  Grid,
  Heading,
  Text,
  Link,
} from "@radix-ui/themes";
import { ConsoleErrorIcon } from "@devtools-ds/icon";
import { BlueButton } from "./components/BlueButton";
import { ExtensionInterceptor } from "./features/interceptors/InterceptorItem";
import { CreateTweakerDropdown } from "./components/CreateTweakerDropdown";
import { Container, Runtime } from "./utils/styles";
import { useResizeDivider } from "./components/ResizeDivider/useResizeDivider";
import { getDefaultExpression } from "./utils/expressions";
import { ResizeDivider } from "./components/ResizeDivider/ResizeDivider";
import { useColorScheme } from "./components/theme/ColorSchemeProvider";
import {
  SunIcon,
  MoonIcon,
  ReloadIcon,
  GitHubLogoIcon,
  EnterFullScreenIcon,
  ComponentBooleanIcon,
} from "@radix-ui/react-icons";
import { homepage } from "../../../package.json";
import { useDevtools } from "./features/devtools/DevtoolsProvider";
import { useMessagesStore } from "./features/messages/useMessagesStore";
import { groupBy } from "./utils/groupBy";
import { useInterceptedCountsStore } from "./features/interceptors/useInterceptedCountsStore";

export function App() {
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

  const interceptors = useInterceptorsStore((state) => state.interceptors);
  const addInterceptors = useInterceptorsStore((state) => state.add);
  const setInterceptors = useInterceptorsStore((state) => state.set);
  const updateInterceptor = useInterceptorsStore((state) => state.update);
  const removeInterceptors = useInterceptorsStore((state) => state.remove);

  const messages = useMessagesStore((state) => state.messages);
  const addMessasges = useMessagesStore((state) => state.add);
  const setMessages = useMessagesStore((state) => state.set);

  const setInterceptedCounts = useInterceptedCountsStore((state) => state.set);

  const appNames = useMemo(() => {
    if (interceptors.length === 0 && messages.length === 0) return [];
    return Array.from(
      new Set([
        ...messages.map((x) => x.name),
        ...interceptors.map((x) => x.name),
      ]).values(),
    );
  }, [interceptors, messages]);

  const [filterPatterns, setFilterPatterns] = useState<string | undefined>(
    undefined,
  );

  const deferredFilterPatterns = useDeferredValue(filterPatterns);

  const [interceptorsFilter, setInterceptorsFilter] = useState<
    string | undefined
  >(undefined);

  const deferredInterceptorsFilter = useDeferredValue(interceptorsFilter);

  const [highlightedInterceptorMessages, setHighlightedInterceptorMessages] =
    useState<ExtensionInterceptor | undefined>(undefined);

  const onFilterMessages = useCallback((pattenrs: string[] | undefined) => {
    setFilterPatterns(pattenrs ? serializePatterns(pattenrs) : undefined);
  }, []);

  useEffect(() => {
    chrome.storage.session
      .get<{
        messages: ExtensionPluginMessages.ValueMessage[];
      }>({ messages: [] })
      .then((result) => {
        addMessasges(result.messages.map((x) => x.payload));
      });
  }, []);

  const { tabId, reloadApp } = useDevtools();

  const extensionDevtoolsHref = useMemo(() => {
    if (typeof location === "undefined" || !tabId) return undefined;
    const url = new URL(location.href);
    url.searchParams.set("tabId", String(tabId));
    return url.href;
  }, [tabId]);

  useEffect(() => {
    sendMessageToPlugin(
      "ping",
      {
        timestamp: Date.now(),
      },
      tabId,
    );
  }, [tabId]);

  useEffect(() => {
    const handler = (message: unknown): boolean => {
      if (!isForDevtoolsMessage(message)) return false;

      const currentTabId = tabId;
      if (message.tabId !== currentTabId) return false;

      switch (message.type) {
        case "value": {
          addMessasges([message.payload]);
          break;
        }
        case "new-intercept": {
          addInterceptors([
            {
              ...message.payload,
              expression: undefined,
              // fromKey: undefined,
              // sampleId: undefined,
              // sampleIds: undefined,
            },
          ]);
          break;
        }
        case "remove-intercept": {
          removeInterceptors([{ id: message.payload.id }]);
          break;
        }
        case "interceptors": {
          setInterceptors(
            message.payload.map((interceptor) => ({
              ...interceptor,
              expression: interceptor.expression,
            })),
          );
          break;
        }
        case "intercepted-count": {
          setInterceptedCounts(message.payload.id, message.payload.count);
          break;
        }
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, [tabId]);

  const createInterceptorByMessage = useCallback(
    (message: ExtensionPluginMessages.ValueMessage["payload"]) => {
      const id = generateNumberId();
      const interceptor: ExtensionInterceptor = {
        id,
        staticId: id,
        name: message.name,
        patterns: [message.key],
        // fromKey: message.key,
        // sampleIds: [],
        // sampleId: undefined,
        interactive: false,
        enabled: true,
        expression: getDefaultExpression(),
        // expression: undefined,
        owner: EXTENSION_OWNER,
        timestamp: Date.now(),
      };
      addInterceptors([interceptor]);
      sendMessageToPlugin(
        "interceptors:add",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [addInterceptors, tabId],
  );

  const onInterceptorCreate = useCallback(
    (name: string) => {
      const id = generateNumberId();
      const interceptor: ExtensionInterceptor = {
        id,
        staticId: id,
        name: name,
        patterns: [],
        // fromKey: message.key,
        // sampleIds: [],
        // sampleId: undefined,
        interactive: false,
        enabled: true,
        expression: getDefaultExpression(),
        // expression: undefined,
        owner: EXTENSION_OWNER,
        timestamp: Date.now(),
      };
      addInterceptors([interceptor]);
      sendMessageToPlugin(
        "interceptors:add",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [addInterceptors, tabId],
  );

  const onInterceptorDuplicate = useCallback(
    (interceptor: ExtensionInterceptor) => {
      {
        if (interceptor.owner === EXTENSION_OWNER) {
          const id = generateNumberId();
          const newInterceptor: ExtensionInterceptor = {
            id,
            staticId: id,
            name: interceptor.name,
            patterns: interceptor.patterns,
            interactive: interceptor.interactive,
            enabled: false,
            expression:
              typeof interceptor.expression === "string"
                ? interceptor.expression
                : getDefaultExpression(),
            owner: EXTENSION_OWNER,
            timestamp: Date.now(),
          };
          addInterceptors([newInterceptor]);
          sendMessageToPlugin(
            "interceptors:add",
            {
              name: newInterceptor.name,
              data: [newInterceptor],
              timestamp: Date.now(),
            },
            tabId,
          );
        } else {
          sendMessageToPlugin(
            "interceptors:duplicate",
            {
              name: interceptor.name,
              data: [interceptor],
              timestamp: Date.now(),
            },
            tabId,
          );
        }
      }
    },
    [addInterceptors, tabId],
  );

  const onInterceptorChange = useCallback(
    (interceptor: ExtensionInterceptor) => {
      updateInterceptor(interceptor);
      sendMessageToPlugin(
        "interceptors:update",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [updateInterceptor, tabId],
  );

  const onInterceptorRemove = useCallback(
    (interceptor: ExtensionInterceptor) => {
      removeInterceptors([interceptor]);
      sendMessageToPlugin(
        "interceptors:remove",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [removeInterceptors, tabId],
  );

  const clearMessages = () => {
    sendMessageToPlugin("clear-messages", { timestamp: Date.now() }, tabId);
    setMessages([]);
  };

  const clearInterceptors = () => {
    sendMessageToPlugin("clear-interceptors", { timestamp: Date.now() }, tabId);
    setInterceptors([]);
  };

  const toggleInterceptors = () => {
    const someEnabled = interceptors.some((x) => x.enabled);
    const updatedInterceptors = interceptors
      .filter((x) => x.enabled === someEnabled)
      .map((interceptor) => ({
        ...interceptor,
        enabled: !someEnabled,
      }));

    updatedInterceptors.forEach(updateInterceptor);

    Object.entries(
      groupBy(updatedInterceptors, (interceptor) => interceptor.name),
    ).forEach(([name, data]) => {
      sendMessageToPlugin(
        "interceptors:update",
        {
          name,
          data,
          timestamp: Date.now(),
        },
        tabId,
      );
    });
  };

  const onGoToInterceptorClick = useCallback((interceptorId: InterceptorId) => {
    setInterceptorsFilter(String(interceptorId));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  const getResizerMode = useCallback(() => {
    if (!containerRef.current) return "vertical";
    return Runtime.LgAndUp(containerRef.current) ? "horizontal" : "vertical";
  }, []);

  const resizeDividerProps = useResizeDivider({
    containerRef,
    heightVariable: "--local-resizing-height",
    widthVariable: "--local-resizing-width",
    getOrientation: getResizerMode,
  });

  const resetResizer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const isHorizontal = getResizerMode() === "horizontal";
    if (isHorizontal) {
      container.style.setProperty("--local-resizing-width", "50%");
    } else {
      container.style.setProperty("--local-resizing-height", "50%");
    }
  }, []);

  return (
    <Flex height="100cqh" direction="column">
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
      <Grid
        minHeight="0"
        flexGrow="1"
        ref={containerRef}
        rows={{
          initial: `var(--local-resizing-height) 1fr`,
          lg: "1fr",
        }}
        columns={{
          initial: "1fr",
          lg: `var(--local-resizing-width) 1fr`,
        }}
        className={css`
          --local-resizing-width: 50%;
          --local-resizing-height: 50%;
        `}
      >
        <Flex direction="column" overflow="auto">
          <Flex gap="1" align="center" wrap="wrap" p="1">
            <ButtonIcon title="Clear Messages" onClick={clearMessages}>
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
              onChange={(ev) => setFilterPatterns(ev.target.value)}
              onBlur={(ev) => {
                setFilterPatterns(
                  serializePatterns(parsePatterns(ev.target.value)),
                );
              }}
            >
              <TextField.Slot />
              {filterPatterns && (
                <TextField.Slot>
                  <IconButton
                    onClick={() => setFilterPatterns(undefined)}
                    size="1"
                    variant="ghost"
                  >
                    <ConsoleErrorIcon height="14" width="14" />
                  </IconButton>
                </TextField.Slot>
              )}
            </TextField.Root>
          </Flex>
          <MessagesTableContainer
            onTweak={createInterceptorByMessage}
            messages={messages}
            highllightByInterceptor={highlightedInterceptorMessages}
            filterPatterns={deferredFilterPatterns}
            onGoToInterceptorClick={onGoToInterceptorClick}
            className={css`
              opacity: ${deferredFilterPatterns === filterPatterns
                ? undefined
                : 0.5};
            `}
          />
        </Flex>
        <Flex
          direction="column"
          overflow="auto"
          position="relative"
          className={css`
            border-top: 1px solid var(--gray-a6);

            ${Container.LgAndUp()} {
              border-top: unset;
              border-left: 1px solid var(--gray-a6);
            }
          `}
        >
          <ResizeDivider onReset={resetResizer} {...resizeDividerProps} />
          <Flex
            gap="1"
            p="1"
            align="center"
            wrap="wrap"
            className={css`
              border-bottom: 1px solid var(--gray-a6);
            `}
          >
            <ButtonIcon title="Clear Interceptors" onClick={clearInterceptors}>
              <ClearIcon size="medium" />
            </ButtonIcon>
            <ButtonIcon
              title="Toggle Interceptors"
              disabled={interceptors.length === 0}
              onClick={toggleInterceptors}
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
              onChange={(ev) => setInterceptorsFilter(ev.target.value)}
            >
              <TextField.Slot />
              {interceptorsFilter && (
                <TextField.Slot>
                  <IconButton
                    onClick={() => setInterceptorsFilter(undefined)}
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
          <InterceptorsListContainer
            interceptors={interceptors}
            onInterceptorChange={onInterceptorChange}
            onInterceptorRemove={onInterceptorRemove}
            onFilterMessages={onFilterMessages}
            onDuplicate={onInterceptorDuplicate}
            onHightLightInterceptor={setHighlightedInterceptorMessages}
            filter={deferredInterceptorsFilter}
            className={css`
              opacity: ${deferredInterceptorsFilter === interceptorsFilter
                ? undefined
                : 0.5};
            `}
          />
        </Flex>
      </Grid>
    </Flex>
  );
}
