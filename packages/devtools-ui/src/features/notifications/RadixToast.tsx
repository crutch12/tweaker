import { Callout, IconButton, Text } from "@radix-ui/themes";
import {
  ExclamationTriangleIcon,
  InfoCircledIcon,
  Cross1Icon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { ReactNode } from "react";
import type { toast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  t: string | number;
  message: ReactNode;
  type: ToastType;
  dismiss: (typeof toast)["dismiss"];
}

export function RadixToast({ t, message, type, dismiss }: ToastProps) {
  const config = {
    success: {
      color: "green",
      backgroundColor: "var(--green-3)",
      icon: <CheckIcon />,
    },
    error: {
      color: "red",
      backgroundColor: "var(--red-3)",
      icon: <ExclamationTriangleIcon />,
    },
    info: {
      color: "blue",
      backgroundColor: "var(--blue-3)",
      icon: <InfoCircledIcon />,
    },
    warning: {
      color: "amber",
      backgroundColor: "var(--amber-3)",
      icon: <ExclamationTriangleIcon />,
    },
  } as const;

  const { color, backgroundColor, icon } = config[type];

  return (
    <Callout.Root
      size="2"
      color={color}
      style={{
        width: "350px",
        boxShadow: "var(--shadow-4)",
        borderRadius: "var(--radius-4)",
        backgroundColor,
      }}
    >
      <Callout.Icon>{icon}</Callout.Icon>
      <Callout.Text>
        <Text size="2" weight="bold">
          {message}
        </Text>
      </Callout.Text>

      <IconButton
        variant="ghost"
        color="gray"
        highContrast
        size="1"
        onClick={() => dismiss(t)}
        style={{
          position: "absolute",
          top: "var(--space-2)",
          right: "var(--space-2)",
        }}
      >
        <Cross1Icon width="12" height="12" />
      </IconButton>
    </Callout.Root>
  );
}
