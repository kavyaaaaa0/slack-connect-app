'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const SuccessPage = () => {
  useEffect(() => {
    // Auto-redirect to channel page after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = '/channel';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-600 mb-4">Workspace Connected!</h1>
        <p className="text-gray-700 mb-6">
          Your Slack workspace has been successfully connected. You can now send and schedule messages to your channels.
        </p>
        <div className="space-y-3">
          <Link href="/channel" passHref>
            <Button className="w-full bg-[#4A154B] hover:bg-[#5D3D5E] text-white">
              Go to Channels
            </Button>
          </Link>
          <p className="text-sm text-gray-500">
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
