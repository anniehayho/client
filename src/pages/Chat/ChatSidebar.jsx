import React, { useMemo } from 'react';

const ChatSidebar = ({ 
  friends, 
  selectedFriend, 
  onSelectFriend, 
  onlineUsers, 
  onLogout, 
  currentUser 
}) => {
  // Memoized friend list rendering
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

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <button
            onClick={onLogout}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Logout
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Logged in as: {currentUser?.username || 'Guest'}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {friendsList}
      </div>
    </div>
  );
};

export default React.memo(ChatSidebar);