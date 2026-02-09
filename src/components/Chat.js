import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '../firebase';

function Chat({ roomId, user, title = 'Chat' }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const messagesRef = ref(database, `chats/${roomId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messageList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messagesRef = ref(database, `chats/${roomId}`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      text: newMessage,
      sender: user.displayName,
      senderUid: user.uid,
      timestamp: Date.now()
    });

    setNewMessage('');
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 flex flex-col h-[500px]">
      <div className="p-4 border-b border-white/20">
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center text-sm">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${
                msg.senderUid === user.uid ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
                  msg.senderUid === user.uid
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                <p className="text-xs font-semibold opacity-75">{msg.sender}</p>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-white/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            maxLength={200}
          />
          <button
            type="submit"
            className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
