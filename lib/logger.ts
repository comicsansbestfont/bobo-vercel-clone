import { createConsola } from 'consola';

// Get log level from environment variable, default to debug in dev, info in prod
const LOG_LEVEL = process.env.LOG_LEVEL
  ? parseInt(process.env.LOG_LEVEL, 10)
  : process.env.NODE_ENV === 'development' ? 4 : 3; // 4 = debug in dev, 3 = info in prod

// Create logger instances for different parts of the app
export const logger = createConsola({
  level: LOG_LEVEL,
});

// Specialized loggers for different modules
export const chatLogger = logger.withTag('chat');
export const projectLogger = logger.withTag('project');
export const apiLogger = logger.withTag('api');
export const routerLogger = logger.withTag('router');
export const dbLogger = logger.withTag('db');
export const componentLogger = logger.withTag('component');
export const embeddingLogger = logger.withTag('embedding');
export const memoryLogger = logger.withTag('memory');

// Helper to log object with nice formatting
export function logObject(label: string, obj: unknown) {
  logger.box(label);
  console.dir(obj, { depth: null, colors: true });
}
