import { TweakerMessage, TweakerValueMessage } from "@tweaker/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesTable } from "./MessagesTable";
import { useStickToBottom } from "use-stick-to-bottom";
import { useVisibilityChange } from "@uidotdev/usehooks";
import { InterceptorsList, Interceptor } from "./InterceptorsList";

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

  const [messages, setMessages] = useState<TweakerMessage["payload"][]>([]);

  const [interceptors, setInterceptors] = useState<Interceptor[]>([]);

  const portRef = useRef<chrome.runtime.Port>(undefined);

  useEffect(() => {
    portRef.current = chrome.runtime.connect({
      name: "tweaker-devtools-relay",
    });

    const handleMessage = (message: TweakerMessage) => {
      // const currentTabId = chrome.devtools.inspectedWindow.tabId;
      if (message.source === "@tweaker/core") {
        switch (message.type) {
          case "value": {
            setMessages((v) => [...v, message.payload]);
            break;
          }
          case "new-intercept": {
            addInterceptor({
              appName: message.payload.name,
              enabled: true,
              id: message.payload.id,
              interactive: message.payload.interactive,
              patterns: message.payload.patterns,
              expression: undefined,
              fromKey: undefined,
              sampleId: undefined,
              sampleIds: undefined,
            });
            break;
          }
          case "remove-intercept": {
            removeInterceptor(message.payload.name, message.payload.id);
            break;
          }
        }
      }
    };

    portRef.current.onMessage.addListener(handleMessage);

    portRef.current.postMessage({
      action: "init",
      tabId: chrome.devtools.inspectedWindow.tabId,
    });

    chrome.storage.session
      .get<{ messages: TweakerMessage[] }>({ messages: [] })
      .then((result) => {
        setMessages((v) => [...v, ...result.messages.map((x) => x.payload)]);
      });

    return () => {
      portRef.current.onMessage.removeListener(handleMessage);
      portRef.current.disconnect();
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
    chrome.tabs.sendMessage(currentTabId, {
      source: "@tweaker/extension",
      payload: "Message from extension!",
    });
  }

  const { scrollRef, contentRef } = useStickToBottom({
    mass: 1,
  });

  function newTweak(message: TweakerValueMessage["payload"]) {
    addInterceptor({
      id: 1,
      appName: message.name,
      patterns: [message.key],
      fromKey: message.key,
      sampleIds: [],
      sampleId: undefined,
      interactive: false,
      enabled: true,
      expression: undefined,
    });
  }

  function addInterceptor(interceptor: Interceptor) {
    debugger;
    setInterceptors((v) => {
      const prev = v[v.length - 1];
      return [
        ...v,
        {
          ...interceptor,
          id: prev ? prev.id : interceptor.id,
        },
      ];
    });
  }

  function removeInterceptor(appName: string, id: number) {
    setInterceptors((v) =>
      v.filter((i) => i.id !== id && i.appName !== appName),
    );
  }

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
      <div>
        {messages.length > 0 ? (
          <div
            ref={scrollRef}
            style={{ maxHeight: "40vh", minHeight: "40vh", overflow: "auto" }}
          >
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
        {interceptors.length > 0 && (
          <div
            style={{ maxHeight: "40vh", minHeight: "40vh", overflow: "auto" }}
          >
            <InterceptorsList
              interceptors={interceptors}
              onInterceptorChange={() => {
                debugger;
              }}
              onInterceptorRemove={(i) => removeInterceptor(i.appName, i.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
