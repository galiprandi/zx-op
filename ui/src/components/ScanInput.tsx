import { Scan } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ScanInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showScanButton?: boolean;
}

export function ScanInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Código de pulsera",
  className = "",
  disabled = false,
  showScanButton = true,
}: ScanInputProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    if (disabled || isScanning) return;
    
    // For now, just trigger manual input mode
    // In a real implementation, this would open the camera scanner
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit?.();
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "text-lg pr-16 h-14 bg-card border-border",
          className
        )}
      />
      
      {showScanButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleScan}
          disabled={disabled || isScanning}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-accent"
        >
          {isScanning ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Scan className="w-5 h-5 text-primary" />
          )}
        </Button>
      )}
    </div>
  );
}
