import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function CheckInView() {
  const [wristbandCode, setWristbandCode] = useState('')
  const [selectedMinutes, setSelectedMinutes] = useState(30)

  const timePresets = [15, 30, 45, 60, 90, 120]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Check-in</h2>
        <p className="text-muted-foreground">
          Asigna tiempo y productos a una pulsera
        </p>
      </div>

      {/* Wristband Input */}
      <Card>
        <CardHeader>
          <CardTitle>Código de Pulsera</CardTitle>
          <CardDescription>
            Escanea o ingresa el código QR/Barcode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wristband">Código</Label>
            <Input
              id="wristband"
              placeholder="Ingrese o escanee código"
              value={wristbandCode}
              onChange={(e) => setWristbandCode(e.target.value)}
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tiempo de Juego</CardTitle>
          <CardDescription>
            Selecciona los minutos a asignar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {timePresets.map((minutes) => (
              <Button
                key={minutes}
                variant={selectedMinutes === minutes ? 'default' : 'outline'}
                onClick={() => setSelectedMinutes(minutes)}
                className="h-16 text-lg"
              >
                {minutes} min
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Adicionales</CardTitle>
          <CardDescription>
            Agrega medias, bebidas u otros productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            🛒 Productos próximamente
          </div>
        </CardContent>
      </Card>

      {/* Transaction */}
      <Card>
        <CardHeader>
          <CardTitle>Transacción</CardTitle>
          <CardDescription>
            Número de transacción (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="transaction">N° Transacción</Label>
            <Input
              id="transaction"
              placeholder="Opcional"
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          size="lg"
          className="flex-1 h-14 text-lg"
          disabled={!wristbandCode}
        >
          ✅ Procesar Check-in
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 h-14 text-lg"
          onClick={() => setWristbandCode('')}
        >
          🔄 Limpiar
        </Button>
      </div>
    </div>
  )
}
