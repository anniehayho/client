import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { BE_API_URL } from '../../const';

const AddFriend = ({ token, onlineUsers }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const fetchAllUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [usersResponse, friendsResponse, requestsResponse] = await Promise.all([
        fetch(`${BE_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BE_API_URL}/api/friends/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BE_API_URL}/api/friends/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const [users, friendsList, pendingRequests] = await Promise.all([
        usersResponse.json(),
        friendsResponse.json(),
        requestsResponse.json()
      ]);

      if (!usersResponse.ok) throw new Error('Failed to fetch users');

      setAllUsers(users);
      setFriends(friendsList);
      setSentRequests(pendingRequests);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleSendRequestAddFriend = useCallback(async (userId) => {
    if (!token || !userId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${BE_API_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: userId }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSentRequests(prev => [...prev, data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleCancelRequest = useCallback(async (requestId) => {
    if (!token || !requestId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${BE_API_URL}/api/friends/reject/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to cancel request');
      setSentRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const debouncedSetSearchTerm = useMemo(
    () => debounce((term) => setSearchTerm(term), 300),
    []
  );

  useEffect(() => {
    return () => debouncedSetSearchTerm.cancel();
  }, [debouncedSetSearchTerm]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    return allUsers.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !friends.some(friend => friend._id === user._id)
    );
  }, [allUsers, searchTerm, friends]);

  const UserList = useMemo(() => {
    if (isLoading) return <div className="text-center py-4">Loading...</div>;
    if (filteredUsers.length === 0) return <div className="text-center py-4">No users found</div>;

    return filteredUsers.map((user) => {
      const pendingRequest = sentRequests.find(req => req.recipient === user._id);
      const isFriend = friends.some(friend => friend._id === user._id);

      if (isFriend) return null;

      return (
        <li key={user._id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-gray-500">
                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          {pendingRequest ? (
            <button
              onClick={() => handleCancelRequest(pendingRequest._id)}
              disabled={isLoading}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel Request
            </button>
          ) : (
            <button
              onClick={() => handleSendRequestAddFriend(user._id)}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
          )}
        </li>
      );
    }).filter(Boolean);
  }, [filteredUsers, onlineUsers, handleSendRequestAddFriend, handleCancelRequest, isLoading, sentRequests, friends]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Add Friends</h3>
      {error && (
        <div className="bg-red-50 text-red-500 p-2 rounded mb-4">{error}</div>
      )}
      <input
        type="text"
        placeholder="Search users..."
        onChange={(e) => debouncedSetSearchTerm(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <ul className="space-y-2">{UserList}</ul>
    </div>
  );
};

export default React.memo(AddFriend);