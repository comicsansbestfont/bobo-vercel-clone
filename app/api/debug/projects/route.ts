/**
 * Debug endpoint to test getProjects() function
 * GET /api/debug/projects
 */

import { getProjects } from '@/lib/db';

export async function GET() {
  try {
    console.log('[Debug] Starting getProjects call...');
    const startTime = Date.now();

    const projects = await getProjects();

    const duration = Date.now() - startTime;
    console.log(`[Debug] getProjects completed in ${duration}ms, found ${projects.length} projects`);

    return Response.json({
      success: true,
      count: projects.length,
      duration: `${duration}ms`,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        entity_type: p.entity_type,
        description: p.description,
      })),
    });
  } catch (error) {
    console.error('[Debug] getProjects error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
