// backend/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './utils/logger.js';  // note the .js extension
import db from './models/index.js';
import gadgetRoutes from './routes/gadget.js';
import authRoutes from './routes/auth.js';
import {errorHandler} from './middlewares/error.js';
import limiter from './middlewares/rateLimiter.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} completed in ${duration}ms`);
  });
  next();
});

// Middleware

app.use(limiter); // Apply rate limiter to all requests
app.use(helmet()); // Apply security headers
app.use(morgan('combined', { stream: logger.stream })); // Apply logging with morgan

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []; // Array for potential future multiple origins
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200, // Important for preflight requests
};

if (process.env.NODE_ENV === 'development') {
  app.use(cors()); // Allow all in development for easier testing
} else {
  app.use(cors(corsOptions)); // Apply restricted CORS in production
}
app.use(express.json());

const swaggerDocument = JSON.parse(
  readFileSync(new URL('./swagger.json', import.meta.url))
);

// Add this after other middleware and before routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define Swagger options
const swaggerOptions = {
  definition: swaggerDocument,
  apis: ['./routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Add Swagger JSON endpoint
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to IMF Gadgets API',
    status: 'OK',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/gadgets', gadgetRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Wait for database to sync
    await db.sequelize.authenticate();
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;