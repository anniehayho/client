import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@chakra-ui/react';
import ioClient from 'socket.io-client';
import AddFriend from './AddFriend';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const socket = useRef(null);

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchFriends();

    // Initialize socket connection
    socket.current = ioClient('http://localhost:5000', {
      auth: {
        token: token,
      },
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

    socket.current.on('connect_error', (err) => {
      console.error('Socket error:', err);
      setError('Connection to chat server failed');
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
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      setFriends(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch friends');
    }
  };

  const fetchMessages = async (friendId) => {
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
  };

  // const fetchUserProfile = async () => {
  //   try {
  //     const response = await fetch(`http://localhost:5000/api/users/profile`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     if (!response.ok) throw new Error('Failed to fetch user profile');
  //     const data = await response.json();
  //     return data;
  //   } catch (err) {
  //     setError(err.message || 'Failed to fetch user profile');
  //   }
  // }

  const handleSendMessage = async (e) => {
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
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      socket.current.emit('send-message', {
        content: data.content,
        receiver: selectedFriend._id,
      });
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  console.log('onlineUsers:', onlineUsers);
  console.log('friends:', friends); 
  console.log('selectedFriend:', selectedFriend);
  console.log('messages sender:', messages);
  console.log('user:', user);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
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
          <div className="text-sm text-gray-500">Logged in as: {user?.username || 'Guest'}</div>
        </div>
        {/* <div className="flex-1 overflow-y-auto">
          {user && (
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold mb-2">Online Users</h3>
              <ul>
                {friends.map((friend) => (
                  <li
                    key={friend._id}
                    onClick={() => setSelectedFriend(friend._id)}
                    className={`flex items-center justify-between p-2 cursor-pointer ${
                      selectedFriend?._id === friend._id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div>{friend.username}</div>
                    {onlineUsers.includes(friend._id) && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div> */}
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
                {friend.username}
              </div>
              <div>
                <div className="font-medium">
                  {friend.username}
                </div>
                <div className="text-sm text-gray-500">
                  {onlineUsers.includes(friend._id) ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            <div className="bg-white border-b p-4 font-medium">{selectedFriend.username}</div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
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
              ))}
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
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Send</button>
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
        <AddFriend token={token} onlineUsers={onlineUsers}/>
      </div>
      
    </div>
  );
};

export default ChatWindow;
