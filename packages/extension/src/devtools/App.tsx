import { TweakerMessage } from "@tweaker/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesTable } from "./MessagesTable";
import { useStickToBottom } from "use-stick-to-bottom";
import { useVisibilityChange } from "@uidotdev/usehooks";

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
      setInterceptedValues([]);
    });
  };

  const date = useMemo(() => new Date(), []);

  const [interceptedValues, setInterceptedValues] = useState<
    TweakerMessage["payload"][]
  >([]);

  const portRef = useRef<chrome.runtime.Port>(undefined);

  useEffect(() => {
    portRef.current = chrome.runtime.connect({
      name: "tweaker-devtools-relay",
    });

    const handleMessage = (message: TweakerMessage) => {
      // const currentTabId = chrome.devtools.inspectedWindow.tabId;
      if (message.source === "@tweaker/core" && message.type === "value") {
        setInterceptedValues((v) => [...v, message.payload]);
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
        setInterceptedValues((v) => [
          ...v,
          ...result.messages.map((x) => x.payload),
        ]);
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
        {interceptedValues.length > 0 ? (
          <div ref={scrollRef} style={{ maxHeight: "80vh", overflow: "auto" }}>
            <MessagesTable ref={contentRef} messages={interceptedValues} />
          </div>
        ) : (
          <span style={{ fontSize: "16px" }}>
            Intercept some events to see logs...
          </span>
        )}
      </div>
    </div>
  );
}
