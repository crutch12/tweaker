import {
  ExtensionServiceWorkerMessages,
  PluginMessages,
  EXTENSION_TO_SW_SOURCE,
  EXTENSION_PLUGIN_SOURCE,
} from "@tweaker/extension-plugin";
import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import { version, name } from "../../../package.json";
import { useVisibilityChange } from "@uidotdev/usehooks";

type Subscriber = (message: PluginMessages.Message) => void;

export function useDevtoolsConnection() {
  const portRef = useRef<chrome.runtime.Port>(undefined);
  const connected = useRef(false);

  const subscribers = useRef(new Set<Subscriber>());

  const handleMessage = useCallback((message: PluginMessages.Message) => {
    if (message.source === EXTENSION_PLUGIN_SOURCE) {
      subscribers.current.forEach((subscriber) => subscriber(message));
    }
  }, []);

  const onDisconnect = useCallback(() => {
    console.log(
      "tweaker devtools",
      "port disconnected",
      chrome.devtools.inspectedWindow.tabId,
      new Date(),
    );
    removeConnection(false);
  }, []);

  const sendMessage = useCallback(
    <T extends ExtensionServiceWorkerMessages.Message["type"]>(
      type: T,
      payload: Extract<
        ExtensionServiceWorkerMessages.Message,
        { type: T }
      >["payload"],
    ) => {
      if (!portRef.current) return;
      const message: ExtensionServiceWorkerMessages.Message = {
        source: EXTENSION_TO_SW_SOURCE,
        version,
        type,
        payload,
        tabId: chrome.devtools.inspectedWindow.tabId,
      };
      portRef.current.postMessage(message);
    },
    [],
  );

  const createConnection = useEffectEvent(() => {
    portRef.current = chrome.runtime.connect({
      name: "tweaker-devtools-relay",
    });

    sendMessage("init-connection", {
      timestamp: Date.now(),
    });

    portRef.current.onMessage.addListener(handleMessage);
    portRef.current.onDisconnect.addListener(onDisconnect);
    connected.current = true;
  });

  const removeConnection = useEffectEvent((destroyed: boolean) => {
    portRef.current?.onMessage.removeListener(handleMessage);
    portRef.current?.onDisconnect.removeListener(onDisconnect);
    if (connected.current) {
      portRef.current?.disconnect();
    }
    connected.current = false;
    if (destroyed) {
      portRef.current = undefined;
    }
  });

  const reconnect = useEffectEvent(() => {
    if (!portRef.current) return; // component is destroyed
    console.log(
      'tweaker devtools", "try to reconnect',
      portRef.current,
      new Date(),
    );
    removeConnection(false);
    createConnection();
  });

  useEffect(() => {
    createConnection();
    return () => {
      removeConnection(true);
    };
  }, []);

  const subscribe = useCallback((subscriber: Subscriber) => {
    subscribers.current.add(subscriber);
    return () => {
      subscribers.current.delete(subscriber);
    };
  }, []);

  const documentVisible = useVisibilityChange();

  // Prevent connection with background-sw.js from sleep
  useEffect(() => {
    if (!documentVisible || !portRef.current) return;
    if (connected.current) {
      portRef.current.postMessage({
        action: "keep-alive",
        tabId: chrome.devtools.inspectedWindow.tabId,
      });
    }
    // reconnect
    else {
      reconnect();
    }
  }, [documentVisible]);

  useEffect(() => {
    return () => {
      subscribers.current.clear();
    };
  }, []);

  return {
    subscribe,
    sendMessage,
  };
}
