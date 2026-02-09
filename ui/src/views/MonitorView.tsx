import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function MonitorView() {
  // Mock data - replace with real API call
  const activeSessions = [
    { id: '1', wristbandCode: 'WX001', remainingMinutes: 12, remainingSeconds: 45, status: 'ACTIVE' },
    { id: '2', wristbandCode: 'WX002', remainingMinutes: 8, remainingSeconds: 30, status: 'ACTIVE' },
    { id: '3', wristbandCode: 'WX003', remainingMinutes: 3, remainingSeconds: 15, status: 'ACTIVE' },
    { id: '4', wristbandCode: 'WX004', remainingMinutes: -2, remainingSeconds: 30, status: 'ACTIVE' },
    { id: '5', wristbandCode: 'WX005', remainingMinutes: 15, remainingSeconds: 0, status: 'PAUSED' },
  ]

  const getTimeColor = (minutes: number) => {
    if (minutes > 5) return 'text-green-500'
    if (minutes >= 0) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getProgressColor = (minutes: number) => {
    if (minutes > 5) return 'bg-green-500'
    if (minutes >= 0) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getProgressValue = (minutes: number, totalMinutes: number = 30) => {
    const percentage = Math.max(0, Math.min(100, (minutes / totalMinutes) * 100))
    return percentage
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Monitor Público</h2>
        <p className="text-muted-foreground">
          Visualización en tiempo real de sesiones activas
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">En Juego</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {activeSessions.filter(s => s.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pausados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {activeSessions.filter(s => s.status === 'PAUSED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ocupación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {Math.round((activeSessions.filter(s => s.status === 'ACTIVE').length / 20) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* In the Air */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-500">En el Aire</CardTitle>
            <CardDescription>
              Sesiones activas consumiendo tiempo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSessions
              .filter(s => s.status === 'ACTIVE')
              .map((session) => (
                <div key={session.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-lg">{session.wristbandCode}</span>
                    <span className={`font-mono text-lg font-bold ${getTimeColor(session.remainingMinutes)}`}>
                      {String(session.remainingMinutes).padStart(2, '0')}:
                      {String(session.remainingSeconds).padStart(2, '0')}
                    </span>
                  </div>
                  <Progress 
                    value={getProgressValue(session.remainingMinutes)} 
                    className="h-2"
                  />
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Preparing for Landing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-500">Preparando Aterrizaje</CardTitle>
            <CardDescription>
              Sesiones con tiempo bajo o pausadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSessions
              .filter(s => s.status === 'PAUSED' || s.remainingMinutes <= 5)
              .map((session) => (
                <div key={session.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-lg">{session.wristbandCode}</span>
                    <div className="flex items-center gap-2">
                      {session.status === 'PAUSED' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          PAUSADO
                        </span>
                      )}
                      <span className={`font-mono text-lg font-bold ${getTimeColor(session.remainingMinutes)}`}>
                        {String(session.remainingMinutes).padStart(2, '0')}:
                        {String(session.remainingSeconds).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={getProgressValue(session.remainingMinutes)} 
                    className="h-2"
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Color Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Leyenda de Colores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Verde: +5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Amarillo: -5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Rojo: Tiempo excedido</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
