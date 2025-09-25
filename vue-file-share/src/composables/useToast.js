import { useToast as useToastification } from "vue-toastification";
import { h } from "vue";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";

export function useToast() {
  const toast = useToastification();

  const createToastContent = (message, IconComponent, iconClass = "h-5 w-5") => {
    return h("div", { class: "flex items-center space-x-2" }, [
      h(IconComponent, { class: iconClass }),
      h("span", message),
    ]);
  };

  const success = (message) => {
    toast.success(createToastContent(message, CheckCircleIcon, "h-5 w-5 text-green-400"), {
      toastClassName: "toast-success-custom"
    });
  };

  const error = (message) => {
    toast.error(createToastContent(message, XCircleIcon, "h-5 w-5 text-red-400"), {
      toastClassName: "toast-error-custom"
    });
  };

  const warning = (message) => {
    toast.warning(createToastContent(message, ExclamationTriangleIcon, "h-5 w-5 text-yellow-400"), {
      toastClassName: "toast-warning-custom"
    });
  };

  const info = (message) => {
    toast.info(createToastContent(message, InformationCircleIcon, "h-5 w-5 text-blue-400"), {
      toastClassName: "toast-info-custom"
    });
  };

  return {
    success,
    error,
    warning,
    info,
  };
}
