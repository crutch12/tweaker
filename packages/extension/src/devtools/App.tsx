import { TweakerMessage } from "@tweaker/core";
import { useEffect, useMemo, useState } from "react";

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
    chrome.storage.local.set({ messages: [] }).then(() => {
      setInterceptedValues([]);
    });
  };

  const date = useMemo(() => new Date(), []);

  const [interceptedValues, setInterceptedValues] = useState<
    TweakerMessage["payload"][]
  >([]);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "tweaker-devtools-relay" });

    const handleMessage = (message: TweakerMessage) => {
      // const currentTabId = chrome.devtools.inspectedWindow.tabId;
      if (message.source === "@tweaker/core" && message.type === "value") {
        setInterceptedValues((v) => [...v, message.payload]);
      }
    };

    port.onMessage.addListener(handleMessage);

    port.postMessage({
      action: "init",
      tabId: chrome.devtools.inspectedWindow.tabId,
    });

    chrome.storage.local
      .get<{ messages: TweakerMessage[] }>({ messages: [] })
      .then((result) => {
        setInterceptedValues((v) => [
          ...v,
          ...result.messages.map((x) => x.payload),
        ]);
      });

    return () => {
      port.onMessage.removeListener(handleMessage);
      port.disconnect();
    };
  }, []);

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
      </div>
      <div>
        {interceptedValues.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              maxHeight: "80vh",
              border: "1px solid black",
              padding: "10px",
            }}
          >
            {interceptedValues.map((interceptedValue) => (
              <div key={interceptedValue.key + interceptedValue.timestamp}>
                {interceptedValue.name} - {interceptedValue.key} -{" "}
                {interceptedValue.timestamp}
              </div>
            ))}
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
