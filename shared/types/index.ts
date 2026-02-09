export enum SessionStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED'
}

export enum EventType {
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_STARTED = 'SESSION_STARTED',
  SESSION_PAUSED = 'SESSION_PAUSED',
  SESSION_RESUMED = 'SESSION_RESUMED',
  SESSION_ENDED = 'SESSION_ENDED',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  WRISTBAND_SCANNED = 'WRISTBAND_SCANNED'
}

export interface User {
  id: string
  name?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface Wristband {
  id: string
  qrCode: string
  userId?: string
  user?: User
  sessions?: Session[]
  transactions?: Transaction[]
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  wristbandId: string
  wristband?: Wristband
  status: SessionStatus
  purchasedMinutes: number
  startTime?: Date
  endTime?: Date
  lastPauseTime?: Date
  createdAt: Date
  updatedAt: Date
  events?: Event[]
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  wristbandId: string
  wristband?: Wristband
  productId: string
  product?: Product
  quantity: number
  totalPrice: number
  createdAt: Date
}

export interface Event {
  id: string
  sessionId: string
  session?: Session
  type: EventType
  data?: any
  createdAt: Date
}

// Socket.IO event types
export interface CacheInvalidateEvent {
  queryKey: string[]
  data: any
}

export interface SocketEvents {
  'cache-invalidate': CacheInvalidateEvent
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// Time calculation utilities
export interface TimeRemaining {
  minutes: number
  seconds: number
  isExpired: boolean
  colorCode: 'green' | 'yellow' | 'red'
}

export function calculateRemainingTime(session: Session): TimeRemaining {
  if (!session.startTime || session.status !== SessionStatus.ACTIVE) {
    return { minutes: 0, seconds: 0, isExpired: true, colorCode: 'red' }
  }

  const now = new Date()
  const elapsed = now.getTime() - session.startTime.getTime()
  const remainingMs = (session.purchasedMinutes * 60 * 1000) - elapsed
  
  if (remainingMs <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true, colorCode: 'red' }
  }

  const minutes = Math.floor(remainingMs / (60 * 1000))
  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000)
  const isExpired = remainingMs <= 0
  const colorCode = remainingMs > 5 * 60 * 1000 ? 'green' : 'yellow'

  return { minutes, seconds, isExpired, colorCode }
}
