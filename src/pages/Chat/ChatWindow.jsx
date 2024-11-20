import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send } from 'lucide-react';
import ioClient from 'socket.io-client';
import AddFriend from './AddFriend';
import ChatSidebar from './ChatSidebar';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  
  // Memoize user and token
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const token = useMemo(() => localStorage.getItem('token'), []);

  // API calls
  const fetchFriends = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      setFriends(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch friends');
    }
  }, [token]);

  const fetchMessages = useCallback(async (friendId) => {
    if (!friendId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${friendId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
    }
  }, [token]);

  // Socket event handlers
  const handleReceiveMessage = useCallback((message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  const handleUserStatus = useCallback((users) => {
    setOnlineUsers(users);
  }, []);

  // Socket initialization
  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    socket.current = ioClient('http://localhost:5000', {
      auth: { token },
    });

    const currentSocket = socket.current;

    currentSocket.on('connect', () => console.log('Socket connected'));
    currentSocket.on('receive-message', handleReceiveMessage);
    currentSocket.on('user-status', handleUserStatus);
    currentSocket.on('disconnect', () => console.log('Socket disconnected'));
    currentSocket.on('connect_error', (err) => {
      console.error('Socket error:', err);
      setError('Connection to chat server failed');
    });

    fetchFriends();

    return () => {
      currentSocket.off('receive-message', handleReceiveMessage);
      currentSocket.off('user-status', handleUserStatus);
      currentSocket.disconnect();
    };
  }, [token, fetchFriends, handleReceiveMessage, handleUserStatus]);

  useEffect(() => {
    if (selectedFriend?._id) {
      fetchMessages(selectedFriend._id);
    }
  }, [selectedFriend?._id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Event handlers
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedFriend._id,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      socket.current?.emit('send-message', {
        content: data.content,
        receiver: selectedFriend._id,
      });
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  }, [newMessage, selectedFriend, token]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  // Memoized messages rendering
  const messagesList = useMemo(() => {
    return messages.map((message, index) => (
      <div
        key={message._id || index}
        className={`mb-4 flex ${
          message.sender._id === user.id ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`max-w-[70%] p-3 rounded-lg ${
            message.sender._id === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          {message.content}
        </div>
      </div>
    ));
  }, [messages, user.id]);

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar 
        friends={friends}
        selectedFriend={selectedFriend}
        onSelectFriend={setSelectedFriend}
        onlineUsers={onlineUsers}
        onLogout={handleLogout}
        currentUser={user}
      />

      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            <div className="bg-white border-b p-4 font-medium">
              {selectedFriend.username}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messagesList}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                />
                <button 
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      <div className="w-80 bg-white border-r flex flex-col">
        <AddFriend token={token} onlineUsers={onlineUsers} />
      </div>
    </div>
  );
};

export default React.memo(ChatWindow);