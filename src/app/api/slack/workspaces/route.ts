import { NextRequest, NextResponse } from 'next/server';
import { getAllTeams, removeTeam } from '@/lib/slack';
import { getSessionIdFromRequest, getUserFromSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionIdFromRequest(req);
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }
    
    const user = await getUserFromSession(sessionId);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const teams = await getAllTeams(user.userId);
    
    // Return only the necessary workspace info (no sensitive tokens)
    const workspaces = teams.map(team => ({
      _id: team._id,
      teamId: team.teamId,
      teamName: team.teamName || 'Unknown Workspace',
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ 
      error: 'An error occurred while fetching workspaces' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = await getSessionIdFromRequest(req);
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }
    
    const user = await getUserFromSession(sessionId);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: 'No teamId provided' }, { status: 400 });
    }

    const success = await removeTeam(teamId, user.userId);

    if (!success) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Workspace removed successfully' 
    });
  } catch (error) {
    console.error('Error removing workspace:', error);
    return NextResponse.json({ 
      error: 'An error occurred while removing the workspace' 
    }, { status: 500 });
  }
}
