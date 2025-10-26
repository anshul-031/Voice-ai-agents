/**
 * Tool Execution API Endpoint
 * 
 * POST /api/tools/execute - Execute a tool for an agent
 * GET /api/tools/execute - Get list of available tools
 */

import dbConnect from '@/lib/dbConnect';
import { executeDocumentTool } from '@/lib/tools/documentExecutors';
import { getAllDocumentTools, getToolByName } from '@/lib/tools/documentTools';
import { getS3Status } from '@/lib/utils/s3Upload';
import VoiceAgent from '@/models/VoiceAgent';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Execute a tool
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { agentId, toolName, parameters } = body;

    // Validate required fields
    if (!agentId || !toolName || !parameters) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: agentId, toolName, parameters',
        },
        { status: 400 }
      );
    }

    // Check if tool exists
    const toolDefinition = getToolByName(toolName);
    if (!toolDefinition) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown tool: ${toolName}`,
        },
        { status: 404 }
      );
    }

    // Get agent and check if tool is enabled
    const agent = await VoiceAgent.findById(agentId);
    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agent not found',
        },
        { status: 404 }
      );
    }

    // Check if tool is enabled for this agent
    const enabledTools = agent.enabledTools || [];
    const toolConfig = enabledTools.find((t: any) => t.toolName === toolName);

    if (!toolConfig || !toolConfig.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: `Tool '${toolName}' is not enabled for this agent. Please enable it in the agent settings.`,
        },
        { status: 403 }
      );
    }

    // Check S3 configuration
    const s3Status = getS3Status();
    if (!s3Status.configured) {
      return NextResponse.json(
        {
          success: false,
          error: `S3 not configured: ${s3Status.error}`,
        },
        { status: 500 }
      );
    }

    // Execute the tool
    console.log(`Executing tool: ${toolName} for agent: ${agentId}`);
    const result = await executeDocumentTool(toolName, parameters);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Tool execution failed',
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      tool: toolName,
      result: {
        fileUrl: result.fileUrl,
        data: result.data,
        metadata: result.metadata,
      },
      message: `Successfully executed ${toolName}`,
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List available tools or get tools for an agent
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    await dbConnect();

    // If agentId provided, return enabled tools for that agent
    if (agentId) {
      const agent = await VoiceAgent.findById(agentId);
      if (!agent) {
        return NextResponse.json(
          {
            success: false,
            error: 'Agent not found',
          },
          { status: 404 }
        );
      }

      const enabledTools = agent.enabledTools || [];
      const allTools = getAllDocumentTools();

      // Map enabled tools with full definitions
      const agentTools = allTools.map((tool) => {
        const config = enabledTools.find((t: any) => t.toolName === tool.name);
        return {
          ...tool,
          enabled: config?.enabled || false,
          config: config?.config || {},
        };
      });

      return NextResponse.json({
        success: true,
        agentId,
        tools: agentTools,
      });
    }

    // Return all available tools
    const allTools = getAllDocumentTools();
    const s3Status = getS3Status();

    return NextResponse.json({
      success: true,
      tools: allTools,
      s3Status,
      totalTools: allTools.length,
    });
  } catch (error) {
    console.error('Get tools error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
