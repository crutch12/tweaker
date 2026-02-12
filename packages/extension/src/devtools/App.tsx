import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesTable } from "./MessagesTable";
import { useStickToBottom } from "use-stick-to-bottom";
import { useVisibilityChange } from "@uidotdev/usehooks";
import { InterceptersList, Intercepter } from "./InterceptersList";
import { ExtensionMessages, PluginMessages } from "@tweaker/extension-plugin";
import { version, name } from "../../package.json";
import { useInterceptersStore } from "./useInterceptersStore";
import { css } from "@emotion/css";

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
  const removeIntercepters = useInterceptersStore((state) => state.remove);

  const portRef = useRef<chrome.runtime.Port>(undefined);

  useEffect(() => {
    portRef.current = chrome.runtime.connect({
      name: "tweaker-devtools-relay",
    });

    const handleMessage = (message: PluginMessages.Message) => {
      // const currentTabId = chrome.devtools.inspectedWindow.tabId;
      // debugger;
      if (message.source === "@tweaker/extension-plugin") {
        switch (message.type) {
          case "value": {
            setMessages((v) => [...v, message.payload]);
            break;
          }
          case "new-intercept": {
            addIntercepters([
              {
                appName: message.payload.name,
                enabled: true,
                id: message.payload.id,
                interactive: message.payload.interactive,
                patterns: message.payload.patterns,
                expression: undefined,
                fromKey: undefined,
                sampleId: undefined,
                sampleIds: undefined,
                source: message.payload.source,
              },
            ]);
            break;
          }
          case "remove-intercept": {
            removeIntercepters([{ id: message.payload.id }]);
            break;
          }
        }
      }
    };

    portRef.current.onMessage.addListener(handleMessage);

    const initMessage: ExtensionMessages.InitMessage = {
      source: "@tweaker/extension",
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

    return () => {
      portRef.current?.onMessage.removeListener(handleMessage);
      portRef.current?.disconnect();
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

  function sendMessage() {
    const currentTabId = chrome.devtools.inspectedWindow.tabId;
    const message: ExtensionMessages.InitMessage = {
      source: "@tweaker/extension",
      version,
      type: "init",
      payload: {
        name: "test",
        timestamp: Date.now(),
        data: ["Message from extension!"],
      },
    };
    chrome.tabs.sendMessage(currentTabId, message);
  }

  // useEffect(() => {
  //   sendMessage();
  // }, []);

  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

  function newTweak(message: PluginMessages.ValueMessage["payload"]) {
    addIntercepters([
      {
        id: Math.ceil(Math.random() * 1_000_000_000),
        appName: message.name,
        patterns: [message.key],
        fromKey: message.key,
        sampleIds: [],
        sampleId: undefined,
        interactive: false,
        enabled: true,
        expression: undefined,
        source: "@tweaker/extension",
      },
    ]);
  }

  useEffect(() => {
    if (portRef.current) {
      const message: ExtensionMessages.InterceptersMessage = {
        type: "intercepters",
        version,
        source: "@tweaker/extension",
        payload: {
          name: "test",
          timestamp: Date.now(),
          data: intercepters.map((intercepter) => ({
            id: intercepter.id,
            name: intercepter.appName,
            patterns: intercepter.patterns,
            interactive: intercepter.interactive,
            expression: intercepter.expression,
          })),
        },
      };
      portRef.current.postMessage({
        ...message,
        tabId: chrome.devtools.inspectedWindow.tabId,
      });
    }
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
        <button onClick={sendMessage}>Send Message</button>
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
              onIntercepterChange={() => {
                // debugger;
              }}
              onIntercepterRemove={(i) => removeIntercepters([i])}
            />
          </div>
        ) : (
          <div>Intercepters are empty</div>
        )}
      </div>
    </div>
  );
}
