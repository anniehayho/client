import React, { useEffect, useState } from 'react';

const AddFriend = ({ token, onlineUsers }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
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
      console.log('error', err);
      setError(err.message || 'Failed to fetch users');
    }
  };

  const handleSendRequestAddFriend = async (userId) => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          recipientId: userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send request addfriend');
      alert('Send request addfriend successfully!');
    } catch (err) {
      setError(err.message || 'Failed to send request addfriend');
    }
  };

  console.log('allUsers', allUsers);

  const filteredUsers = allUsers.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('filteredUsers', filteredUsers);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Add Friends</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <ul className="space-y-2">
        {filteredUsers.map((user) => (
          <li
            key={user._id}
            className="flex items-center justify-between p-2 border rounded-lg"
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
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddFriend;
