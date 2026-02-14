import { Check, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./GlassCard";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type: "success" | "error" | "info";
  details?: React.ReactNode;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

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

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type, 
  details,
  autoClose = false,
  autoCloseDelay = 3000
}: ModalProps) {
  const config = modalConfig[type];
  const Icon = config.icon;

  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, isOpen, onClose, autoCloseDelay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <GlassCard className={`w-full max-w-sm text-center ${config.cardBg}`}>
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
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
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p className="text-sm text-muted-foreground mb-4">
            {message}
          </p>
        )}

        {/* Details */}
        {details && (
          <div className="text-sm text-muted-foreground space-y-2 mb-6">
            {details}
          </div>
        )}

        {/* Close Button */}
        {!autoClose && (
          <Button
            type="button"
            onClick={onClose}
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
