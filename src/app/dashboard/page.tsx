'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SlackWorkspace {
  _id: string;
  teamId: string;
  teamName: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<SlackWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
    
    // Refresh workspaces when the page becomes visible (user returns from OAuth)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchWorkspaces();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/slack/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWorkspace = async (teamId: string) => {
    if (!confirm('Are you sure you want to remove this workspace? This will disconnect the app from this workspace.')) {
      return;
    }

    try {
      const response = await fetch('/api/slack/workspaces', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      });

      if (response.ok) {
        alert('Workspace removed successfully!');
        fetchWorkspaces();
      } else {
        alert('Failed to remove workspace');
      }
    } catch (error) {
      console.error('Error removing workspace:', error);
      alert('An error occurred while removing the workspace');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A154B] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Slack-like */}
      <div className="w-80 bg-[#4A154B] text-white flex flex-col">
        <div className="p-4 border-b border-[#5D3D5E]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Slack Connect</h1>
            <Link href="/api/auth/slack" passHref>
              <Button 
                className="bg-[#4A154B] hover:bg-[#5D3D5E] text-white text-sm"
                onClick={() => setConnecting(true)}
              >
                {connecting ? 'Connecting...' : '+ Add Workspace'}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Workspaces Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold mb-3 text-[#D1D2D3]">WORKSPACES</h2>
          {workspaces.length === 0 ? (
            <p className="text-[#D1D2D3] text-sm">No workspaces connected</p>
          ) : (
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div key={workspace._id} className="flex items-center justify-between p-2 rounded hover:bg-[#3F0E40]">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-6 h-6 bg-[#007A5A] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {workspace.teamName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <Link 
                      href={`/channel?workspace=${workspace.teamId}`}
                      className="text-white text-sm hover:text-gray-200 flex-1"
                    >
                      {workspace.teamName}
                    </Link>
                  </div>
                  <Button
                    onClick={() => handleRemoveWorkspace(workspace.teamId)}
                    className="text-red-400 hover:text-red-300 text-xs"
                    variant="ghost"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 bg-[#F8F8F8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#4A154B] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Slack Connect</h2>
          <p className="text-gray-600 max-w-md">
            Select a workspace from the sidebar to start sending messages to your Slack channels.
          </p>
        </div>
      </div>
    </div>
  );
}
