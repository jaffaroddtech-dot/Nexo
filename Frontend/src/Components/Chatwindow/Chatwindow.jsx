import React, { useEffect, useState, useRef } from "react";
import "./Chatwindow.css";
import Nopfp from "../../Assets/nopfp.jpg";
import { Phone, Video, Info, Type, Paperclip, Link2, Smile, Trash2, Send, CheckCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { useSocket } from "../../../SocketContext/sockectContext.jsx";
import { getMessages, sendMessage, markAsSeen } from "../../../Apis/messages";

const ChatWindow = ({ chatUser, onMessageSent }) => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false); // 👈 dusra user type kar raha hai ya nahi
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null); // 👈 debounce ke liye

  // Purani messages load karo + seen mark karo
  useEffect(() => {
    if (!chatUser) return;
    const fetchMessages = async () => {
      try {
        const res = await getMessages(chatUser._id);
        if (res.status) setMessages(res.messages);
        await markAsSeen(chatUser._id);
        socket?.emit("messagesSeen", { receiverId: chatUser._id }); // 👈 dusre ko batao maine dekh liya
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [chatUser]);

  // Realtime listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const isRelevant =
        (message.senderId === chatUser?._id && message.receiverId === user._id) ||
        (message.senderId === user._id && message.receiverId === chatUser?._id);

      if (isRelevant) {
        setMessages((prev) => [...prev, message]);
        if (message.senderId === chatUser?._id) {
          markAsSeen(chatUser._id);
          socket.emit("messagesSeen", { receiverId: chatUser._id });
        }
      }
    };

    const handleUserTyping = ({ senderId }) => {
      if (senderId === chatUser?._id) setIsTyping(true);
    };

    const handleUserStopTyping = ({ senderId }) => {
      if (senderId === chatUser?._id) setIsTyping(false);
    };

    const handleMessagesSeen = ({ seenBy }) => {
      // Jab dusra user mera message dekh le, apne messages ko "seen: true" update karo
      if (seenBy === chatUser?._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user._id ? { ...msg, seen: true } : msg
          )
        );
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("messagesSeenUpdate", handleMessagesSeen);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messagesSeenUpdate", handleMessagesSeen);
    };
  }, [socket, chatUser, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Chat badalte waqt typing state reset karo
  useEffect(() => {
    setIsTyping(false);
  }, [chatUser]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      const res = await sendMessage({ receiverId: chatUser._id, text });
      if (res.status) {
        setMessages((prev) => [...prev, res.message]);
        setText("");
        socket?.emit("stopTyping", { receiverId: chatUser._id }); // 👈 send hote hi typing band
        clearTimeout(typingTimeoutRef.current);
        onMessageSent?.(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 👇 Input change pe typing event bhejo (debounced)
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!socket || !chatUser) return;

    socket.emit("typing", { receiverId: chatUser._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: chatUser._id });
    }, 1500); // 1.5s ruk gaye typing se to stopTyping bhej do
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
        <img src={chatUser.profilePic || Nopfp} alt="" height={40} className="profile-image" />
        <div className="chat-user-info w-100 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="username p-0 m-0">{chatUser.name}</h4>
            <p className="online-indicator p-0 m-0">
              {isTyping
                ? "typing..."
                : onlineUsers.includes(chatUser._id)
                  ? <span style={{ color: "#16a808" }}>Online</span>
                  : "Offline"}
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
        {messages.map((msg, index) => {
          const isMine = msg.senderId === user._id;
          const isLastMineMessage =
            isMine && index === messages.map((m) => m.senderId === user._id).lastIndexOf(true);

          return (
            <div key={msg._id} className={isMine ? "sent" : "received"}>
              {msg.text}
              {/* Sirf apna last sent message pe seen/delivered dikhao */}
              {isLastMineMessage && (
                <span className={`seen-status ${msg.seen ? "seen" : "delivered"}`}>
                  {msg.seen ? <CheckCheck size={15} /> : <CheckCheck size={15} />}
                </span>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="typing-indicator received">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="message-box">
        <input
          type="text"
          placeholder="Type a message..."
          className="message-input"
          value={text}
          onChange={handleInputChange}
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