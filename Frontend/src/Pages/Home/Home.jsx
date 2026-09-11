
import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Home.css";
import HomeNot from "../../Components/NotLoggedPages/HomeNotLogged/HomeNot.jsx";
import { useSelector } from "react-redux";
import { getConversation } from "../../../Apis/messages.js";
import Nopfp from "../../Assets/nopfp.jpg";
import ChatWindow from "../../Components/Chatwindow/Chatwindow.jsx";
import { useSocket } from "../../../SocketContext/sockectContext.jsx";

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();
  const [selected, setSelected] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.chatUser) {
      setSelectedChat(location.state.chatUser);
    }
  }, [location.state]);

  // 👇 function ko reusable banaya taake naye/unknown conversation ke liye refetch kar sakein
  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversation();
      if (res.status) setConversations(res.conversations);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user, fetchConversations]);

  // 👇 Sidebar ko local state me hi update karo (bina full refetch ke) — fast aur smooth
  const updateConversationsWithMessage = useCallback(
    (message) => {
      const otherUserId =
        message.senderId === user._id ? message.receiverId : message.senderId;

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.user._id === otherUserId);

        if (existingIndex !== -1) {
          // Existing conversation hai — update karo aur top pe le aao
          const updated = [...prev];
          const [conv] = updated.splice(existingIndex, 1);
          const updatedConv = {
            ...conv,
            lastMessage: message.text,
            lastMessageTime: message.createdAt || new Date().toISOString(),
          };
          return [updatedConv, ...updated];
        }

        // Bilkul naya banda hai jo list me nahi tha — uska profile info nahi hai humare paas
        // isliye backend se poori list refetch kar lete hain
        fetchConversations();
        return prev;
      });
    },
    [user, fetchConversations]
  );

  // 👇 Socket se realtime naye messages sunkar sidebar update karo
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (message) => {
      const isRelevantToMe =
        message.senderId === user._id || message.receiverId === user._id;

      if (isRelevantToMe) {
        updateConversationsWithMessage(message);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, user, updateConversationsWithMessage]);

  if (!user) {
    return <HomeNot />;
  }

  return (
    <div className="Main">
      <div className="messages-content d-flex flex-column justfify-content-start">
        <div className="p-4 border-bottom">
          <h3 className="fw-bold mb-1">Chats</h3>
          <small className="text-muted">Select a conversation to get started</small>
          <div className="pt-2">
            <input className="search__input" placeholder="Search Chats..." />
          </div>

          <div className="mt-3 d-flex align-items-center justify-content-between ">
            <div
              className="radio-input"
              style={{ "--translate": selected === "all" ? "0%" : "100%" }}
            >
              <label onClick={() => setSelected("all")}>
                <span className={selected === "all" ? "active" : ""}>All</span>
              </label>
              <label onClick={() => setSelected("unread")}>
                <span className={selected === "unread" ? "active" : ""}>Unread</span>
              </label>
              <div className="selection"></div>
            </div>
            <button className="new-button">New Message</button>
          </div>
        </div>

        <div className="messages-list mt-3">
          {conversations.length > 0 ? conversations.map((conv) => (
            <div
              key={conv.user._id}
              className="messages p-2 d-flex gap-3"
              onClick={() => setSelectedChat(conv.user)}
            >
              <div className="profilePictures">
                <img src={conv.user.profilePic || Nopfp} alt="Profile" className="profile-image" />
                {onlineUsers.includes(conv.user._id) && <span className="online-dot" />}
              </div>

              <div className="message-content">
                <div className="message-header">
                  <h6 className="message-sender mb-0">{conv.user.name}</h6>
                  <span className="message-time">
                    {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="message-text">{conv.lastMessage}</p>
              </div>
            </div>
          )) : <div>No conversations found.</div>}
        </div>
      </div>

      <div className="User-messages">
        <ChatWindow
          chatUser={selectedChat}
          onMessageSent={updateConversationsWithMessage} // 👈 naya prop
        />
      </div>
    </div>
  );
};

export default Home;