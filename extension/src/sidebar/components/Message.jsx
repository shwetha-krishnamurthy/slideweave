import React from 'react';

function Message({ message }) {
  return (
    <div className={`message ${message.role}`}>
      <p className="message-content">{message.content}</p>
    </div>
  );
}

export default Message;
