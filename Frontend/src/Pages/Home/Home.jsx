import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Home.css";
import HomeNot from "../../Components/NotLoggedPages/HomeNotLogged/HomeNot.jsx";
import { useSelector } from "react-redux";
import { getConversation } from "../../../Apis/messages.js";
import Nopfp from "../../Assets/nopfp.jpg";
import ChatWindow from "../../Components/Chatwindow/Chatwindow.jsx";
import { ChevronLeft } from "lucide-react"
import { useSocket } from "../../../SocketContext/sockectContext.jsx";

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();
  const [selected, setSelected] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState("");
  const [typingUsers, setTypingUsers] = useState({})
  const [unreadMap, setUnreadMap] = useState({}); // ✅ { userId: true }
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  useEffect(() => {
    if (location.state?.chatUser) {
      setSelectedChat(location.state.chatUser);
    }
  }, [location.state]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
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
    const handleUserTyping = ({
      senderId,
    }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: true,
      }));
    };

    const handleUserStopTyping = ({
      senderId,
    }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };

        delete updated[senderId];

        return updated;
      });
    };

    const handleUserOffline = ({
      userId,
      lastSeen,
    }) => {

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

    socket.on(
      "messageDeleted",
      handleMessageDeleted
    );
    socket.on(
      "userTyping",
      handleUserTyping
    );

    socket.on(
      "userStopTyping",
      handleUserStopTyping
    );

    socket.on(
      "userOffline",
      handleUserOffline
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "userTyping",
        handleUserTyping
      );

      socket.off(
        "userStopTyping",
        handleUserStopTyping
      );

      socket.off(
        "messageDeleted",
        handleMessageDeleted
      );

      socket.off(
        "userOffline",
        handleUserOffline
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


  const filteredConversations = visibleConversations.filter((conv) => {
    const name = conv.user.name?.toLowerCase() || "";
    const message = conv.lastMessage?.toLowerCase() || "";
    const query = search.toLowerCase();

    return (
      name.includes(query) ||
      message.includes(query)
    );
  });


  return (
    <div className="Main">
      {(!isMobile || !selectedChat) && (
        <div className="messages-content">
          <div className="p-4 border-bottom">
            <h3 className="fw-bold mb-1">Chats</h3>

            <small className="text-muted">
              Select a conversation to get started
            </small>

            <div className="pt-2">
              <input
                className="search__input"
                placeholder="Search Chats..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <div className="mt-3 d-flex align-items-center justify-content-between">
              <div
                className="radio-input"
                style={{
                  "--translate":
                    selected === "all"
                      ? "0%"
                      : "100%",
                }}
              >
                <label
                  onClick={() =>
                    setSelected("all")
                  }
                >
                  <span
                    className={
                      selected === "all"
                        ? "active"
                        : ""
                    }
                  >
                    All
                  </span>
                </label>

                <label
                  onClick={() =>
                    setSelected("unread")
                  }
                >
                  <span
                    className={
                      selected === "unread"
                        ? "active"
                        : ""
                    }
                  >
                    Unread
                  </span>
                </label>

                <div className="selection"></div>
              </div>

              <button className="new-button">
                New Message
              </button>
            </div>
          </div>

          <div className="messages-list mt-3">
            {filteredConversations.length >
              0 ? (
              filteredConversations.map(
                (conv) => {
                  const unreadCount =
                    unreadMap[
                    conv.user._id
                    ] || 0;

                  return (
                    <div
                      key={conv.user._id}
                      className="messages"
                      onClick={() =>
                        handleSelectChat(
                          conv.user
                        )
                      }
                    >
                      <div className="profilePictures">
                        <img
                          src={conv.user.profilePic || Nopfp}
                          alt="Profile"
                          className="profile-image"
                        />

                        {onlineUsers.includes(conv.user._id) && (
                          <span className="online-dot" />
                        )}
                      </div>

                      <div className="message-content">
                        <div className="message-header">
                          <h6 className="message-sender mb-0">
                            {
                              conv.user
                                .name
                            }
                          </h6>

                          <span className="message-time">
                            {new Date(
                              conv.lastMessageTime
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        <p
                          className="message-text"
                          style={
                            typingUsers[
                              conv.user._id
                            ]
                              ? {
                                color: "#7758f9",
                                fontStyle:
                                  "italic",
                              }
                              : {}
                          }
                        >
                          {typingUsers[
                            conv.user._id
                          ]
                            ? "typing..."
                            : conv.lastMessage}
                        </p>
                      </div>

                      {unreadCount >
                        0 && (
                          <span className="unread-dot">
                            {unreadCount >
                              9
                              ? "9+"
                              : unreadCount}
                          </span>
                        )}
                    </div>
                  );
                }
              )
            ) : (
              <div className="no-contacts text-center">
                <p className="text-muted">
                  No conversations found
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(!isMobile || selectedChat) && (
        <div className="User-messages">
          {isMobile &&
            selectedChat && (
              <button
                className="mobile-back-btn"
                onClick={() =>
                  setSelectedChat(
                    null
                  )
                }
              >
                <ChevronLeft />
              </button>
            )}

          <ChatWindow
            chatUser={selectedChat}
            onMessageSent={
              fetchConversations
            }
          />
        </div>
      )}
    </div>
  );
};

export default Home;