'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  user: string;
}

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

export default function ChannelPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');

  useEffect(() => {
    // Check URL for workspace, otherwise use the user's team
    const urlParams = new URLSearchParams(window.location.search);
    const workspaceFromUrl = urlParams.get('workspace');
    if (workspaceFromUrl) {
      console.log('Setting workspace from URL:', workspaceFromUrl);
      setSelectedWorkspace(workspaceFromUrl);
    } else {
      console.log('Fetching user team...');
      fetch('/api/slack/team')
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            console.log('Team data:', data);
            setSelectedWorkspace(data.teamId);
          } else {
            console.error('Failed to fetch team, status:', res.status);
          }
        })
        .catch((e) => console.error('Failed to fetch team:', e));
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    if (!selectedWorkspace) return;
    
    try {
      console.log('Fetching channels for workspace:', selectedWorkspace);
      const response = await fetch(`/api/slack/channels?teamId=${selectedWorkspace}`);
      console.log('Channels response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Channels data:', data);
        setChannels(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch channels:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  }, [selectedWorkspace]);

  const fetchScheduledMessages = useCallback(async () => {
    if (!selectedWorkspace) return;
    
    try {
      const response = await fetch(`/api/slack/scheduled-messages?teamId=${selectedWorkspace}`);
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
  }, [selectedWorkspace, channels]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchChannels();
      fetchScheduledMessages();
    }
  }, [selectedWorkspace, fetchChannels, fetchScheduledMessages]);

  useEffect(() => {
    if (selectedChannel) {
      fetchScheduledMessages();
    }
  }, [selectedChannel, fetchScheduledMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    setSending(true);
    try {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: selectedWorkspace,
          channelId: selectedChannel,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        // Add message to channel-specific state
        const newMsg: Message = {
          id: Date.now().toString(),
          text: newMessage.trim(),
          timestamp: new Date().toISOString(),
          user: 'You',
        };
        setMessages(prev => ({
          ...prev,
          [selectedChannel]: [...(prev[selectedChannel] || []), newMsg]
        }));
        setNewMessage('');
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred while sending the message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleScheduleMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !scheduleDateTime) {
      alert('Please enter a message and select a schedule time');
      return;
    }

    // Validate that the scheduled time is in the future
    const scheduledTime = new Date(scheduleDateTime);
    const now = new Date();
    
    if (scheduledTime <= now) {
      alert('Please select a future date and time for scheduling. You cannot schedule messages in the past.');
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
          teamId: selectedWorkspace,
          channelId: selectedChannel,
          message: newMessage.trim(),
          sendAt: scheduleDateTime,
        }),
      });

      if (response.ok) {
        alert('Message scheduled successfully!');
        setNewMessage('');
        setScheduleDateTime('');
        setShowScheduleForm(false);
        fetchScheduledMessages();
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

    console.log('Cancelling message with ID:', messageId);

    try {
      const response = await fetch('/api/slack/scheduled-messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: messageId }),
      });

      console.log('Cancel response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Cancel response:', result);
        alert('Scheduled message cancelled successfully!');
        fetchScheduledMessages();
      } else {
        const error = await response.json();
        console.error('Cancel error:', error);
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-80 bg-[#4A154B] text-white flex flex-col">
        <div className="p-4 border-b border-[#5D3D5E]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Slack Connect</h1>
            <Link href="/dashboard" className="text-[#D1D2D3] hover:text-white text-sm">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Channels Section */}
        <div className="p-4 border-b border-[#5D3D5E]">
          <h2 className="text-sm font-semibold mb-3 text-[#D1D2D3]">CHANNELS</h2>
          {channels.length === 0 ? (
            <p className="text-[#D1D2D3] text-sm">No channels found</p>
          ) : (
            <div className="space-y-1">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedChannel === channel.id 
                      ? 'bg-[#007A5A] text-white' 
                      : 'hover:bg-[#3F0E40] text-[#D1D2D3]'
                  }`}
                >
                  #{channel.name}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Scheduled Messages Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold mb-3 text-[#D1D2D3]">SCHEDULED MESSAGES</h2>
          {scheduledMessages.length === 0 ? (
            <p className="text-[#D1D2D3] text-sm">No scheduled messages</p>
          ) : (
            <div className="space-y-2">
              {scheduledMessages.map((scheduledMsg) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#F8F8F8]">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800">
                #{channels.find(ch => ch.id === selectedChannel)?.name}
              </h2>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {!messages[selectedChannel] || messages[selectedChannel].length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages[selectedChannel].map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[#4A154B] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {message.user.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">{message.user}</span>
                          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="text-gray-800 mt-1">{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              {showScheduleForm && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <label className="text-sm font-medium text-gray-700">Schedule for:</label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="p-2 border border-gray-300 rounded text-sm"
                    />
                    <Button
                      onClick={() => setShowScheduleForm(false)}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Select a future date and time. Messages cannot be scheduled in the past.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${channels.find(ch => ch.id === selectedChannel)?.name}`}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-[#007A5A] hover:bg-[#148567] text-white px-4"
                >
                  {sending ? 'Sending...' : 'Send'}
                </Button>
                <Button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  disabled={!newMessage.trim()}
                  className="bg-[#4A154B] hover:bg-[#5D3D5E] text-white px-4"
                >
                  Schedule
                </Button>
                {showScheduleForm && (
                  <Button
                    onClick={handleScheduleMessage}
                    disabled={scheduling || !newMessage.trim() || !scheduleDateTime}
                    className="bg-[#ECB22E] hover:bg-[#D4A017] text-black px-4"
                  >
                    {scheduling ? 'Scheduling...' : 'Schedule'}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4A154B] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Channel</h2>
              <p className="text-gray-600">
                Choose a channel from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
