import React, { useState, useEffect, useMemo, useCallback } from 'react';

const ChatSidebar = ({ 
  friends, 
  selectedFriend, 
  onSelectFriend, 
  onlineUsers, 
  onLogout, 
  currentUser,
  token,
  onFriendsUpdate 
}) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFriendRequests = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch('http://3.23.98.221/:5000/api/friends/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch friend requests');
      const data = await response.json();
      setFriendRequests(data);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFriendRequests();
    const interval = setInterval(fetchFriendRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchFriendRequests]);

  const handleAcceptRequest = async (requestId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://3.23.98.221/:5000/api/friends/accept/${requestId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to accept friend request');
      await fetchFriendRequests();
      if (onFriendsUpdate) {
        await onFriendsUpdate();
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://3.23.98.221/:5000/api/friends/reject/${requestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to reject friend request');
      await fetchFriendRequests();
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    } finally {
      setLoading(false);
    }
  };

  const friendsList = useMemo(() => {
    return friends.map((friend) => (
      <div
        key={friend._id}
        onClick={() => onSelectFriend(friend)}
        className={`p-4 border-b cursor-pointer hover:bg-gray-50 flex items-center ${
          selectedFriend?.id === friend._id ? 'bg-blue-50' : ''
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          {friend.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-medium">{friend.username}</div>
          <div className="text-sm text-gray-500">
            {onlineUsers.includes(friend._id) ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
    ));
  }, [friends, selectedFriend?.id, onlineUsers, onSelectFriend]);

  const requestsList = useMemo(() => {
    if (friendRequests.length === 0) {
      return <div className="text-sm text-gray-500 p-4">No pending requests</div>;
    }

    return friendRequests.map((request) => (
      <div key={request._id} className="p-4 border-b hover:bg-gray-50">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            {request.requester.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{request.requester.username}</div>
            <div className="text-xs text-gray-500">
              {new Date(request.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleAcceptRequest(request._id)}
            disabled={loading}
            className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={() => handleRejectRequest(request._id)}
            disabled={loading}
            className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    ));
  }, [friendRequests, loading]);

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <button
            onClick={onLogout}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Logged in as: {currentUser?.username || 'Guest'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b">
          <h3 className="p-2 bg-gray-50 font-medium text-sm text-gray-700">Friends</h3>
          {friendsList}
        </div>

        <div>
          <h3 className="p-2 bg-gray-50 font-medium text-sm text-gray-700 flex items-center justify-between">
            Friend Requests
            {friendRequests.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {friendRequests.length}
              </span>
            )}
          </h3>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading requests...</div>
          ) : (
            requestsList
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatSidebar);