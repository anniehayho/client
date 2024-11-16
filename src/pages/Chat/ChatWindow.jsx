import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@chakra-ui/react';
import ioClient from 'socket.io-client';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const socket = useRef(null);

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchFriends();
    socket.current = ioClient('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socket.current.on('connect', () => {
      console.log('Socket connected');
    });

    socket.current.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.current.on('user-status', (onlineUsers) => {
      setOnlineUsers(onlineUsers);
    });

    socket.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.current.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend._id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data);
      }
    } catch (err) {
      setError('Failed to fetch friends');
    }
  };

  const fetchMessages = async (friendId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${friendId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
      }
    } catch (err) {
      setError('Failed to fetch messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedFriend._id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data]);
        setNewMessage('');
        socket.current.emit('send-message', {
          content: newMessage,
          receiver: selectedFriend._id
        });
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Friends List */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Chats</h2>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Logout
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Logged in as: {user?.username}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {friends && friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => setSelectedFriend(friend)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 flex items-center ${
                selectedFriend?.id === friend._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                {friend.requester._id === user.id ? friend.recipient.username : friend.requester.username}
              </div>
              <div>
                <div className="font-medium">
                  {friend.requester._id === user.id ? friend.recipient.username : friend.requester.username}
                </div>
                <div className="text-sm text-gray-500">
                  {onlineUsers.includes(friend.requester._id === user.id ? friend.recipient._id : friend.requester._id) ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="font-medium">{selectedFriend.username}</div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {messages && messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${
                    message.sender === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    <p>{message.content}</p>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === user.id ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
};

export default ChatWindow;