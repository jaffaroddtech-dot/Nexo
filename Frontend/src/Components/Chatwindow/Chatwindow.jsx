import React, { useEffect, useState, useRef } from "react";
import "./Chatwindow.css";
import Nopfp from "../../Assets/nopfp.jpg";

import {
  Phone,
  Video,
  Info,
  Type,
  Paperclip,
  Link2,
  Smile,
  Trash2,
  Send,
  CheckCheck,
  Ellipsis,
} from "lucide-react";

import { useSelector } from "react-redux";
import { useSocket } from "../../../SocketContext/sockectContext.jsx";

import {
  getMessages,
  sendMessage,
  markAsSeen,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from "../../../Apis/messages";

const ChatWindow = ({ chatUser, onMessageSent }) => {
  console.log( "chatuser", chatUser);
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // FETCH MESSAGES WHEN CHAT USER CHANGES

  useEffect(() => {
    if (!chatUser) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setMessages([]);
        setOpenMenuId(null);

        const res = await getMessages(chatUser._id);

        if (res.status) {
          setMessages(res.messages);
        }

        await markAsSeen(chatUser._id);

        socket?.emit("messagesSeen", {
          receiverId: chatUser._id,
        });
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();
  }, [chatUser?._id, socket]);

  // SOCKET EVENTS

  useEffect(() => {
    if (!socket || !chatUser || !user) return;
    // NEW MESSAGE
    const handleNewMessage = (message) => {
      const isRelevant =
        (message.senderId === chatUser._id &&
          message.receiverId === user._id) ||
        (message.senderId === user._id &&
          message.receiverId === chatUser._id);

      if (!isRelevant) return;

      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) => msg._id === message._id
        );

        if (alreadyExists) {
          return prev;
        }

        return [...prev, message];
      });
      if (message.senderId === chatUser._id) {
        markAsSeen(chatUser._id);

        socket.emit("messagesSeen", {
          receiverId: chatUser._id,
        });
      }
    };
    // USER TYPING
    const handleUserTyping = ({ senderId }) => {
      if (senderId === chatUser._id) {
        setIsTyping(true);
      }
    };
    // USER STOP TYPING
    const handleUserStopTyping = ({ senderId }) => {
      if (senderId === chatUser._id) {
        setIsTyping(false);
      }
    };
    // MESSAGE SEEN
    const handleMessagesSeen = ({ seenBy }) => {
      if (seenBy !== chatUser._id) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === user._id
            ? {
                ...msg,
                seen: true,
              }
            : msg
        )
      );
    };
    // MESSAGE DELETED FOR EVERYONE
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                isDeleted: true,
                text: "",
              }
            : msg
        )
      );
    };
    // REGISTER EVENTS
    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("messagesSeenUpdate", handleMessagesSeen);
    socket.on("messageDeleted", handleMessageDeleted);
    // CLEANUP
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messagesSeenUpdate", handleMessagesSeen);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, chatUser?._id, user?._id]);
  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);
  // RESET TYPING WHEN CHAT CHANGES
  useEffect(() => {
    setIsTyping(false);

    clearTimeout(typingTimeoutRef.current);
  }, [chatUser?._id]);
  // SEND MESSAGE
  const handleSend = async () => {
    if (!text.trim() || !chatUser) return;

    try {
      const messageText = text.trim();

      const res = await sendMessage({
        receiverId: chatUser._id,
        text: messageText,
      });

      if (res.status) {
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (msg) => msg._id === res.message._id
          );

          if (alreadyExists) {
            return prev;
          }

          return [...prev, res.message];
        });

        setText("");

        socket?.emit("stopTyping", {
          receiverId: chatUser._id,
        });

        clearTimeout(typingTimeoutRef.current);

        onMessageSent?.(res.message);
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };
  // INPUT CHANGE / TYPING
  const handleInputChange = (e) => {
    const value = e.target.value;

    setText(value);

    if (!socket || !chatUser) return;

    if (!value.trim()) {
      socket.emit("stopTyping", {
        receiverId: chatUser._id,
      });

      clearTimeout(typingTimeoutRef.current);

      return;
    }

    socket.emit("typing", {
      receiverId: chatUser._id,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiverId: chatUser._id,
      });
    }, 1500);
  };
  // DELETE FOR ME
  const handleDeleteForMe = async (messageId) => {
    try {
      const res = await deleteMessageForMe(messageId);

      console.log("Delete for me response:", res);

      if (res.status) {
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== messageId)
        );
      }
    } catch (err) {
      console.error("Delete for me error:", err);
    }

    setOpenMenuId(null);
  };
  // DELETE FOR EVERYONE
  const handleDeleteForEveryone = async (messageId) => {
    try {
      const res = await deleteMessageForEveryone(messageId);

      if (res.status) {
        setMessages((prev) =>
          prev.map((msg) =>
            String(msg._id) === String(messageId)
              ? {
                  ...msg,
                  isDeleted: true,
                  text: "",
                }
              : msg
          )
        );

        socket?.emit("messageDeleted", {
          messageId,
          receiverId: chatUser._id,
        });

        onMessageSent?.();
      }
    } catch (err) {
      console.error(err);
    }

    setOpenMenuId(null);
  };
  // EMPTY CHAT
  if (!chatUser) {
    return (
      <div className="empty-chat d-flex flex-column justify-content-center">
        <div className="chat-logo"></div>
        <h2>Choose a conversation to continue</h2>
      </div>
    );
  }
  // UI
  return (
    <div className="chat-window">
      <div className="chat-header">
        <img
          src={chatUser.profilePic || Nopfp}
          alt=""
          height={40}
          className="profile-image"
        />

        <div className="chat-user-info w-100 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="username p-0 m-0">{chatUser.name}</h4>
            <p className="online-indicator p-0 m-0">
              {isTyping ? (
                "typing..."
              ) : onlineUsers.includes(chatUser._id) ? (
                <span style={{ color: "#16a808" }}>Online</span>
              ) : (
                "Offline"
              )}
            </p>
          </div>

          <div className="chat-actions d-flex gap-4 align-items-center">
            <div className="callIcon">
              <Phone color="#7758f9" />
            </div>
            <div className="videoCallIcon">
              <Video color="#7758f9" />
            </div>
            <div className="info">
              <Info color="#7758f9" />
            </div>
          </div>
        </div>
      </div>

      <div className="chat-body">
        {messages.map((msg, index) => {
          const isMine = msg.senderId === user._id;

          // Find last message sent by me
          const isLastMineMessage =
            isMine &&
            index ===
              messages
                .map((m) => m.senderId === user._id)
                .lastIndexOf(true);

          if (isMine) {
            return (
              <div key={msg._id} className="sent-message-wrapper">
                <div className="sent">
                  {msg.isDeleted ? (
                    <span className="deleted-msg">
                      🚫 This message was deleted
                    </span>
                  ) : (
                    msg.text
                  )}

                  {/* Seen / Delivered */}
                  {isLastMineMessage && !msg.isDeleted && (
                    <span
                      className={`seen-status ${
                        msg.seen ? "seen" : "delivered"
                      }`}
                    >
                      <CheckCheck size={15} />
                    </span>
                  )}
                </div>

                {/* Menu */}
                {!msg.isDeleted && (
                  <div className="sent-menu-wrapper">
                    <button
                      className="sent-menu-btn"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === msg._id ? null : msg._id
                        )
                      }
                    >
                      <Ellipsis size={14} />
                    </button>

                    {openMenuId === msg._id && (
                      <div className="sent-menu-dropdown">
                        <button
                          onClick={() =>
                            handleDeleteForEveryone(msg._id)
                          }
                        >
                          Delete for Everyone
                        </button>
                        <button
                          onClick={() => handleDeleteForMe(msg._id)}
                        >
                          Delete for Me
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={msg._id} className="received-message-wrapper">
              {/* Menu */}
              {!msg.isDeleted && (
                <div className="received-menu-wrapper">
                  <button
                    className="received-menu-btn"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === msg._id ? null : msg._id
                      )
                    }
                  >
                    <Ellipsis size={14} />
                  </button>

                  {openMenuId === msg._id && (
                    <div className="received-menu-dropdown">
                      <button
                        onClick={() => handleDeleteForMe(msg._id)}
                      >
                        Delete for Me
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="received">
                {msg.isDeleted ? (
                  <span className="deleted-msg">
                    🚫 This message was deleted
                  </span>
                ) : (
                  msg.text
                )}
              </div>
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
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