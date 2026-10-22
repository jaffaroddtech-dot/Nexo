import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "./Home.css";
import "../../Components/groups/Group.css";
import HomeNot from "../../Components/NotLoggedPages/HomeNotLogged/HomeNot.jsx";
import { useSelector } from "react-redux";
import { getConversation } from "../../../Apis/messages.js";
import {
  getGroups,
  leaveGroup,
  normalizeGroup,
  getMemberName,
} from "../../../Apis/group.js";
import { deleteChat, deleteGroup } from "../../../Apis/chatDelete.js";
import NewChat from "../../Components/newChat/NewChat.jsx";
import NewGroup from "../../Components/groups/NewGroup.jsx";
import GroupInfo from "../../Components/groups/GroupInfo.jsx";
import Nopfp from "../../Assets/nopfp.jpg";
import ChatWindow from "../../Components/Chatwindow/Chatwindow.jsx";
import {
  Search,
  SquarePen,
  Users,
  MessageSquareText,
  Image,
  Video,
  FileText,
  Mic,
  Ellipsis,
  Trash2,
  LogOut,
} from "lucide-react";
import { useSocket } from "../../../SocketContext/sockectContext.jsx";
import { formatChatTime, getConversationPreview } from "../../Helpers/Helper.js";

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();
  const [selected, setSelected] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [groupTyping, setGroupTyping] = useState({}); // { chatId: [senderId] }
  const [unreadMap, setUnreadMap] = useState({}); // { userId: count }
  const [groupUnreadMap, setGroupUnreadMap] = useState({}); // { chatId: count }

  // delete chat
  const [menu, setMenu] = useState(null); // { x, y, item }
  const [confirmItem, setConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (location.state?.chatUser) {
      setSelectedChat(location.state.chatUser);
    }
  }, [location.state]);

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

  // context menu: bahar click / scroll / resize / Esc par band
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKeyDown = (e) => e.key === "Escape" && close();

    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("contextmenu", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("contextmenu", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

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

  const fetchGroups = useCallback(async (applyUnread = true) => {
    try {
      const res = await getGroups();

      if (res.status) {
        const list = res.groups.map(normalizeGroup);
        setGroups(list);

        if (applyUnread) {
          const counts = {};
          list.forEach((g) => {
            if (g.unreadCount > 0) counts[g._id] = g.unreadCount;
          });
          setGroupUnreadMap(counts);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    fetchGroups();
  }, [user, fetchConversations, fetchGroups]);

  // group add / update (naya ho to list mein jorr do, warna merge)
  const applyGroupUpdate = useCallback((raw) => {
    const g = normalizeGroup(raw);
    setGroups((prev) =>
      prev.some((x) => x._id === g._id)
        ? prev.map((x) => (x._id === g._id ? { ...x, ...g } : x))
        : [g, ...prev]
    );
    setSelectedChat((prev) => (prev?._id === g._id ? { ...prev, ...g } : prev));
  }, []);

  const removeGroupLocally = useCallback((chatId) => {
    setGroups((prev) => prev.filter((g) => String(g._id) !== String(chatId)));
    setGroupUnreadMap((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
    setSelectedChat((prev) => (String(prev?._id) === String(chatId) ? null : prev));
    setShowGroupInfo(false);
  }, []);

  // 1-1 chat list se hata do
  const removeConversationLocally = useCallback((userId) => {
    setConversations((prev) =>
      prev.filter((c) => String(c.user._id) !== String(userId))
    );
    setUnreadMap((prev) => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
    setSelectedChat((prev) => (String(prev?._id) === String(userId) ? null : prev));
  }, []);

  const updateGroupWithMessage = useCallback(
    (message) => {
      setGroups((prev) => {
        const idx = prev.findIndex((g) => String(g._id) === String(message.chatId));
        if (idx === -1) {
          fetchGroups();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessage: message,
          updatedAt: message.createdAt || new Date().toISOString(),
        };
        return updated;
      });
    },
    [fetchGroups]
  );

  const updateConversationsWithMessage = useCallback(
    (message) => {
      // delete jaisi jagah se bina message ke call hota hai -> sab refresh
      if (!message) {
        fetchConversations();
        fetchGroups(false);
        return;
      }

      // group message
      if (message.chatId) {
        updateGroupWithMessage(message);
        return;
      }

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
    [user, fetchConversations, fetchGroups, updateGroupWithMessage]
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
            ? { ...conv, user: { ...conv.user, online: false, lastSeen } }
            : conv
        )
      );

      setSelectedChat((prev) =>
        prev?._id === userId ? { ...prev, online: false, lastSeen } : prev
      );
    };

    /* ---------- GROUP EVENTS ---------- */
    const handleNewGroupMessage = (message) => {
      updateGroupWithMessage(message);

      const senderId = String(message.senderId?._id || message.senderId);
      if (senderId === String(user._id)) return;
      if (String(selectedChat?._id) === String(message.chatId)) return;

      setGroupUnreadMap((prev) => ({
        ...prev,
        [message.chatId]: (prev[message.chatId] || 0) + 1,
      }));
    };

    const handleGroupTyping = ({ chatId, senderId }) => {
      setGroupTyping((prev) => {
        const cur = prev[chatId] || [];
        return cur.includes(senderId) ? prev : { ...prev, [chatId]: [...cur, senderId] };
      });
    };

    const handleGroupStopTyping = ({ chatId, senderId }) => {
      setGroupTyping((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        const next = cur.filter((id) => id !== senderId);
        const copy = { ...prev };
        if (next.length) copy[chatId] = next;
        else delete copy[chatId];
        return copy;
      });
    };

    const handleGroupMessageDeleted = () => fetchGroups(false);
    const handleRemoved = ({ chatId }) => removeGroupLocally(chatId);

    /* ---------- CHAT / GROUP DELETED (doosre ne delete ki) ---------- */
    const handleChatDeleted = ({ userId }) => removeConversationLocally(userId);
    const handleGroupDeleted = ({ chatId }) => removeGroupLocally(chatId);

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("userOffline", handleUserOffline);

    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("groupTyping", handleGroupTyping);
    socket.on("groupStopTyping", handleGroupStopTyping);
    socket.on("groupMessageDeleted", handleGroupMessageDeleted);
    socket.on("addedToGroup", applyGroupUpdate);
    socket.on("groupUpdated", applyGroupUpdate);
    socket.on("removedFromGroup", handleRemoved);

    socket.on("chatDeleted", handleChatDeleted);
    socket.on("groupDeleted", handleGroupDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("userOffline", handleUserOffline);

      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("groupTyping", handleGroupTyping);
      socket.off("groupStopTyping", handleGroupStopTyping);
      socket.off("groupMessageDeleted", handleGroupMessageDeleted);
      socket.off("addedToGroup", applyGroupUpdate);
      socket.off("groupUpdated", applyGroupUpdate);
      socket.off("removedFromGroup", handleRemoved);

      socket.off("chatDeleted", handleChatDeleted);
      socket.off("groupDeleted", handleGroupDeleted);
    };
  }, [
    socket,
    user,
    selectedChat,
    updateConversationsWithMessage,
    updateGroupWithMessage,
    applyGroupUpdate,
    removeGroupLocally,
    removeConversationLocally,
    fetchConversations,
    fetchGroups,
  ]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setUnreadMap((prev) => {
      if (!prev[chat._id]) return prev;
      const updated = { ...prev };
      delete updated[chat._id];
      return updated;
    });
    setGroupUnreadMap((prev) => {
      if (!prev[chat._id]) return prev;
      const updated = { ...prev };
      delete updated[chat._id];
      return updated;
    });
  };

  // 1-1 conversations + groups ek hi list mein, latest upar
  const items = useMemo(() => {
    const dm = conversations.map((conv) => ({
      key: conv.user._id,
      isGroup: false,
      chat: conv.user,
      name: conv.user.name,
      pic: conv.user.profilePic,
      lastMessage: conv.lastMessage,
      lastMessageType: conv.lastMessageType,
      lastMessageTime: conv.lastMessageTime,
    }));

    const gr = groups.map((g) => {
      const lm = g.lastMessage;
      const preview = lm ? getConversationPreview(lm) : null;
      let prefix = "";
      if (lm && !lm.isDeleted) {
        prefix =
          String(lm.senderId) === String(user?._id)
            ? "You: "
            : `${getMemberName(g, lm.senderId, "Someone").split(" ")[0]}: `;
      }
      return {
        key: g._id,
        isGroup: true,
        chat: g,
        name: g.chatName,
        pic: g.groupAvatar,
        lastMessage: preview ? `${prefix}${preview.text}` : "No messages yet",
        lastMessageType: preview?.type,
        lastMessageTime: lm?.createdAt || g.updatedAt,
      };
    });

    return [...dm, ...gr].sort(
      (a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
    );
  }, [conversations, groups, user]);

  if (!user) {
    return <HomeNot />;
  }

  /* ---------- delete chat ---------- */
  const isGroupAdmin = (g) =>
    String(g.groupAdmin?._id || g.groupAdmin) === String(user._id);

  // right-click ya 3 dots
  const openMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: Math.max(8, Math.min(e.clientX, window.innerWidth - 210)),
      y: Math.max(8, Math.min(e.clientY, window.innerHeight - 70)),
      item,
    });
  };

  const getMenuLabel = (item) =>
    !item.isGroup
      ? "Delete chat"
      : isGroupAdmin(item.chat)
        ? "Delete group"
        : "Leave group";

  const getConfirmCopy = (item) => {
    if (!item.isGroup)
      return {
        title: "Delete chat?",
        text: `This chat with ${item.name} will be removed from your chats.`,
        action: "Delete chat",
      };
    if (isGroupAdmin(item.chat))
      return {
        title: "Delete group?",
        text: `"${item.name}" and all its messages and media will be permanently deleted for every member. This can't be undone.`,
        action: "Delete group",
      };
    return {
      title: "Leave group?",
      text: `You will no longer receive messages from "${item.name}".`,
      action: "Leave group",
    };
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmItem(null);
    setConfirmError("");
  };

  const handleConfirmDelete = async () => {
    if (!confirmItem || deleting) return;
    const item = confirmItem;

    setDeleting(true);
    setConfirmError("");
    try {
      let res;
      if (!item.isGroup) res = await deleteChat(item.key);
      else if (isGroupAdmin(item.chat)) res = await deleteGroup(item.key);
      else res = await leaveGroup(item.key);

      if (res.status) {
        if (item.isGroup) removeGroupLocally(item.key);
        else removeConversationLocally(item.key);
        setConfirmItem(null);
      } else {
        setConfirmError(res.message || "Something went wrong");
      }
    } catch (err) {
      setConfirmError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const unreadOf = (key) => unreadMap[key] || groupUnreadMap[key] || 0;

  const query = search.toLowerCase();
  const filteredItems = items.filter((item) => {
    if (selected === "unread" && !unreadOf(item.key)) return false;
    const name = item.name?.toLowerCase() || "";
    const message = item.lastMessage?.toLowerCase() || "";
    return name.includes(query) || message.includes(query);
  });

  const unreadTotal =
    Object.keys(unreadMap).length + Object.keys(groupUnreadMap).length;

  const contacts = conversations.map((c) => c.user);

  const confirmCopy = confirmItem ? getConfirmCopy(confirmItem) : null;

  return (
    <div className="Main">
      {(!isMobile || !selectedChat) && (
        <div className="messages-content">
          {/* HEADER */}
          <div className="chats-header">
            <div className="chats-title-row">
              <h3 className="chats-title">Chats</h3>
              <div className="chats-title-actions">
                <button
                  type="button"
                  className="new-button"
                  onClick={() => setShowNewGroup(true)}
                >
                  <Users size={15} />
                  <span>Group</span>
                </button>
                <button
                  type="button"
                  className="new-button"
                  onClick={() => setShowNewChat(true)}
                >
                  <SquarePen size={15} />
                  <span>New</span>
                </button>
              </div>
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
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const unreadCount = unreadOf(item.key);
                const isActive = selectedChat?._id === item.key;
                const typingIds = item.isGroup ? groupTyping[item.key] : null;
                const isTyping = item.isGroup
                  ? !!typingIds?.length
                  : !!typingUsers[item.key];
                const typingText = item.isGroup
                  ? `${getMemberName(item.chat, typingIds?.[0], "Someone")} is typing...`
                  : "typing...";
                const menuOpen = menu?.item.key === item.key;

                return (
                  <div
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    className={`messages ${isActive ? "is-active" : ""} ${unreadCount > 0 ? "is-unread" : ""
                      } ${menuOpen ? "menu-open" : ""}`}
                    onClick={() => handleSelectChat(item.chat)}
                    onContextMenu={(e) => openMenu(e, item)}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectChat(item.chat)}
                  >
                    <div className="profilePictures">
                      {item.isGroup && !item.pic ? (
                        <div className="profile-image group-avatar-fallback">
                          <Users size={22} />
                        </div>
                      ) : (
                        <img
                          src={item.pic || Nopfp}
                          alt=""
                          className="profile-image"
                        />
                      )}
                      {!item.isGroup && onlineUsers.includes(item.key) && (
                        <span className="online-dot" />
                      )}
                    </div>

                    <div className="message-content">
                      <div className="message-header">
                        <h6 className="message-sender">{item.name}</h6>
                        <span className="message-time">
                          {formatChatTime(item.lastMessageTime)}
                        </span>
                      </div>

                      <div className="message-row">
                        <div className={`message-text ${isTyping ? "is-typing" : ""}`}>
                          {!isTyping && item.lastMessageType === "image" && (
                            <Image size={14} />
                          )}
                          {!isTyping && item.lastMessageType === "video" && (
                            <Video size={14} />
                          )}
                          {!isTyping && item.lastMessageType === "file" && (
                            <FileText size={14} />
                          )}
                          {!isTyping && item.lastMessageType === "audio" && (
                            <Mic size={14} />
                          )}

                          <span>{isTyping ? typingText : item.lastMessage}</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="unread-dot">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="chat-row-menu-btn"
                      aria-label="Chat options"
                      onClick={(e) => openMenu(e, item)}
                    >
                      <Ellipsis size={16} />
                    </button>
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
      )}

      {(!isMobile || selectedChat) && (
        <div className="User-messages">
          <ChatWindow
            chatUser={selectedChat}
            onMessageSent={updateConversationsWithMessage}
            onBack={isMobile ? () => setSelectedChat(null) : undefined}
            onOpenInfo={
              selectedChat?.isGroup ? () => setShowGroupInfo(true) : undefined
            }
          />
        </div>
      )}

      {showNewChat && (
        <NewChat
          contacts={contacts}
          onClose={() => setShowNewChat(false)}
          onSelect={(u) => {
            handleSelectChat(u);
            setShowNewChat(false);
          }}
        />
      )}

      {showNewGroup && (
        <NewGroup
          contacts={contacts}
          onClose={() => setShowNewGroup(false)}
          onCreated={(group) => {
            const g = normalizeGroup(group);
            setGroups((prev) => (prev.some((x) => x._id === g._id) ? prev : [g, ...prev]));
            handleSelectChat(g);
            setShowNewGroup(false);
          }}
        />
      )}

      {showGroupInfo && selectedChat?.isGroup && (
        <GroupInfo
          group={selectedChat}
          me={user}
          contacts={contacts}
          onClose={() => setShowGroupInfo(false)}
          onGroupChange={applyGroupUpdate}
          onLeft={removeGroupLocally}
        />
      )}

      {/* RIGHT-CLICK / 3 DOTS MENU */}
      {menu && (
        <div
          className="chat-context-menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => {
              setConfirmItem(menu.item);
              setConfirmError("");
              setMenu(null);
            }}
          >
            {menu.item.isGroup && !isGroupAdmin(menu.item.chat) ? (
              <LogOut size={16} />
            ) : (
              <Trash2 size={16} />
            )}
            {getMenuLabel(menu.item)}
          </button>
        </div>
      )}

      {/* CONFIRM POPUP */}
      {confirmItem && confirmCopy && (
        <div className="gm-overlay" onClick={closeConfirm}>
          <div
            className="gm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="gm-header">
              <h4>{confirmCopy.title}</h4>
            </div>

            <div className="gm-body">
              <p className="gm-confirm-text">{confirmCopy.text}</p>
              {confirmError && <div className="gm-error">{confirmError}</div>}
            </div>

            <div className="gm-footer">
              <button
                type="button"
                className="gm-btn"
                onClick={closeConfirm}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gm-btn danger-fill"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : confirmCopy.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;