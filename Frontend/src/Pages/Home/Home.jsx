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
  const [unreadMap, setUnreadMap] = useState({}); // ✅ { userId: true }
  const location = useLocation();

  useEffect(() => {
    if (location.state?.chatUser) {
      setSelectedChat(location.state.chatUser);
    }
  }, [location.state]);

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

  const updateConversationsWithMessage = useCallback(
    (message) => {
      const otherUserId =
        message.senderId === user._id ? message.receiverId : message.senderId;

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.user._id === otherUserId);

        if (existingIndex !== -1) {
          const updated = [...prev];
          const [conv] = updated.splice(existingIndex, 1);
          const updatedConv = {
            ...conv,
            lastMessage: message.text,
            lastMessageTime: message.createdAt || new Date().toISOString(),
          };
          return [updatedConv, ...updated];
        }

        fetchConversations();
        return prev;
      });
    },
    [user, fetchConversations]
  );

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (message) => {
      const isRelevantToMe =
        message.senderId === user._id ||
        message.receiverId === user._id;

      if (isRelevantToMe) {
        updateConversationsWithMessage(message);
      }

      const senderId =
        message.senderId?.toString?.() ||
        message.senderId;

      if (senderId === user._id) return;
      if (senderId === selectedChat?._id) return;

      setUnreadMap((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    };

    // ✅ Delete event
    const handleMessageDeleted = ({
      senderId,
      receiverId,
    }) => {
      fetchConversations();
      const otherUserId =
        String(senderId) === String(user._id)
          ? receiverId
          : senderId;

      setConversations((prev) =>
        prev.map((conv) =>
          String(conv.user._id) === String(otherUserId)
            ? {
              ...conv,
              lastMessage:
                "🚫 This message was deleted",
            }
            : conv
        )
      );
    };

    socket.on("newMessage", handleNewMessage);

    socket.on(
      "messageDeleted",
      handleMessageDeleted
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "messageDeleted",
        handleMessageDeleted
      );
    };
  }, [
    socket,
    user,
    selectedChat,
    updateConversationsWithMessage,
  ]);
  const handleSelectChat = (convUser) => {
    setSelectedChat(convUser);
    setUnreadMap((prev) => {
      if (!prev[convUser._id]) return prev;
      const updated = { ...prev };
      delete updated[convUser._id];
      return updated;
    });
  };

  if (!user) {
    return <HomeNot />;
  }

  // ✅ "Unread" tab filter
  const visibleConversations =
    selected === "unread"
      ? conversations.filter((conv) => unreadMap[conv.user._id])
      : conversations;

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
          {visibleConversations.length > 0 ? visibleConversations.map((conv) => {
            const unreadCount = unreadMap[conv.user._id] || 0;
            return (
              <div
                key={conv.user._id}
                className="messages p-2 d-flex gap-3"
                onClick={() => handleSelectChat(conv.user)}
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

                {unreadCount > 0 && (
                  <span className="unread-dot">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            );
          }) : <div>No conversations found.</div>}
        </div>
      </div>
          {console.log("conversation", conversations)}
      <div className="User-messages">
        <ChatWindow
          chatUser={selectedChat}
          onMessageSent={fetchConversations}
        />
      </div>
    </div>
  );
};

export default Home;