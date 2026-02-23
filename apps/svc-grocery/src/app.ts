import express from 'express';
import { createGroceryRoutes } from './interface/routes/grocery.routes';
import { authRoutes } from './interface/routes/auth.routes';
import { errorHandler } from './interface/middlewares/error-handler.middleware';
import { container } from './shared/di/container';

export function createApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/grocery', createGroceryRoutes(container.groceryController));

  app.use(errorHandler);

  return app;
}
