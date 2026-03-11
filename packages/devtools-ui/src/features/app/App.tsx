import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ExtensionPluginMessages,
  EXTENSION_OWNER,
  isForDevtoolsMessage,
  MANUAL_INTERCEPTOR_TYPE,
} from "@tweaker/extension-plugin";
import { generateNumberId, groupBy } from "@tweaker/core/utils";
import { type InterceptorId } from "@tweaker/core";
import { useInterceptorsStore } from "../interceptors/useInterceptorsStore";
import { css } from "@emotion/css";
import { sendMessageToPlugin } from "../../utils/sendMessageToPlugin";
import { MessagesTableContainer } from "../messages/MessagesTableContainer";
import { InterceptorsListContainer } from "../interceptors/InterceptorsListContainer";
import { serializePatterns } from "../../utils/pattern";
import { Flex } from "@radix-ui/themes";
import { ExtensionInterceptor } from "../interceptors/InterceptorItem/InterceptorItem";
import { getDefaultInterceptorData } from "../../utils/expressions";
import { useDevtools } from "../devtools/DevtoolsProvider";
import { useMessagesStore } from "../messages/useMessagesStore";
import { useInterceptedCountsStore } from "../interceptors/useInterceptedCountsStore";
import { Header } from "./Header";
import { InterceptorsHeader } from "../interceptors/InterceptorsHeader";
import { MessagesHeader } from "../messages/MessagesHeader";
import { MainContainer } from "./MainContainer";
import { Footer } from "./Footer";

export function App() {
  const interceptors = useDeferredValue(
    useInterceptorsStore((state) => state.interceptors),
  );
  const addInterceptors = useInterceptorsStore((state) => state.add);
  const setInterceptors = useInterceptorsStore((state) => state.set);
  const updateInterceptor = useInterceptorsStore((state) => state.update);
  const removeInterceptors = useInterceptorsStore((state) => state.remove);

  const messages = useDeferredValue(
    useMessagesStore((state) => state.messages),
  );
  const addMessasges = useMessagesStore((state) => state.add);
  const updateMessage = useMessagesStore((state) => state.update);
  const setMessages = useMessagesStore((state) => state.set);

  const setInterceptedCounts = useInterceptedCountsStore((state) => state.set);

  const appNames = useMemo(() => {
    if (interceptors.length === 0 && messages.length === 0) return [];
    return Array.from(
      new Set([
        ...messages.map((x) => x.name),
        ...interceptors.map((x) => x.name),
      ]).values(),
    );
  }, [interceptors, messages]);

  const [filterPatterns, setFilterPatterns] = useState<string | undefined>(
    undefined,
  );

  const deferredFilterPatterns = useDeferredValue(filterPatterns);

  const [interceptorsFilter, setInterceptorsFilter] = useState<
    string | undefined
  >(undefined);

  const deferredInterceptorsFilter = useDeferredValue(interceptorsFilter);

  const [highlightedInterceptorMessages, setHighlightedInterceptorMessages] =
    useState<ExtensionInterceptor | undefined>(undefined);

  const onFilterMessages = useCallback((pattenrs: string[] | undefined) => {
    setFilterPatterns(pattenrs ? serializePatterns(pattenrs) : undefined);
  }, []);

  const { tabId } = useDevtools();

  useEffect(() => {
    try {
      sendMessageToPlugin(
        "ping",
        {
          timestamp: Date.now(),
        },
        tabId,
      );
    } catch {}
    return () => {
      // reset zustand state
      useInterceptedCountsStore.setState({ interceptedCounts: new Map() });
      useInterceptorsStore.setState({ interceptors: [] });
      useMessagesStore.setState({ messages: [] });
    };
  }, [tabId]);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handler = (message: unknown): boolean => {
      if (!isForDevtoolsMessage(message)) return false;

      const currentTabId = tabId;
      if (message.tabId !== currentTabId) return false;

      switch (message.type) {
        case "value": {
          addMessasges([message.payload]);
          break;
        }
        case "value:update": {
          updateMessage(message.payload);
          break;
        }
        case "new-intercept": {
          addInterceptors([
            {
              ...message.payload,
              data: undefined,
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
          setConnected(true);
          setInterceptors(
            message.payload.map((interceptor) => ({
              ...interceptor,
            })),
          );
          break;
        }
        case "intercepted-count": {
          setInterceptedCounts(message.payload.id, message.payload.count);
          break;
        }
        case "saved-messages": {
          addMessasges(message.payload.messages);
          break;
        }
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, [tabId]);

  const createInterceptorByMessage = useCallback(
    (
      message: ExtensionPluginMessages.ValueMessage["payload"],
      interceptorType: string,
    ) => {
      const id = generateNumberId();
      const data = getDefaultInterceptorData(interceptorType);
      const interceptor: ExtensionInterceptor = {
        id,
        staticId: id,
        type: interceptorType,
        name: message.name,
        patterns: [message.key],
        // fromKey: message.key,
        // sampleIds: [],
        // sampleId: undefined,
        interactive: false,
        enabled: true,
        data,
        // expression: undefined,
        owner: EXTENSION_OWNER,
        timestamp: Date.now(),
      };
      addInterceptors([interceptor]);
      sendMessageToPlugin(
        "interceptors:add",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [addInterceptors, tabId],
  );

  const onInterceptorCreate = useCallback(
    (name: string) => {
      const id = generateNumberId();
      const interceptor: ExtensionInterceptor = {
        id,
        staticId: id,
        type: MANUAL_INTERCEPTOR_TYPE,
        name: name,
        patterns: [],
        // fromKey: message.key,
        // sampleIds: [],
        // sampleId: undefined,
        interactive: false,
        enabled: true,
        data: getDefaultInterceptorData(MANUAL_INTERCEPTOR_TYPE),
        // expression: undefined,
        owner: EXTENSION_OWNER,
        timestamp: Date.now(),
      };
      addInterceptors([interceptor]);
      sendMessageToPlugin(
        "interceptors:add",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [addInterceptors, tabId],
  );

  const onInterceptorDuplicate = useCallback(
    (interceptor: ExtensionInterceptor) => {
      if (interceptor.owner === EXTENSION_OWNER) {
        const id = generateNumberId();
        const newInterceptor: ExtensionInterceptor = {
          ...interceptor,
          id,
          staticId: id,
          enabled: false,
          timestamp: Date.now(),
        };
        addInterceptors([newInterceptor]);
        sendMessageToPlugin(
          "interceptors:add",
          {
            name: newInterceptor.name,
            data: [newInterceptor],
            timestamp: Date.now(),
          },
          tabId,
        );
      } else {
        sendMessageToPlugin(
          "interceptors:duplicate",
          {
            name: interceptor.name,
            data: [interceptor],
            timestamp: Date.now(),
          },
          tabId,
        );
      }
    },
    [addInterceptors, tabId],
  );

  const onInterceptorChange = useCallback(
    (interceptor: ExtensionInterceptor) => {
      updateInterceptor(interceptor);
      sendMessageToPlugin(
        "interceptors:update",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [updateInterceptor, tabId],
  );

  const onInterceptorRemove = useCallback(
    (interceptor: ExtensionInterceptor) => {
      removeInterceptors([interceptor]);
      sendMessageToPlugin(
        "interceptors:remove",
        {
          name: interceptor.name,
          data: [interceptor],
          timestamp: Date.now(),
        },
        tabId,
      );
    },
    [removeInterceptors, tabId],
  );

  const clearMessages = () => {
    sendMessageToPlugin("clear-messages", { timestamp: Date.now() }, tabId);
    setMessages([]);
  };

  const clearInterceptors = () => {
    sendMessageToPlugin("clear-interceptors", { timestamp: Date.now() }, tabId);
    setInterceptors([]);
  };

  const toggleInterceptors = () => {
    const someEnabled = interceptors.some((x) => x.enabled);
    const updatedInterceptors = interceptors
      .filter((x) => x.enabled === someEnabled)
      .map((interceptor) => ({
        ...interceptor,
        enabled: !someEnabled,
      }));

    updatedInterceptors.forEach(updateInterceptor);

    Object.entries(
      groupBy(updatedInterceptors, (interceptor) => interceptor.name),
    ).forEach(([name, data]) => {
      sendMessageToPlugin(
        "interceptors:update",
        {
          name,
          data,
          timestamp: Date.now(),
        },
        tabId,
      );
    });
  };

  const onGoToInterceptorClick = useCallback((interceptorId: InterceptorId) => {
    setInterceptorsFilter(String(interceptorId));
  }, []);

  return (
    <Flex height="100cqh" direction="column">
      <Header />
      <MainContainer
        First={
          <>
            <MessagesHeader
              filterPatterns={filterPatterns}
              onClearMessages={clearMessages}
              onFilterPatternsChange={setFilterPatterns}
            />
            <MessagesTableContainer
              onTweak={createInterceptorByMessage}
              messages={messages}
              highllightByInterceptor={highlightedInterceptorMessages}
              filterPatterns={deferredFilterPatterns}
              onGoToInterceptorClick={onGoToInterceptorClick}
              className={css`
                opacity: ${deferredFilterPatterns === filterPatterns
                  ? undefined
                  : 0.5};
              `}
            />
          </>
        }
        Second={
          <>
            <InterceptorsHeader
              interceptors={interceptors}
              onToggleInterceptors={toggleInterceptors}
              onClearInterceptors={clearInterceptors}
              appNames={appNames}
              interceptorsFilter={interceptorsFilter}
              onInterceptorCreate={onInterceptorCreate}
              onInterceptorsFilterChange={setInterceptorsFilter}
            />
            <InterceptorsListContainer
              interceptors={interceptors}
              onInterceptorChange={onInterceptorChange}
              onInterceptorRemove={onInterceptorRemove}
              onFilterMessages={onFilterMessages}
              onDuplicate={onInterceptorDuplicate}
              onHightLightInterceptor={setHighlightedInterceptorMessages}
              filter={deferredInterceptorsFilter}
              className={css`
                opacity: ${deferredInterceptorsFilter === interceptorsFilter
                  ? undefined
                  : 0.5};
              `}
            />
          </>
        }
      />
      <Footer
        connected={connected}
        interceptors={interceptors}
        messages={messages}
      />
    </Flex>
  );
}
