'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function InstallPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#4A154B] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Install Slack Connect
          </h1>
          <p className="text-gray-600">
            Connect your Slack workspace to start sending and scheduling messages.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Required Permissions:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Read public and private channels</li>
              <li>• Send messages to channels</li>
              <li>• Read and send direct messages</li>
            </ul>
          </div>
          
          <Link href="/api/auth/slack" passHref>
            <Button className="w-full bg-[#4A154B] hover:bg-[#5D3D5E] text-white py-3">
              Install to Slack Workspace
            </Button>
          </Link>
          
          <p className="text-xs text-gray-500 text-center">
            By installing, you authorize this app to access your Slack workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
