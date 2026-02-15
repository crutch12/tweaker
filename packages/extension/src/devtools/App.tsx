import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keyMatchesPatterns } from "@tweaker/core/utils";
import { MessagesTable } from "./features/messages/MessagesTable";
import { useVisibilityChange } from "@uidotdev/usehooks";
import {
  InterceptersList,
  ExtensionIntercepter,
} from "./features/intercepters/InterceptersList";
import {
  ExtensionMessages,
  PluginMessages,
  EXTENSION_OWNER,
  EXTENSION_SOURCE,
  EXTENSION_PLUGIN_SOURCE,
} from "@tweaker/extension-plugin";
import { version, name } from "../../package.json";
import { useInterceptersStore } from "./features/intercepters/useInterceptersStore";
import { css } from "@emotion/css";
import { sendMessageToPlugin } from "./utils/sendMessageToPlugin";
import { useDevtoolsConnection } from "./hooks/useDevtoolsConnection";
import { MessagesTableContainer } from "./features/messages/MessagesTableContainer";
import { InterceptersListContainer } from "./features/intercepters/InterceptersListContainer";

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

  const clearData = () => {
    chrome.storage.session.set({ messages: [] }).then(() => {
      setMessages([]);
    });
  };

  const clearFilters = () => {
    setFilterPatterns(undefined);
  };

  const date = useMemo(() => new Date(), []);

  const [messages, setMessages] = useState<
    PluginMessages.ValueMessage["payload"][]
  >([]);

  const intercepters = useInterceptersStore((state) => state.intercepters);
  const addIntercepters = useInterceptersStore((state) => state.add);
  const setIntercepters = useInterceptersStore((state) => state.set);
  const updateIntercepter = useInterceptersStore((state) => state.update);
  const removeIntercepters = useInterceptersStore((state) => state.remove);

  const [filterPatterns, setFilterPatterns] = useState<string[] | undefined>(
    undefined,
  );

  const filteredMessages = useMemo(() => {
    if (filterPatterns) {
      return messages.filter((msg) =>
        keyMatchesPatterns(msg.key, filterPatterns),
      );
    }
    return messages;
  }, [filterPatterns, messages]);

  const onFilterMessages = useCallback((pattenrs: string[] | undefined) => {
    setFilterPatterns(pattenrs);
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

  const { subscribe } = useDevtoolsConnection();

  useEffect(() => {
    return subscribe((message) => {
      if (message.source === EXTENSION_PLUGIN_SOURCE) {
        switch (message.type) {
          case "value": {
            setMessages((v) => [...v, message.payload]);
            break;
          }
          case "new-intercept": {
            addIntercepters([
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
            removeIntercepters([{ id: message.payload.id }]);
            break;
          }
          case "intercepters": {
            // message.payload
            setIntercepters(
              message.payload.map((intercepter) => ({
                ...intercepter,
                expression: intercepter.expression ?? "  return value",
              })),
            );
            break;
          }
        }
      }
    });
  }, []);

  function newTweak(message: PluginMessages.ValueMessage["payload"]) {
    addIntercepters([
      {
        id: Math.ceil(Math.random() * 1_000_000_000),
        name: message.name,
        patterns: [message.key],
        // fromKey: message.key,
        // sampleIds: [],
        // sampleId: undefined,
        interactive: false,
        enabled: true,
        expression: "  return value",
        // expression: undefined,
        owner: EXTENSION_OWNER,
        timestamp: Date.now(),
      },
    ]);
  }

  useEffect(() => {
    const message: ExtensionMessages.InterceptersMessage = {
      type: "intercepters",
      version,
      source: EXTENSION_SOURCE,
      payload: {
        name: "test",
        timestamp: Date.now(),
        data: intercepters.map((intercepter) => ({
          ...intercepter,
        })),
      },
    };

    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, message);
  }, [intercepters]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <strong style={{ fontSize: "20px" }}>
        Tweaker DevTools - {date.toLocaleString()}
      </strong>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={reloadPanel}>Reload DevTools Panel</button>
        <button onClick={reloadPage}>Reload Current Page</button>
        <button onClick={checkPageTitle}>Check page title</button>
        <button onClick={evalTweaker}>Eval Tweaker</button>
        <button onClick={clearData}>Clear Data</button>
        <button
          onClick={() =>
            sendMessageToPlugin("init", {
              // name: "test",
              timestamp: Date.now(),
              data: ["Message from extension!"],
            })
          }
        >
          Send Message
        </button>
        {filterPatterns && (
          <>
            <button onClick={clearFilters}>Clear Filters</button>
            <input type="text" value={filterPatterns.join(", ")} readOnly />
          </>
        )}
      </div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: calc(100vh - 100px);

          > div {
            flex: 1;
            overflow: auto;
          }
        `}
      >
        <MessagesTableContainer
          onTweak={newTweak}
          messages={filteredMessages}
        />
        <InterceptersListContainer
          intercepters={intercepters}
          onIntercepterChange={(i) => {
            updateIntercepter(i);
          }}
          onIntercepterRemove={(i) => removeIntercepters([i])}
          onFilterMessages={(patterns) => onFilterMessages(patterns)}
        />
      </div>
    </div>
  );
}
