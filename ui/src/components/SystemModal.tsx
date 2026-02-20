import { Check, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./GlassCard";
import { useUi } from "@/providers/UIProvider";
import { modalOverlayClass, modalPanelBaseClass } from "./modalStyles";

const modalConfig = {
  success: {
    icon: Check,
    bgColor: "bg-green-500/20",
    iconColor: "text-green-400",
    titleColor: "text-green-400",
    cardBg: "bg-white",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-500/20",
    iconColor: "text-red-400",
    titleColor: "text-red-400",
    cardBg: "bg-white",
  },
  info: {
    icon: AlertCircle,
    bgColor: "bg-blue-500/20",
    iconColor: "text-blue-400",
    titleColor: "text-blue-400",
    cardBg: "bg-white",
  },
};

export function SystemModal() {
  const { modal, hideModal } = useUi();
  const config = modalConfig[modal.type];
  const Icon = config.icon;

  React.useEffect(() => {
    if (modal.autoClose && modal.isOpen) {
      const timer = setTimeout(() => {
        hideModal();
      }, modal.autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [modal.autoClose, modal.isOpen, hideModal, modal.autoCloseDelay]);

  if (!modal.isOpen) return null;

  return (
    <div className={modalOverlayClass}>
      <GlassCard className={`${modalPanelBaseClass} max-w-sm text-center ${config.cardBg}`}>
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={hideModal}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className={`text-xl font-bold ${config.titleColor} mb-4`}>
          {modal.title}
        </h3>

        {/* Message */}
        {modal.message && (
          <p className="text-sm text-muted-foreground mb-4">
            {modal.message}
          </p>
        )}

        {/* Details */}
        {modal.details && (
          <div className="text-sm text-muted-foreground space-y-2 mb-6">
            {modal.details}
          </div>
        )}

        {/* Close Button */}
        {!modal.autoClose && (
          <Button
            type="button"
            onClick={hideModal}
            className="w-full h-12"
          >
            Cerrar
          </Button>
        )}
      </GlassCard>
    </div>
  );
}

// Import React for useEffect
import React from "react";
