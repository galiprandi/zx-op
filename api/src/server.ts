import fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

const server = fastify({
  logger: true,
})

// Register plugins
await server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
})

await server.register(websocket)

// Prisma client
const prisma = new PrismaClient()

// Socket.IO setup
const httpServer = createServer(server.server)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.WS_CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Basic API routes
server.get('/api/wristbands', async () => {
  const wristbands = await prisma.wristband.findMany({
    include: {
      user: true,
      sessions: {
        where: { status: { in: ['ACTIVE', 'PAUSED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })
  return wristbands
})

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001')
    const host = process.env.HOST || '0.0.0.0'
    
    await server.listen({ port, host })
    httpServer.listen(port + 1) // Socket.IO on port+1
    
    console.log(`🚀 Server ready at http://${host}:${port}`)
    console.log(`🔌 Socket.IO ready at http://${host}:${port + 1}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
