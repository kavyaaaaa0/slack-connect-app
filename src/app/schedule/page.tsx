'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
}

interface ScheduledMessage {
  _id: string;
  teamId: string;
  channelId: string;
  channelName?: string;
  message: string;
  sendAt: string;
  sent: boolean;
}

export default function SchedulePage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    const fetchTeamAndChannels = async () => {
      try {
        // Get team ID from URL params or use the first available team
        const urlParams = new URLSearchParams(window.location.search);
        const teamIdFromUrl = urlParams.get('teamId');
        
        if (teamIdFromUrl) {
          setTeamId(teamIdFromUrl);
        } else {
          // Get the first available team
          const teamResponse = await fetch('/api/slack/team');
          if (teamResponse.ok) {
            const teamData = await teamResponse.json();
            setTeamId(teamData.teamId);
          }
        }
        
        // Fetch channels for the selected team
        if (teamIdFromUrl || teamId) {
          const channelsResponse = await fetch(`/api/slack/channels?teamId=${teamIdFromUrl || teamId}`);
          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            setChannels(channelsData);
          }
        }
      } catch (error) {
        console.error('Error fetching team and channels:', error);
      }
    };

    fetchTeamAndChannels();
  }, [teamId]);

  useEffect(() => {
    const fetchScheduledMessages = async () => {
      if (!teamId) return;
      
      try {
        const response = await fetch(`/api/slack/scheduled-messages?teamId=${teamId}`);
        if (response.ok) {
          const messages = await response.json();
          // Add channel names to scheduled messages
          const messagesWithChannelNames = messages.map((msg: ScheduledMessage) => ({
            ...msg,
            channelName: channels.find(ch => ch.id === msg.channelId)?.name || 'Unknown Channel'
          }));
          setScheduledMessages(messagesWithChannelNames);
        }
      } catch (error) {
        console.error('Error fetching scheduled messages:', error);
      }
    };

    fetchScheduledMessages();
  }, [teamId, channels]);

  const handleSendMessage = async () => {
    if (!selectedChannel || !message.trim()) {
      alert('Please select a channel and enter a message');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          channelId: selectedChannel,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setMessage('');
        setSelectedChannel('');
      } else {
        const error = await response.json();
        alert(`Failed to send message: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred while sending the message');
    } finally {
      setSending(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!selectedChannel || !message.trim() || !scheduleDateTime) {
      alert('Please select a channel, enter a message, and set a schedule time');
      return;
    }

    setScheduling(true);
    try {
      const response = await fetch('/api/slack/schedule-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          channelId: selectedChannel,
          message: message.trim(),
          sendAt: scheduleDateTime,
        }),
      });

      if (response.ok) {
        alert('Message scheduled successfully!');
        setMessage('');
        setSelectedChannel('');
        setScheduleDateTime('');
        // Refresh scheduled messages list
        const messagesResponse = await fetch(`/api/slack/scheduled-messages?teamId=${teamId}`);
        if (messagesResponse.ok) {
          const messages = await messagesResponse.json();
          const messagesWithChannelNames = messages.map((msg: ScheduledMessage) => ({
            ...msg,
            channelName: channels.find(ch => ch.id === msg.channelId)?.name || 'Unknown Channel'
          }));
          setScheduledMessages(messagesWithChannelNames);
        }
      } else {
        const error = await response.json();
        alert(`Failed to schedule message: ${error.error}`);
      }
    } catch (error) {
      console.error('Error scheduling message:', error);
      alert('An error occurred while scheduling the message');
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelScheduledMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) {
      return;
    }

    try {
      const response = await fetch('/api/slack/scheduled-messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: messageId }),
      });

      if (response.ok) {
        alert('Scheduled message cancelled successfully!');
        // Refresh scheduled messages list
        const messagesResponse = await fetch(`/api/slack/scheduled-messages?teamId=${teamId}`);
        if (messagesResponse.ok) {
          const messages = await messagesResponse.json();
          const messagesWithChannelNames = messages.map((msg: ScheduledMessage) => ({
            ...msg,
            channelName: channels.find(ch => ch.id === msg.channelId)?.name || 'Unknown Channel'
          }));
          setScheduledMessages(messagesWithChannelNames);
        }
      } else {
        const error = await response.json();
        alert(`Failed to cancel message: ${error.error}`);
      }
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      alert('An error occurred while cancelling the message');
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const getMessagePreview = (message: string) => {
    return message.length > 49 ? message.substring(0, 49) + '...' : message;
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Slack-like */}
      <div className="w-80 bg-[#4A154B] text-white flex flex-col">
        <div className="p-4 border-b border-[#5D3D5E]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Slack Connect</h1>
            <Link href="/dashboard" className="text-[#D1D2D3] hover:text-white text-sm">
              Dashboard
            </Link>
          </div>
        </div>
        
        {/* Compose Section */}
        <div className="p-4 border-b border-[#5D3D5E]">
          <h2 className="text-sm font-semibold mb-3 text-[#D1D2D3]">COMPOSE MESSAGE</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#D1D2D3] mb-1">Channel</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full p-2 bg-[#3F0E40] border border-[#5D3D5E] rounded text-white text-sm"
              >
                <option value="">Select a channel</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-[#D1D2D3] mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 bg-[#3F0E40] border border-[#5D3D5E] rounded text-white text-sm resize-none"
                rows={4}
                placeholder="Type your message here..."
              />
            </div>
            
            <div>
              <label className="block text-xs text-[#D1D2D3] mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full p-2 bg-[#3F0E40] border border-[#5D3D5E] rounded text-white text-sm"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleSendMessage}
                disabled={sending || !selectedChannel || !message.trim()}
                className="flex-1 bg-[#007A5A] hover:bg-[#148567] text-white text-sm py-2"
              >
                {sending ? 'Sending...' : 'Send Now'}
              </Button>
              <Button 
                onClick={handleScheduleMessage}
                disabled={scheduling || !selectedChannel || !message.trim() || !scheduleDateTime}
                className="flex-1 bg-[#4A154B] border border-[#5D3D5E] hover:bg-[#5D3D5E] text-white text-sm py-2"
              >
                {scheduling ? 'Scheduling...' : 'Schedule'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scheduled Messages Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold mb-3 text-[#D1D2D3]">SCHEDULED MESSAGES</h2>
          <div className="space-y-2">
            {scheduledMessages.length === 0 ? (
              <p className="text-[#D1D2D3] text-sm">No scheduled messages</p>
            ) : (
              scheduledMessages.map((scheduledMsg) => (
                <div key={scheduledMsg._id} className="bg-[#3F0E40] p-3 rounded border border-[#5D3D5E]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[#D1D2D3] text-sm font-medium">
                      #{scheduledMsg.channelName || 'Unknown Channel'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      scheduledMsg.sent 
                        ? 'bg-[#007A5A] text-white' 
                        : 'bg-[#ECB22E] text-black'
                    }`}>
                      {scheduledMsg.sent ? 'Sent' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-white text-sm mb-2">
                    {getMessagePreview(scheduledMsg.message)}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[#D1D2D3] text-xs">
                      {formatDateTime(scheduledMsg.sendAt)}
                    </span>
                    {!scheduledMsg.sent && (
                      <Button
                        onClick={() => handleCancelScheduledMessage(scheduledMsg._id)}
                        className="bg-[#E01E5A] hover:bg-[#C01E4A] text-white text-xs py-1 px-2"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
            Use the sidebar to compose and send messages to your Slack channels. 
            You can send messages immediately or schedule them for later.
          </p>
        </div>
      </div>
    </div>
  );
}