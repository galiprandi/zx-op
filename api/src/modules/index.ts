import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

// Services
import { WristbandService } from './wristbands/services/wristbandService';
import { ProductService } from './products/services/productService';
import { SessionService } from './sessions/services/sessionService';
import { TransactionService } from './transactions/services/transactionService';
import { EventService } from './events/services/eventService';
import { CheckinService } from './checkin/services/checkinService';

// Controllers
import { WristbandController } from './wristbands/controllers/wristbandController';
import { ProductController } from './products/controllers/productController';
import { SessionController } from './sessions/controllers/sessionController';
import { TransactionController } from './transactions/controllers/transactionController';
import { EventController } from './events/controllers/eventController';
import { CheckinController } from './checkin/controllers/checkinController';

// Routes
import { wristbandRoutes } from './wristbands/routes/wristbandRoutes';
import { productRoutes } from './products/routes/productRoutes';
import { sessionRoutes } from './sessions/routes/sessionRoutes';
import { transactionRoutes } from './transactions/routes/transactionRoutes';
import { eventRoutes } from './events/routes/eventRoutes';
import { checkinRoutes } from './checkin/routes/checkinRoutes';

export class ModuleRegistry {
  private prisma: PrismaClient;
  private io: SocketIOServer;

  // Services
  public wristbandService: WristbandService;
  public productService: ProductService;
  public sessionService: SessionService;
  public transactionService: TransactionService;
  public eventService: EventService;
  public checkinService: CheckinService;

  // Controllers
  public wristbandController: WristbandController;
  public productController: ProductController;
  public sessionController: SessionController;
  public transactionController: TransactionController;
  public eventController: EventController;
  public checkinController: CheckinController;

  constructor(prisma: PrismaClient, io: SocketIOServer) {
    this.prisma = prisma;
    this.io = io;

    // Initialize services
    this.wristbandService = new WristbandService(prisma, io);
    this.productService = new ProductService(prisma, io);
    this.sessionService = new SessionService(prisma, io);
    this.transactionService = new TransactionService(prisma, io);
    this.eventService = new EventService(prisma, io);
    this.checkinService = new CheckinService(prisma, io);

    // Initialize controllers
    this.wristbandController = new WristbandController(this.wristbandService);
    this.productController = new ProductController(this.productService);
    this.sessionController = new SessionController(this.sessionService);
    this.transactionController = new TransactionController(this.transactionService);
    this.eventController = new EventController(this.eventService);
    this.checkinController = new CheckinController(this.checkinService);
  }

  async registerRoutes(fastify: any) {
    // Register all routes
    await wristbandRoutes(fastify, this.wristbandController);
    await productRoutes(fastify, this.productController);
    await sessionRoutes(fastify, this.sessionController);
    await transactionRoutes(fastify, this.transactionController);
    await eventRoutes(fastify, this.eventController);
    await checkinRoutes(fastify, this.checkinController);
  }
}
