import { http, HttpResponse } from 'msw'

// Mock API handlers for testing
export const handlers = [
  // Products API
  http.get('/api/products', () => {
    return HttpResponse.json([
      {
        id: 'product-1',
        name: '30 minutos',
        price: 5000,
        timeValueSeconds: 1800,
        required: true,
        type: 'time'
      },
      {
        id: 'product-2',
        name: 'Sock especial',
        price: 2000,
        required: false,
        type: 'extra'
      }
    ])
  }),

  // Player Session API
  http.get('/api/player-session/:barcodeId', ({ params }) => {
    const { barcodeId } = params
    return HttpResponse.json({
      playerSession: {
        id: 'session-1',
        barcodeId,
        isActive: true,
        remainingSeconds: 1800,
        remainingMinutes: 30,
        status: 'playing'
      }
    })
  }),

  // Dashboard Stats API
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json({
      totalRevenue: 15000,
      activePlayers: 5,
      totalTransactions: 12,
      averageSessionTime: 25,
      occupancyRate: 0.6
    })
  }),

  // Active Sessions API
  http.get('/api/sessions/active', () => {
    return HttpResponse.json([
      {
        id: 'session-1',
        barcodeId: '123456',
        playerName: 'Juan Pérez',
        remainingSeconds: 1800,
        status: 'playing',
        startTime: new Date().toISOString()
      },
      {
        id: 'session-2',
        barcodeId: '789012',
        playerName: 'María García',
        remainingSeconds: 900,
        status: 'paused',
        startTime: new Date().toISOString()
      }
    ])
  }),

  // Check-in API
  http.post('/api/checkin', () => {
    return HttpResponse.json({
      playerSession: {
        id: 'session-3',
        barcodeId: '345678',
        isActive: true,
        remainingSeconds: 2400,
        remainingMinutes: 40,
        status: 'playing'
      },
      transactions: [{
        id: 'transaction-1',
        playerSessionId: 'session-3',
        productId: 'product-1',
        quantity: 1,
        totalPrice: 5000,
        createdAt: new Date().toISOString()
      }],
      totalSecondsAdded: 1800
    })
  })
]
