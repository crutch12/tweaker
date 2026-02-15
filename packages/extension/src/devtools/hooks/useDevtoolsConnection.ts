import {
  ExtensionMessages,
  PluginMessages,
  EXTENSION_OWNER,
  EXTENSION_SOURCE,
  EXTENSION_PLUGIN_SOURCE,
} from "@tweaker/extension-plugin";
import { useCallback, useEffect, useRef } from "react";
import { version, name } from "../../../package.json";
import { useVisibilityChange } from "@uidotdev/usehooks";

type Subscriber = (message: PluginMessages.Message) => void;

export function useDevtoolsConnection() {
  const portRef = useRef<chrome.runtime.Port>(undefined);

  const subscribers = useRef(new Set<Subscriber>());

  useEffect(() => {
    portRef.current = chrome.runtime.connect({
      name: "tweaker-devtools-relay",
    });

    const handleMessage = (message: PluginMessages.Message) => {
      if (message.source === EXTENSION_PLUGIN_SOURCE) {
        subscribers.current.forEach((subscriber) => subscriber(message));
      }
    };

    portRef.current.onMessage.addListener(handleMessage);

    const initMessage: ExtensionMessages.InitMessage = {
      source: EXTENSION_SOURCE,
      version,
      type: "init",
      payload: {
        data: [],
        timestamp: Date.now(),
      },
    };

    portRef.current.postMessage({
      ...initMessage,
      tabId: chrome.devtools.inspectedWindow.tabId,
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

  const subscribe = useCallback((subscriber: Subscriber) => {
    subscribers.current.add(subscriber);
    return () => {
      subscribers.current.delete(subscriber);
    };
  }, []);

  const documentVisible = useVisibilityChange();

  // Prevent background-sw.js from sleep
  useEffect(() => {
    if (portRef.current && documentVisible) {
      portRef.current.postMessage({
        action: "keep-alive",
        tabId: chrome.devtools.inspectedWindow.tabId,
      });
    }
  }, [documentVisible]);

  useEffect(() => {
    return () => {
      subscribers.current.clear();
    };
  }, []);

  return {
    subscribe,
  };
}
