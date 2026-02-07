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

  const date = useMemo(() => new Date(), []);

  const [interceptedValues, setInterceptedValues] = useState<
    TweakerMessage["payload"][]
  >([]);

  useEffect(() => {
    const handleMessage = (message: TweakerMessage) => {
      if (message.source === "@tweaker/core" && message.type === "value") {
        console.log(message.payload.key);
        debugger;
        setInterceptedValues((v) => [...v, message.payload]);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <div>
      <h1>Tweaker DevTools - {date.toLocaleString()}</h1>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={reloadPanel}>Reload DevTools Panel</button>
        <button onClick={reloadPage}>Reload Current Page</button>
        <button onClick={checkPageTitle}>Check page title</button>
        <button onClick={evalTweaker}>Eval Tweaker</button>
      </div>
      <div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {interceptedValues.map((interceptedValue) => (
            <div key={interceptedValue.key + interceptedValue.timestamp}>
              {interceptedValue.key} - {interceptedValue.timestamp}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
