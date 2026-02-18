import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExtensionMessages,
  PluginMessages,
  EXTENSION_OWNER,
  EXTENSION_SOURCE,
  EXTENSION_PLUGIN_SOURCE,
} from "@tweaker/extension-plugin";
import { version, name } from "../../package.json";
import { useInterceptorsStore } from "./features/interceptors/useInterceptorsStore";
import { css } from "@emotion/css";
import { sendMessageToPlugin } from "./utils/sendMessageToPlugin";
import { useDevtoolsConnection } from "./hooks/useDevtoolsConnection";
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
  Box,
  Grid,
  Heading,
} from "@radix-ui/themes";
import { ConsoleErrorIcon } from "@devtools-ds/icon";
import { BlueButton } from "./components/BlueButton";
import { keyMatchesPatterns } from "@tweaker/core/utils";
import { ExtensionInterceptor } from "./features/interceptors/InterceptorItem";
import { CreateTweakerDropdown } from "./components/CreateTweakerDropdown";
import { Media } from "./utils/styles";
import { useResizer } from "./hooks/useResizer";
import { getDefaultExpression } from "./utils/expressions";

function getResizerMode() {
  return matchMedia(Media.XlAndUp(false)).matches ? "horizontal" : "vertical";
}

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

  const checkPageTitle = () => {
    chrome.devtools.inspectedWindow.eval("document.title", (result) => {
      alert("Page title: " + result);
    });
  };

  const evalTweaker = () => {
    chrome.devtools.inspectedWindow.eval(
      "globalThis.__TWEAKER__.version",
      (result) => {
        alert(result);
      },
    );
  };

  const date = useMemo(() => new Date(), []);

  const [messages, setMessages] = useState<
    PluginMessages.ValueMessage["payload"][]
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

  const hightlightedMessagesRows = useMemo(() => {
    if (!highlightedInterceptorMessages) return undefined;
    return messages
      .filter((m) => m.name === highlightedInterceptorMessages.name)
      .filter((m) =>
        keyMatchesPatterns(m.key, highlightedInterceptorMessages.patterns),
      )
      .map((x) => `${x.name}:${x.key}`);
  }, [messages, highlightedInterceptorMessages]);

  const onFilterMessages = useCallback((pattenrs: string[] | undefined) => {
    setFilterPatterns(pattenrs ? serializePatterns(pattenrs) : undefined);
  }, []);

  useEffect(() => {
    chrome.storage.session
      .get<{ messages: PluginMessages.ValueMessage[] }>({ messages: [] })
      .then((result) => {
        setMessages((v) => [...v, ...result.messages.map((x) => x.payload)]);
      });
  }, []);

  useEffect(() => {
    sendMessageToPlugin("ping", {
      timestamp: Date.now(),
    });
  }, []);

  const { subscribe, sendMessage } = useDevtoolsConnection();

  useEffect(() => {
    return subscribe((message) => {
      if (message.source === EXTENSION_PLUGIN_SOURCE) {
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
                expression: interceptor.expression ?? getDefaultExpression(),
              })),
            );
            break;
          }
        }
      }
    });
  }, []);

  const newTweak = useCallback(
    (message: PluginMessages.ValueMessage["payload"]) => {
      const id = Math.ceil(Math.random() * 1_000_000_000);
      addInterceptors([
        {
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
        },
      ]);
    },
    [addInterceptors],
  );

  useEffect(() => {
    const message: ExtensionMessages.InterceptorsMessage = {
      type: "interceptors",
      version,
      source: EXTENSION_SOURCE,
      payload: {
        name: "test",
        timestamp: Date.now(),
        data: interceptors.map((interceptor) => ({
          ...interceptor,
        })),
      },
    };

    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, message);
  }, [interceptors]);

  const clearMessages = () => {
    sendMessage("clear-messages", { timestamp: Date.now() });
    setMessages([]);
  };

  const clearInterceptors = () => {
    sendMessage("clear-interceptors", { timestamp: Date.now() });
    setInterceptors([]);
  };

  const onGoToInterceptorClick = useCallback(
    (interceptorId: string | number) => {
      setInterceptorsFilter(String(interceptorId));
    },
    [],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useResizer({
    containerRef,
    dividerRef,
    heightVariable: "--local-resizing-height",
    widthVariable: "--local-resizing-width",
    getMode: getResizerMode,
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
    <Grid
      ref={containerRef}
      py="1"
      gap="2"
      rows={{
        // 5px for divider
        initial: `auto var(--local-resizing-height) 5px 1fr`,
        xl: "auto 1fr",
      }}
      columns={{
        initial: "1fr",
        // 5px for divider
        xl: `var(--local-resizing-width) 5px 1fr`,
      }}
      height="100vh"
      className={css`
        --local-resizing-width: 50%;
        --local-resizing-height: 50%;
      `}
    >
      <Flex direction="column" gap="2" gridColumn="1 / -1" px="1">
        <Flex gap="2" align="center" wrap="wrap">
          <Heading size="3">
            Tweaker DevTools ({date.toLocaleTimeString()})
          </Heading>
          <BlueButton onClick={reloadPanel}>Reload DevTools Panel</BlueButton>
          <BlueButton onClick={reloadPage}>Reload Current Page</BlueButton>
          <BlueButton onClick={checkPageTitle}>Check page title</BlueButton>
          <BlueButton onClick={evalTweaker}>Eval Tweaker</BlueButton>
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
        <Separator size="4" orientation="horizontal" />
      </Flex>
      <Flex direction="column" overflow="auto" gap="2">
        <Flex gap="2" align="center" wrap="wrap">
          <ButtonIcon title="Clear Messages" onClick={clearMessages}>
            <ClearIcon size="medium" />
          </ButtonIcon>
          <TextField.Root
            size="1"
            radius="full"
            placeholder="Filter messages by key (glob, e.g. *.*)"
            className={css`
              min-width: 260px;
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
          onTweak={newTweak}
          messages={messages}
          hightlightedRows={hightlightedMessagesRows}
          filterPatterns={deferredFilterPatterns}
          onGoToInterceptorClick={onGoToInterceptorClick}
          className={css`
            opacity: ${deferredFilterPatterns === filterPatterns
              ? undefined
              : 0.5};
          `}
        />
      </Flex>
      <Box
        ref={dividerRef}
        onDoubleClick={resetResizer}
        px={{ initial: "0", xl: "2px" }}
        py={{ initial: "2px", xl: "0" }}
        className={css`
          border-radius: 4px;
          :hover {
            cursor: ns-resize;
            box-shadow:
              inset 1px 1px 2px rgb(26, 115, 232),
              inset -1px -1px 2px rgb(26, 115, 232);

            ${Media.XlAndUp(true)} {
              cursor: e-resize;
            }
          }
        `}
      >
        <Separator
          size="4"
          orientation={{ initial: "horizontal", xl: "vertical" }}
        />
      </Box>
      <Flex direction="column" overflow="auto" gap="2">
        <Flex gap="2" align="center" wrap="wrap">
          <ButtonIcon title="Clear Interceptors" onClick={clearInterceptors}>
            <ClearIcon size="medium" />
          </ButtonIcon>
          <TextField.Root
            size="1"
            radius="full"
            placeholder="Filter interceptors by id/name/patterns"
            className={css`
              min-width: 260px;
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
              onCreate={(name) => {
                const id = Math.ceil(Math.random() * 1_000_000_000);
                addInterceptors([
                  {
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
                  },
                ]);
              }}
            />
          )}
        </Flex>
        <InterceptorsListContainer
          interceptors={interceptors}
          onInterceptorChange={(i) => {
            updateInterceptor(i);
          }}
          onInterceptorRemove={(i) => removeInterceptors([i])}
          onFilterMessages={(patterns) => onFilterMessages(patterns)}
          onDuplicate={(i) => {
            const id = Math.ceil(Math.random() * 1_000_000_000);
            addInterceptors([
              {
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
              },
            ]);
          }}
          onHightLightInterceptor={(v) => setHighlightedInterceptorMessages(v)}
          filter={deferredInterceptorsFilter}
        />
      </Flex>
    </Grid>
  );
}
