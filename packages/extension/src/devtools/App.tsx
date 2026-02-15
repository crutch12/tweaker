import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesTable } from "./MessagesTable";
import { useStickToBottom } from "use-stick-to-bottom";
import { useVisibilityChange } from "@uidotdev/usehooks";
import { InterceptersList, ExtensionIntercepter } from "./InterceptersList";
import {
  ExtensionMessages,
  PluginMessages,
  EXTENSION_OWNER,
  EXTENSION_SOURCE,
  EXTENSION_PLUGIN_SOURCE,
} from "@tweaker/extension-plugin";
import { version, name } from "../../package.json";
import { useInterceptersStore } from "./useInterceptersStore";
import { css } from "@emotion/css";

function sendMessage<T extends ExtensionMessages.Message["type"]>(
  type: T,
  payload: Extract<ExtensionMessages.Message, { type: T }>["payload"],
) {
  const currentTabId = chrome.devtools.inspectedWindow.tabId;
  const message = {
    source: EXTENSION_SOURCE,
    version,
    type,
    payload,
  } as ExtensionMessages.Message;
  chrome.tabs.sendMessage(currentTabId, message);
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

  const clearData = () => {
    chrome.storage.session.set({ messages: [] }).then(() => {
      setMessages([]);
    });
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

  const portRef = useRef<chrome.runtime.Port>(undefined);

  useEffect(() => {
    portRef.current = chrome.runtime.connect({
      name: "tweaker-devtools-relay",
    });

    const handleMessage = (message: PluginMessages.Message) => {
      // const currentTabId = chrome.devtools.inspectedWindow.tabId;
      // debugger;
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
            setIntercepters(message.payload);
            break;
          }
        }
      }
    };

    portRef.current.onMessage.addListener(handleMessage);

    const initMessage: ExtensionMessages.InitMessage = {
      source: EXTENSION_SOURCE,
      version,
      type: "init",
      payload: {
        data: [],
        name: "wtf",
        timestamp: Date.now(),
      },
    };
    // debugger;
    portRef.current.postMessage({
      ...initMessage,
      tabId: chrome.devtools.inspectedWindow.tabId,
    });

    chrome.storage.session
      .get<{ messages: PluginMessages.ValueMessage[] }>({ messages: [] })
      .then((result) => {
        setMessages((v) => [...v, ...result.messages.map((x) => x.payload)]);
      });

    const onDisconnect = () => {
      portRef.current?.onMessage.removeListener(handleMessage);
      portRef.current = undefined;
    };

    portRef.current.onDisconnect.addListener(onDisconnect);

    return () => {
      portRef.current?.onMessage.removeListener(handleMessage);
      portRef.current?.disconnect();
      portRef.current = undefined;
    };
  }, []);

  const documentVisible = useVisibilityChange();

  useEffect(() => {
    if (portRef.current && documentVisible) {
      portRef.current.postMessage({
        action: "keep-alive",
        tabId: chrome.devtools.inspectedWindow.tabId,
      });
    }
  }, [documentVisible]);

  useEffect(() => {
    sendMessage("ping", {
      timestamp: Date.now(),
    });
  }, []);

  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

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
        expression: undefined,
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
            sendMessage("init", {
              name: "test",
              timestamp: Date.now(),
              data: ["Message from extension!"],
            })
          }
        >
          Send Message
        </button>
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
        {messages.length > 0 ? (
          <div ref={scrollRef}>
            <MessagesTable
              onTweak={newTweak}
              ref={contentRef}
              messages={messages}
            />
          </div>
        ) : (
          <div
            style={{
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "4px",
            }}
          >
            <span>Call</span>
            <span style={{ color: "red" }}>tweaker.value()</span>
            <span>from in-page code to see logs...</span>
          </div>
        )}
        {intercepters.length > 0 ? (
          <div>
            <InterceptersList
              intercepters={intercepters}
              onIntercepterChange={(i) => {
                updateIntercepter(i);
              }}
              onIntercepterRemove={(i) => removeIntercepters([i])}
            />
          </div>
        ) : (
          <div
            style={{
              fontSize: "16px",
            }}
          >
            Intercepters are empty
          </div>
        )}
      </div>
    </div>
  );
}
