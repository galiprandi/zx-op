import { Play, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: "play" | "pause";
  loading?: boolean;
  barcodeId?: string;
}

const actionConfig = {
  play: {
    title: "Iniciar Juego",
    description: "¿Estás seguro de que quieres iniciar el juego para esta sesión?",
    icon: Play,
    confirmText: "Iniciar",
    color: "bg-green-600 hover:bg-green-700",
  },
  pause: {
    title: "Pausar Juego", 
    description: "¿Estás seguro de que quieres pausar el juego? El tiempo se detendrá.",
    icon: Pause,
    confirmText: "Pausar",
    color: "bg-orange-600 hover:bg-orange-700",
  },
};

export function ConfirmSheet({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  loading = false,
  barcodeId 
}: ConfirmSheetProps) {
  const config = actionConfig[action];
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <GlassCard className="w-full max-w-sm animate-slideIn">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", config.color)}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {config.title}
              </h3>
              {barcodeId && (
                <p className="text-sm text-muted-foreground">
                  Código: {barcodeId}
                </p>
              )}
            </div>
          </div>
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

        <p className="text-muted-foreground mb-6">
          {config.description}
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={cn("flex-1 h-12 text-white", config.color)}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Icon className="w-4 h-4 mr-2" />
                {config.confirmText}
              </>
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
