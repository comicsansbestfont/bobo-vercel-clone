import { createConsola } from 'consola';

// Create logger instances for different parts of the app
export const logger = createConsola({
  level: process.env.NODE_ENV === 'development' ? 4 : 3, // 4 = debug in dev, 3 = info in prod
});

// Specialized loggers for different modules
export const chatLogger = logger.withTag('chat');
export const projectLogger = logger.withTag('project');
export const apiLogger = logger.withTag('api');
export const routerLogger = logger.withTag('router');

// Helper to log object with nice formatting
export function logObject(label: string, obj: any) {
  logger.box(label);
  console.dir(obj, { depth: null, colors: true });
}
