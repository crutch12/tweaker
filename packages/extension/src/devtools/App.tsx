import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keyMatchesPatterns } from "@tweaker/core/utils";
import { MessagesTable } from "./features/messages/MessagesTable";
import { useVisibilityChange } from "@uidotdev/usehooks";
import {
  InterceptorsList,
  ExtensionInterceptor,
} from "./features/interceptors/InterceptorsList";
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

  const clearFilters = () => {
    setFilterPatterns(undefined);
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
                expression: interceptor.expression ?? "  return value",
              })),
            );
            break;
          }
        }
      }
    });
  }, []);

  function newTweak(message: PluginMessages.ValueMessage["payload"]) {
    addInterceptors([
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

  const clearData = () => {
    sendMessage("clear-messages", { timestamp: Date.now() });
    setMessages([]);
  };

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
              enabled: true,
              interceptors: [], // TODO: remove
              // data: ["Message from extension!"],
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
        <InterceptorsListContainer
          interceptors={interceptors}
          onInterceptorChange={(i) => {
            updateInterceptor(i);
          }}
          onInterceptorRemove={(i) => removeInterceptors([i])}
          onFilterMessages={(patterns) => onFilterMessages(patterns)}
        />
      </div>
    </div>
  );
}
