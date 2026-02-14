import { vi } from 'vitest'

// Mock socket utilities for testing
export interface MockSocket {
  on: (event: string, callback: Function) => void
  emit: (event: string, data?: any) => void
  off: (event: string, callback: Function) => void
  disconnect: () => void
  getListenerCount: () => number
  getListeners: () => Map<string, Function[]>
  clearListeners: () => void
}

export const createMockSocket = (): MockSocket => {
  const listeners = new Map<string, Function[]>()
  
  return {
    on: (event: string, callback: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event)!.push(callback)
    },
    
    emit: (event: string, data?: unknown) => {
      const eventListeners = listeners.get(event) || []
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error)
        }
      })
    },
    
    off: (event: string, callback: Function) => {
      const eventListeners = listeners.get(event) || []
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    },
    
    disconnect: () => {
      listeners.clear()
    },
    
    getListenerCount: () => {
      return Array.from(listeners.values()).reduce((total, eventListeners) => total + eventListeners.length, 0)
    },
    
    getListeners: () => {
      return new Map(listeners)
    },
    
    clearListeners: () => {
      listeners.clear()
    }
  }
}

// Mock socket.io client
export const mockSocketIO = {
  connect: vi.fn(() => createMockSocket()),
  createMockSocket
}

// Test data for socket events
export const mockSocketEvents = {
  sessionCreated: {
    playerSession: {
      id: 'session-1',
      barcodeId: '123456',
      isActive: true,
      remainingSeconds: 1800,
      status: 'playing'
    },
    activeSessions: [
      {
        id: 'session-1',
        barcodeId: '123456',
        playerName: 'Test Player',
        remainingSeconds: 1800,
        status: 'playing'
      }
    ]
  },
  
  sessionUpdated: {
    playerSession: {
      id: 'session-1',
      barcodeId: '123456',
      isActive: true,
      remainingSeconds: 1500, // Reduced time
      status: 'playing'
    },
    dashboardStats: {
      totalRevenue: 15000,
      activePlayers: 5,
      totalTransactions: 12
    }
  },
  
  transactionCreated: {
    transaction: {
      id: 'transaction-1',
      playerSessionId: 'session-1',
      productId: 'product-1',
      quantity: 1,
      totalPrice: 5000,
      createdAt: new Date().toISOString()
    },
    dashboardStats: {
      totalRevenue: 20000, // Increased
      activePlayers: 5,
      totalTransactions: 13 // Increased
    }
  },
  
  productCreated: {
    product: {
      id: 'product-3',
      name: 'Nuevo producto',
      price: 3000,
      required: false,
      type: 'extra'
    }
  }
}
