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
  EXTENSION_PLUGIN_SOURCE,
  isForDevtoolsMessage,
} from "@tweaker/extension-plugin";
import { generateNumberId } from "@tweaker/core/utils";
import type { InterceptorId } from "@tweaker/core";
import { version, name } from "../package.json";
import { useInterceptorsStore } from "./features/interceptors/useInterceptorsStore";
import { css } from "@emotion/css";
import { sendMessageToPlugin } from "./utils/sendMessageToPlugin";
import {
  HighlightRow,
  MessagesTableContainer,
} from "./features/messages/MessagesTableContainer";
import { InterceptorsListContainer } from "./features/interceptors/InterceptorsListContainer";
import { parsePatterns, serializePatterns } from "./utils/pattern";
import { ButtonIcon } from "./components/ButtonIcon";
import { ClearIcon } from "./icons/ClearIcon";
import {
  Separator,
  TextField,
  IconButton,
  Flex,
  Box,
  Grid,
  Heading,
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

export function App() {
  const reloadPage = () => {
    chrome.devtools.inspectedWindow.reload({
      ignoreCache: true, // Equivalent to Shift + F5
      userAgent: "Optional UA", // Can spoof user agents
      injectedScript: "console.log('Reloaded!')", // Runs immediately after reload
    });
  };

  const reloadPanel = () => {
    window.location.reload();
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

  const [messages, setMessages] = useState<
    ExtensionPluginMessages.ValueMessage["payload"][]
  >([]);

  const interceptors = useInterceptorsStore((state) => state.interceptors);
  const addInterceptors = useInterceptorsStore((state) => state.add);
  const setInterceptors = useInterceptorsStore((state) => state.set);
  const updateInterceptor = useInterceptorsStore((state) => state.update);
  const removeInterceptors = useInterceptorsStore((state) => state.remove);

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
        setMessages((v) => [...v, ...result.messages.map((x) => x.payload)]);
      });
  }, []);

  useEffect(() => {
    sendMessageToPlugin("ping", {
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    const handler = (message: unknown): boolean => {
      if (!isForDevtoolsMessage(message)) return false;

      const currentTabId = chrome.devtools.inspectedWindow.tabId;
      if (message.tabId !== currentTabId) return false;

      switch (message.type) {
        case "value": {
          setMessages((v) => [...v, message.payload]);
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
          // message.payload
          setInterceptors(
            message.payload.map((interceptor) => ({
              ...interceptor,
              expression: interceptor.expression,
            })),
          );
          break;
        }
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, []);

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
      sendMessageToPlugin("interceptors:add", {
        name: interceptor.name,
        data: [interceptor],
        timestamp: Date.now(),
      });
    },
    [addInterceptors],
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
      sendMessageToPlugin("interceptors:add", {
        name: interceptor.name,
        data: [interceptor],
        timestamp: Date.now(),
      });
    },
    [addInterceptors],
  );

  const onInterceptorDuplicate = useCallback(
    (i: ExtensionInterceptor) => {
      {
        const id = generateNumberId();
        const interceptor: ExtensionInterceptor = {
          id,
          staticId: id,
          name: i.name,
          patterns: i.patterns,
          interactive: i.interactive,
          enabled: false,
          expression:
            typeof i.expression === "string"
              ? i.expression
              : getDefaultExpression(),
          owner: EXTENSION_OWNER,
          timestamp: Date.now(),
        };
        addInterceptors([interceptor]);
        sendMessageToPlugin("interceptors:add", {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        });
      }
    },
    [addInterceptors],
  );

  const onInterceptorChange = useCallback(
    (interceptor: ExtensionInterceptor) => {
      updateInterceptor(interceptor);
      sendMessageToPlugin("interceptors:update", {
        name: interceptor.name,
        data: [interceptor],
        timestamp: Date.now(),
      });
    },
    [updateInterceptor],
  );

  const onInterceptorRemove = useCallback(
    (interceptor: ExtensionInterceptor) => {
      removeInterceptors([interceptor]);
      sendMessageToPlugin("interceptors:remove", {
        name: interceptor.name,
        data: [interceptor],
        timestamp: Date.now(),
      });
    },
    [removeInterceptors],
  );

  const clearMessages = () => {
    sendMessageToPlugin("clear-messages", { timestamp: Date.now() });
    setMessages([]);
  };

  const clearInterceptors = () => {
    sendMessageToPlugin("clear-interceptors", { timestamp: Date.now() });
    setInterceptors([]);
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
        wrap="wrap"
        p="1"
        className={css`
          border-bottom: 1px solid var(--gray-a6);
        `}
      >
        <Heading size="2">
          Tweaker DevTools ({date.toLocaleTimeString()})
        </Heading>
        <BlueButton onClick={reloadPanel}>Reload DevTools Panel</BlueButton>
        <BlueButton onClick={reloadPage}>Reload Current Page</BlueButton>
        <BlueButton onClick={evalTweaker}>Eval Tweaker</BlueButton>
        <BlueButton onClick={toggleColorScheme}>Toggle Color Scheme</BlueButton>
        <BlueButton
          onClick={() =>
            sendMessageToPlugin("init", {
              // name: "test",
              timestamp: Date.now(),
              enabled: true,
              interceptors: [], // TODO: remove
              // data: ["Message from extension!"],
            })
          }
        >
          Send Message
        </BlueButton>
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
              className={css`
                width: 260px;
                background-color: ${filterPatterns
                  ? "#FFFAC8" // FABEBE
                  : undefined};
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
            <TextField.Root
              size="1"
              radius="full"
              placeholder="Filter interceptors by id/name/patterns"
              className={css`
                width: 260px;
                background-color: ${interceptorsFilter
                  ? "#FFFAC8" // FABEBE
                  : undefined};
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
