/**
 * Projects API Routes
 *
 * GET  /api/projects - List all projects with stats
 * POST /api/projects - Create a new project
 */

import { NextRequest } from 'next/server';
import {
  getProjectsWithStats,
  createProject,
  type ProjectInsert,
} from '@/lib/db';

/**
 * GET /api/projects
 * Returns all projects for the user with chat counts and last activity
 */
export async function GET() {
  try {
    const projects = await getProjectsWithStats();

    return Response.json({
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * POST /api/projects
 * Creates a new project
 *
 * Body: { name: string, description?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Project name is required and must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate name is not empty
    if (body.name.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Project name cannot be empty',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create project
    const projectData: Omit<ProjectInsert, 'user_id'> = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      custom_instructions: null,
    };

    const project = await createProject(projectData);

    if (!project) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Unable to create project. Please try again or contact support if the problem persists.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return Response.json(
      { project },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create project',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
