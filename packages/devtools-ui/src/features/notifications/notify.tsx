import { RadixToast, ToastType } from "./RadixToast";
import { ReactNode } from "react";

export async function notify(message: ReactNode, type: ToastType = "info") {
  const { toast } = await import("../../libs/sonner");
  return toast.custom((t) => (
    <RadixToast t={t} message={message} type={type} dismiss={toast.dismiss} />
  ));
}
