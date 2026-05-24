import React, { useState } from 'react';
import ChatIcon from './components/ChatIcon';
import ChatWindow from './components/ChatWindow';

const App = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <div id="gd-chat-widget">
      {/* Chat Window */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={toggleChat}
      />

      {/* Floating Chat Icon */}
      <ChatIcon
        isOpen={isChatOpen}
        onClick={toggleChat}
      />
    </div>
  );
};

export default App;