import { QueryClient } from '@tanstack/react-query'
import { vi } from 'vitest'

export interface QueryInvalidation {
  args: Array<{ queryKey: readonly unknown[] }>
  timestamp: number
}

export interface MonitoredQueryClient {
  client: QueryClient
  invalidations: QueryInvalidation[]
  getInvalidationCount: () => number
  getInvalidationsByKey: (key: string) => QueryInvalidation[]
  clearInvalidations: () => void
}

export const createMonitoredQueryClient = (): MonitoredQueryClient => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Don't cache in tests
      },
    },
  })
  
  const invalidations: QueryInvalidation[] = []
  const originalInvalidate = client.invalidateQueries.bind(client)
  
  const monitoredInvalidate = (...args: Parameters<typeof client.invalidateQueries>) => {
    invalidations.push({
      args: args as Array<{ queryKey: readonly unknown[] }>,
      timestamp: Date.now()
    })
    return originalInvalidate(...args)
  }
  
  client.invalidateQueries = monitoredInvalidate
  
  return {
    client,
    invalidations,
    getInvalidationCount: () => invalidations.length,
    getInvalidationsByKey: (key: string) => {
      return invalidations.filter(invalidation => 
        invalidation.args.some(arg => 
          JSON.stringify(arg.queryKey).includes(key)
        )
      )
    },
    clearInvalidations: () => {
      invalidations.length = 0
    }
  }
}

// Performance measurement utilities
export interface SocketPerformanceMetrics {
  apiCalls: number
  uiUpdateLatency: number
  eventProcessingTime: number
  memoryUsage: number
}

export const measureSocketPerformance = async (
  scenario: string,
  socketEvents: Array<{ event: string; data: unknown; expectedInvalidations: number }>
): Promise<SocketPerformanceMetrics> => {
  const { client, invalidations } = createMonitoredQueryClient()
  const startTime = performance.now()
  
  // Simulate socket events
  for (const { event, data } of socketEvents) {
    const eventStart = performance.now()
    
    // Simulate socket event processing
    await new Promise(resolve => setTimeout(resolve, 1))
    
    const eventEnd = performance.now()
    
    // Track performance
    // In real tests, this would trigger actual socket handlers
  }
  
  const endTime = performance.now()
  
  return {
    apiCalls: invalidations.length,
    uiUpdateLatency: endTime - startTime,
    eventProcessingTime: 0, // Would be measured in actual implementation
    memoryUsage: 0 // Would be measured with performance.memory in browser
  }
}

// Test data factories
export const createMockPlayerSession = (overrides: Partial<unknown> = {}) => ({
  id: 'session-1',
  barcodeId: '123456',
  isActive: true,
  remainingSeconds: 1800,
  remainingMinutes: 30,
  status: 'playing',
  playerName: 'Test Player',
  startTime: new Date().toISOString(),
  ...overrides
})

export const createMockTransaction = (overrides: Partial<unknown> = {}) => ({
  id: 'transaction-1',
  playerSessionId: 'session-1',
  productId: 'product-1',
  quantity: 1,
  totalPrice: 5000,
  createdAt: new Date().toISOString(),
  ...overrides
})

export const createMockProduct = (overrides: Partial<unknown> = {}) => ({
  id: 'product-1',
  name: '30 minutos',
  price: 5000,
  timeValueSeconds: 1800,
  required: true,
  type: 'time',
  ...overrides
})

export const createMockDashboardStats = (overrides: Partial<unknown> = {}) => ({
  totalRevenue: 15000,
  activePlayers: 5,
  totalTransactions: 12,
  averageSessionTime: 25,
  occupancyRate: 0.6,
  ...overrides
})
