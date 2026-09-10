import React, { useEffect, useState, useRef } from "react";
import "./Chatwindow.css";
import Nopfp from "../../Assets/nopfp.jpg";
import { Phone, Video, Info, Type, Paperclip, Link2, Smile, Trash2, Send } from "lucide-react";
import { useSelector } from "react-redux";
import { useSocket } from "../../../SocketContext/sockectContext.jsx";
import { getMessages, sendMessage } from "../../../Apis/messages";

const ChatWindow = ({ chatUser }) => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // Purani messages load karo jab chatUser badle
  useEffect(() => {
    if (!chatUser) return;
    const fetchMessages = async () => {
      try {
        const res = await getMessages(chatUser._id);
        if (res.status) setMessages(res.messages);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [chatUser]);

  // Realtime naya message listen karo
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const isRelevant =
        (message.senderId === chatUser?._id && message.receiverId === user._id) ||
        (message.senderId === user._id && message.receiverId === chatUser?._id);

      if (isRelevant) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, chatUser, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      const res = await sendMessage({ receiverId: chatUser._id, text });
      if (res.status) {
        setMessages((prev) => [...prev, res.message]); // apna message turant dikha do
        setText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!chatUser) {
    return (
      <div className="empty-chat d-flex flex-column justify-content-center">
        <div className="chat-logo"></div>
        <h2>Choose a conversation to continue</h2>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <img src={chatUser.profilePic || Nopfp} alt="" height={40} className="rounded-circle" />
        <div className="chat-user-info w-100 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="username p-0 m-0">{chatUser.name}</h4>
            <p className="online-indicator p-0 m-0">
              {onlineUsers.includes(chatUser._id) ? "Online" : "Offline"}
            </p>
          </div>

          <div className="chat-actions d-flex gap-4 align-items-center">
            <div className="callIcon"><Phone color="#7758f9" /></div>
            <div className="videoCallIcon"><Video color="#7758f9" /></div>
            <div className="info"><Info color="#7758f9" /></div>
          </div>
        </div>
      </div>

      <div className="chat-body">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={msg.senderId === user._id ? "sent" : "received"}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="message-box">
        <input
          type="text"
          placeholder="Type a message..."
          className="message-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <div className="message-footer">
          <div className="left-icons">
            <Type size={18} />
            <Paperclip size={18} />
            <Link2 size={18} />
            <Smile size={18} />
            <Info size={18} />
            <Trash2 size={18} />
          </div>

          <button className="send-btn" onClick={handleSend}>
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;