import { css, keyframes } from "@emotion/css";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { EXTENSION_OWNER, InterceptorPayload } from "@tweaker/extension-plugin";
import { getBackgroundColor, getTextColor } from "../../../utils/colors";
import equal from "fast-deep-equal";
import { Badge } from "../../../components/Badge";
import { DeleteIcon, SelectIcon, ExportIcon } from "@devtools-ds/icon";
import { ButtonIcon } from "../../../components/ButtonIcon";
import { parsePatterns, serializePatterns } from "../../../utils/pattern";
import { useThrottle } from "@uidotdev/usehooks";
import {
  Text,
  Code,
  Flex,
  Badge as RadixBadge,
  Switch,
} from "@radix-ui/themes";
import { SourceCodePopover } from "../../../components/SourceCodePopover";
import { CSSTransition } from "react-transition-group";
import { Tooltip, TooltipStyles } from "../../../components/base/Tooltip";
import { BreakpointIcon } from "../../../icons/BreakpointIcon";
import { BreakpointCrossedIcon } from "../../../icons/BreakpointCrossedIcon";
import {
  BarChartIcon,
  DrawingPinFilledIcon,
  DrawingPinIcon,
} from "@radix-ui/react-icons";
import { useInterceptedCountsStore } from "../useInterceptedCountsStore";
import { DefaultInterceptorForm } from "./InterceptorFormDefault";
import { InterceptorFormFetch } from "./InterceptorFormFetch";

export type ExtensionInterceptor = InterceptorPayload<unknown> & {
  // sampleIds?: string[];
  // fromKey?: string;
  // sampleId?: string;
};

export interface InterceptorItemProps {
  interceptor: ExtensionInterceptor;
  onChange?: (interceptor: ExtensionInterceptor) => void;
  onRemove?: (interceptor: ExtensionInterceptor) => void;
  onFilterMessages?: (patterns: string[]) => void;
  onDuplicate?: (interceptor: ExtensionInterceptor) => void;
  onHightLightInterceptor?: (
    interceptor: ExtensionInterceptor | undefined,
  ) => void;
}

export function InterceptorItem({
  interceptor,
  onChange,
  onRemove,
  onFilterMessages,
  onDuplicate,
  onHightLightInterceptor,
}: InterceptorItemProps) {
  const [data, setData] = useState(() => interceptor.data);

  const [patterns, setPatterns] = useState(() =>
    serializePatterns(interceptor.patterns),
  );

  const isByExtension = interceptor.owner === EXTENSION_OWNER;
  const canChangeValue = isByExtension;

  useEffect(() => {
    setPatterns(serializePatterns(interceptor.patterns));
  }, [interceptor.patterns]);

  const hasChanges = useMemo(() => {
    return !equal(interceptor.data, data);
  }, [data, interceptor.data]);

  const appColor = getTextColor(interceptor.name);
  const appBackgroundColor = getBackgroundColor(interceptor.name);

  const onHightLight = useEffectEvent(
    (interceptor: ExtensionInterceptor | undefined) => {
      onHightLightInterceptor?.(interceptor);
    },
  );

  useEffect(() => {
    return () => {
      onHightLight(undefined);
    };
  }, []);

  const interceptedCount = useDeferredValue(
    useInterceptedCountsStore(
      (state) => state.interceptedCounts.get(interceptor.id) ?? 0,
    ),
  );

  const interceptedCountThrottled = useThrottle(interceptedCount, 10);

  const uniqueId = useMemo(() => {
    return `${interceptor.name}-${interceptor.id}`;
  }, [interceptor]);

  const nodeRef = useRef(null);

  const inAnimate = useMemo(() => {
    return Date.now() - interceptor.timestamp < 1000;
  }, [interceptor.timestamp]);

  const [persistent, setPersistent] = useState(false); // TODO: save in storage

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={inAnimate}
      appear
      timeout={1000}
      classNames="bounce"
    >
      <CSSTransition
        nodeRef={nodeRef}
        in={interceptedCount > interceptedCountThrottled}
        enter
        timeout={2000}
        classNames="intercepted"
      >
        <Flex
          data-interceptor-id={interceptor.id}
          ref={nodeRef}
          onMouseEnter={() =>
            onHightLight({
              ...interceptor,
              patterns: parsePatterns(patterns),
            })
          }
          onMouseLeave={() => onHightLight(undefined)}
          direction="column"
          p="3"
          gap="2"
          position="relative"
          style={{
            "--background-color": "var(--color-panel-solid)",
            "--active-background-color": appBackgroundColor,
            "--interceptor-name-color": appColor,
          }}
          data-enabled={interceptor.enabled}
          className={styles.Container}
        >
          <Flex gap="1" align="center" justify="between">
            <Flex gap="1" align="center" wrap="wrap">
              <Switch
                id={`${uniqueId}-enabled`}
                checked={interceptor.enabled}
                title={
                  interceptor.enabled
                    ? "Disable interceptor"
                    : "Enable interceptor"
                }
                size="1"
                onCheckedChange={(checked) => {
                  onChange?.({
                    ...interceptor,
                    enabled: Boolean(checked),
                  });
                }}
              />
              <Text
                as="label"
                htmlFor={`${uniqueId}-enabled`}
                weight="bold"
                size="3"
                className={css`
                  color: var(--interceptor-name-color);
                `}
              >
                {interceptor.name}
              </Text>
              <ButtonIcon
                title="Remove interceptor"
                disabled={persistent}
                onClick={() => onRemove?.(interceptor)}
              >
                <DeleteIcon size="medium" />
              </ButtonIcon>
              {onFilterMessages && (
                <ButtonIcon
                  disabled={parsePatterns(patterns).length === 0}
                  title={
                    parsePatterns(patterns).length === 0
                      ? undefined
                      : `Filter messages by patterns "${patterns}"`
                  }
                  onClick={() => onFilterMessages(interceptor.patterns)}
                >
                  <SelectIcon size="medium" />
                </ButtonIcon>
              )}
              {onDuplicate && (
                <ButtonIcon
                  title="Duplicate interceptor"
                  onClick={() => onDuplicate(interceptor)}
                >
                  <ExportIcon size="medium" />
                </ButtonIcon>
              )}
              {!isByExtension &&
                (interceptor.sourceCode || interceptor.stack) && (
                  <SourceCodePopover
                    code={interceptor.sourceCode}
                    stack={interceptor.stack}
                    title="Show interceptor source code (formatted)"
                    size="medium"
                  />
                )}
              <RadixBadge
                title={new Date(interceptor.timestamp).toLocaleString()}
                color="cyan"
              >
                <Text size="1" weight="bold">
                  {interceptor.id}
                </Text>
              </RadixBadge>
              {interceptedCount > 0 && (
                <RadixBadge
                  title="Count of intercepted messages"
                  color="blue"
                  variant="solid"
                  radius="full"
                >
                  <BarChartIcon width={12} height={12} />
                  <Text as="label" size="1" weight="bold">
                    {interceptedCount} hits
                  </Text>
                </RadixBadge>
              )}
            </Flex>
            <Flex gap="1" align="center" wrap="wrap">
              {isByExtension && (
                <Tooltip
                  content={
                    <Flex asChild direction="column" gap="1">
                      <ul className={TooltipStyles.ContentList}>
                        <li>
                          <Text size="2">
                            Saves interceptor to persistent storage, so it will
                            be recreated on following page reloads
                          </Text>
                        </li>
                        <li>
                          <Text size="2" weight="bold">
                            Available only for interceptors created by Tweaker
                            DevTools
                          </Text>
                        </li>
                      </ul>
                    </Flex>
                  }
                >
                  <ButtonIcon
                    disabled={!interceptor.enabled}
                    onClick={() => {
                      setPersistent((v) => !v);
                    }}
                    className={css`
                      && {
                        padding: 3px;
                      }
                    `}
                  >
                    {persistent ? (
                      <DrawingPinFilledIcon
                        color="var(--indigo-9)"
                        width="20"
                        height="20"
                      />
                    ) : (
                      <DrawingPinIcon width="20" height="20" />
                    )}
                  </ButtonIcon>
                </Tooltip>
              )}
              <Tooltip
                content={
                  <Flex asChild direction="column" gap="1">
                    <ul className={TooltipStyles.ContentList}>
                      <li>
                        <Text size="2">
                          Stops code via{" "}
                          <Code variant="solid" color="yellow">
                            debugger
                          </Code>{" "}
                          before result return
                        </Text>
                      </li>
                      <li>
                        <Text size="2">
                          Works only if Browser's DevTools panel is open
                        </Text>
                      </li>
                      <li>
                        <Text size="2">
                          May not work if your bundler removes{" "}
                          <Code variant="solid" color="yellow">
                            debugger
                          </Code>{" "}
                          statements from libraries, e.g. if you have:
                        </Text>
                        <Flex asChild direction="column" gap="1">
                          <ul className={TooltipStyles.ContentList}>
                            <li>
                              <Code variant="solid" color="yellow">
                                terserOptions.compress.drop_debugger
                              </Code>
                            </li>
                            <li>
                              <Code variant="solid" color="yellow">
                                esbuild.drop: ['debugger']
                              </Code>
                            </li>
                          </ul>
                        </Flex>
                      </li>
                    </ul>
                  </Flex>
                }
              >
                <ButtonIcon
                  disabled={!interceptor.enabled}
                  onClick={() => {
                    onChange?.({
                      ...interceptor,
                      interactive: !interceptor.interactive,
                    });
                  }}
                  className={css`
                    && {
                      padding: 3px;
                    }
                  `}
                >
                  {interceptor.interactive ? (
                    <BreakpointIcon
                      width="20"
                      height="20"
                      color="var(--indigo-9)"
                    />
                  ) : (
                    <BreakpointCrossedIcon width="20" height="20" />
                  )}
                </ButtonIcon>
              </Tooltip>
            </Flex>
          </Flex>
          {interceptor.type === "default" && (
            <DefaultInterceptorForm
              interceptor={interceptor}
              onChange={onChange}
              onRemove={onRemove}
              onFilterMessages={onFilterMessages}
              onDuplicate={onDuplicate}
              onHightLightInterceptor={onHightLightInterceptor}
              data={data}
              setData={setData}
              patterns={patterns}
              setPatterns={setPatterns}
              hasChanges={hasChanges}
            />
          )}
          {interceptor.type === "fetch" && (
            <InterceptorFormFetch
              interceptor={interceptor}
              onChange={onChange}
              onRemove={onRemove}
              onFilterMessages={onFilterMessages}
              onDuplicate={onDuplicate}
              onHightLightInterceptor={onHightLightInterceptor}
              data={data}
              setData={setData}
              patterns={patterns}
              setPatterns={setPatterns}
              hasChanges={hasChanges}
            />
          )}
          <Badge
            position="bottom-right"
            appearance={
              canChangeValue ? (hasChanges ? "warn" : "primary") : "secondary"
            }
          >
            <Flex gap="1">
              <Text size="2" weight="bold">
                {interceptor.owner}
              </Text>
            </Flex>
          </Badge>
        </Flex>
      </CSSTransition>
    </CSSTransition>
  );
}

const bounceAnimation = keyframes`
  from { background-color: var(--orange-4); }
  to { background-color: var(--background-color); }
`;

const interceptedAnimation = keyframes`
  from { background-color: var(--indigo-6); }
  to { background-color: var(--background-color); }
`;

const styles = {
  Container: css`
    border: 1.5px solid var(--interceptor-name-color);
    border-left-width: 6px;
    border-radius: 10px;
    background-color: var(--background-color);

    &[data-enabled="false"] {
      opacity: 0.6;
    }

    :hover {
      background-color: var(--active-background-color);
    }
    &.bounce-appear-active {
      animation: ${bounceAnimation} 1s ease;
    }
    &&.intercepted-enter-active,
    &&.intercepted-exit-active {
      animation: ${interceptedAnimation} 2s ease;
    }
  `,
};
