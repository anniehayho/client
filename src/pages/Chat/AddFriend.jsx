import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

const AddFriend = ({ token, onlineUsers }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Memoize fetchAllUsers to prevent unnecessary recreations
  const fetchAllUsers = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Memoize handleSendRequestAddFriend
  const handleSendRequestAddFriend = useCallback(async (userId) => {
    if (!token || !userId) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: userId }),
      });

      if (!response.ok) throw new Error('Failed to send friend request');
      alert('Friend request sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Debounce search input to prevent excessive filtering
  const debouncedSetSearchTerm = useMemo(
    () => debounce((term) => setSearchTerm(term), 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel();
    };
  }, [debouncedSetSearchTerm]);

  // Initial fetch
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Memoize filtered users
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    
    return allUsers.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  // Memoize user list rendering
  const UserList = useMemo(() => {
    if (isLoading) {
      return <div className="text-center py-4">Loading...</div>;
    }

    if (filteredUsers.length === 0) {
      return <div className="text-center py-4">No users found</div>;
    }

    return filteredUsers.map((user) => (
      <li
        key={user._id}
        className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors"
      >
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
        <button
          onClick={() => handleSendRequestAddFriend(user._id)}
          disabled={isLoading}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          Add
        </button>
      </li>
    ));
  }, [filteredUsers, onlineUsers, handleSendRequestAddFriend, isLoading]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Add Friends</h3>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-2 rounded mb-4">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Search users..."
        onChange={(e) => debouncedSetSearchTerm(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <ul className="space-y-2">
        {UserList}
      </ul>
    </div>
  );
};

// Prevent unnecessary re-renders if props haven't changed
export default React.memo(AddFriend);