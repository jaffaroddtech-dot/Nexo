import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Home.css";
import HomeNot from "../../Components/NotLoggedPages/HomeNotLogged/HomeNot.jsx";
import { useSelector } from "react-redux";
import { getConversation } from "../../../Apis/messages.js";
import Nopfp from "../../Assets/nopfp.jpg";
import ChatWindow from "../../Components/Chatwindow/Chatwindow.jsx";
import { Search, SquarePen, MessageSquareText, Image, Video, FileText, Mic } from "lucide-react";
import { useSocket } from "../../../SocketContext/sockectContext.jsx";
import { formatChatTime, getConversationPreview } from "../../Helpers/Helper.js";
const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();
  const [selected, setSelected] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadMap, setUnreadMap] = useState({}); // { userId: count }
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (location.state?.chatUser) {
      setSelectedChat(location.state.chatUser);
    }
  }, [location.state]);

  // mobile pe chat khuli ho to navbar hide karne ke liye body pe class
  useEffect(() => {
    document.body.classList.toggle("chat-open", isMobile && !!selectedChat);
    return () => document.body.classList.remove("chat-open");
  }, [isMobile, selectedChat]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversation();

      if (res.status) {
        setConversations(res.conversations);

        const unreadCounts = {};

        res.conversations.forEach((conv) => {
          if (conv.unreadCount > 0) {
            unreadCounts[conv.user._id] = conv.unreadCount;
          }
        });

        setUnreadMap(unreadCounts);
      }
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

      const senderId =
        typeof message.senderId === "object"
          ? message.senderId._id
          : message.senderId;

      const receiverId =
        typeof message.receiverId === "object"
          ? message.receiverId._id
          : message.receiverId;

      const otherUserId =
        String(senderId) === String(user._id)
          ? String(receiverId)
          : String(senderId);

      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) => String(c.user._id) === String(otherUserId)
        );

        if (existingIndex !== -1) {
          const updated = [...prev];
          const [conv] = updated.splice(existingIndex, 1);

          const preview = getConversationPreview(message);

          const updatedConv = {
            ...conv,
            lastMessage: preview.text,
            lastMessageType: preview.type,
            lastMessageTime:
              message.createdAt || new Date().toISOString(),
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
        message.senderId === user._id || message.receiverId === user._id;

      if (isRelevantToMe) {
        updateConversationsWithMessage(message);
      }

      const senderId = message.senderId?.toString?.() || message.senderId;

      if (senderId === user._id) return;
      if (senderId === selectedChat?._id) return;

      setUnreadMap((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    };

    const handleMessageDeleted = ({ senderId, receiverId }) => {
      fetchConversations();
      const otherUserId =
        String(senderId) === String(user._id) ? receiverId : senderId;

      setConversations((prev) =>
        prev.map((conv) =>
          String(conv.user._id) === String(otherUserId)
            ? { ...conv, lastMessage: "🚫 This message was deleted" }
            : conv
        )
      );
    };

    const handleUserTyping = ({ senderId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: true,
      }));
    };

    const handleUserStopTyping = ({ senderId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[senderId];
        return updated;
      });
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.user._id === userId
            ? {
              ...conv,
              user: {
                ...conv.user,
                online: false,
                lastSeen,
              },
            }
            : conv
        )
      );

      setSelectedChat((prev) =>
        prev?._id === userId
          ? {
            ...prev,
            online: false,
            lastSeen,
          }
          : prev
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("userOffline", handleUserOffline);
    };
  }, [socket, user, selectedChat, updateConversationsWithMessage]);

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

  // "Unread" tab filter
  const visibleConversations =
    selected === "unread"
      ? conversations.filter((conv) => unreadMap[conv.user._id])
      : conversations;

  const filteredConversations = visibleConversations.filter((conv) => {
    const name = conv.user.name?.toLowerCase() || "";
    const message = conv.lastMessage?.toLowerCase() || "";
    const query = search.toLowerCase();

    return name.includes(query) || message.includes(query);
  });

  // kitni chats mein unread messages hain (tab badge ke liye)
  const unreadTotal = Object.keys(unreadMap).length;

  return (
    <div className="Main">
      {(!isMobile || !selectedChat) && (
        <div className="messages-content">
          {/* HEADER */}
          <div className="chats-header">
            <div className="chats-title-row">
              <h3 className="chats-title">Chats</h3>
              <button type="button" className="new-button">
                <SquarePen size={15} />
                <span>New</span>
              </button>
            </div>

            <div className="chat-search">
              <Search size={16} />
              <input
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="chat-tabs">
              <button
                type="button"
                className={`chat-tab ${selected === "all" ? "is-active" : ""}`}
                onClick={() => setSelected("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`chat-tab ${selected === "unread" ? "is-active" : ""}`}
                onClick={() => setSelected("unread")}
              >
                Unread
                {unreadTotal > 0 && <span className="tab-badge">{unreadTotal}</span>}
              </button>
            </div>
          </div>

          {/* LIST */}
          <div className="messages-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const unreadCount = unreadMap[conv.user._id] || 0;
                const isActive = selectedChat?._id === conv.user._id;
                const isTyping = !!typingUsers[conv.user._id];

                return (
                  <div
                    key={conv.user._id}
                    role="button"
                    tabIndex={0}
                    className={`messages ${isActive ? "is-active" : ""} ${unreadCount > 0 ? "is-unread" : ""
                      }`}
                    onClick={() => handleSelectChat(conv.user)}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectChat(conv.user)}
                  >
                    <div className="profilePictures">
                      <img
                        src={conv.user.profilePic || Nopfp}
                        alt=""
                        className="profile-image"
                      />
                      {onlineUsers.includes(conv.user._id) && (
                        <span className="online-dot" />
                      )}
                    </div>

                    <div className="message-content">
                      <div className="message-header">
                        <h6 className="message-sender">{conv.user.name}</h6>
                        <span className="message-time">
                          {formatChatTime(conv.lastMessageTime)}
                        </span>
                      </div>

                      <div className="message-row">
                        <div className={`message-text ${isTyping ? "is-typing" : ""}`}>
                          {!isTyping && conv.lastMessageType === "image" && (
                            <Image size={14} />
                          )}

                          {!isTyping && conv.lastMessageType === "video" && (
                            <Video size={14} />
                          )}

                          {!isTyping && conv.lastMessageType === "file" && (
                            <FileText size={14} />
                          )}
                          {!isTyping && conv.lastMessageType === "audio" && (
                            <Mic size={14} />
                          )}

                          <span>
                            {isTyping ? "typing..." : conv.lastMessage}
                          </span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="unread-dot">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-contacts">
                <MessageSquareText size={34} />
                <p>
                  {search
                    ? "No chats found"
                    : selected === "unread"
                      ? "no unread messages"
                      : "no conversations yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      )
      }

      {
        (!isMobile || selectedChat) && (
          <div className="User-messages">
            <ChatWindow
              chatUser={selectedChat}
              onMessageSent={updateConversationsWithMessage}
              onBack={isMobile ? () => setSelectedChat(null) : undefined}
            />
          </div>
        )
      }
    </div >
  );
};

export default Home;