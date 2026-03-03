import { toast } from "sonner";
import { RadixToast, ToastType } from "./RadixToast";
import { ReactNode } from "react";

export function notify(message: ReactNode, type: ToastType = "info") {
  return toast.custom((t) => (
    <RadixToast t={t} message={message} type={type} />
  ));
}
