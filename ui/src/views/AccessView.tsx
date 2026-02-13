import { QrCode } from "lucide-react";
import { DesktopShell } from "@/components/DesktopShell";
import QRCodeModule from "react-qr-code";
import type { FC } from "react";
import type { QRCodeProps } from "react-qr-code";

const quickLinks = [
  { label: "Operación", path: "/" },
  { label: "Check-in", path: "/checkin" },
];

// react-qr-code exports a default QRCode component (per docs). We resolve it once.
const QRCodeComponent = ((QRCodeModule as { default?: unknown }).default ?? QRCodeModule) as unknown as FC<QRCodeProps>;

export function AccessView() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <DesktopShell>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Accesos rápidos</h1>
            <p className="text-sm text-muted-foreground">
              Escanea estos códigos para abrir las vistas de Operación y Check-in al iniciar el día.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {quickLinks.map((link) => (
            <div
              key={link.path}
              className="rounded-xl border border-border/40 bg-card/70 p-4 shadow-sm flex flex-col items-center gap-3"
            >
              <QRCodeComponent
                value={`${origin}${link.path}`}
                size={160}
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground"
              />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground break-all">{`${origin}${link.path}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}
