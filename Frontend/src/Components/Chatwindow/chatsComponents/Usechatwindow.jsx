import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "../../../../SocketContext/sockectContext";

import {
  getMessages,
  sendMessage,
  markAsSeen,
  deleteMessageForMe,
  deleteMessageForEveryone,
  reactToMessage,
} from "../../../../Apis/messages";

const useChatWindow = (chatUser, onMessageSent) => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [openReactionId, setOpenReactionId] = useState(null);
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
        if (res.status) setMessages(res.messages);

        await markAsSeen(chatUser._id);
        socket?.emit("messagesSeen", { receiverId: chatUser._id });
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();
  }, [chatUser?._id, socket]);

  // SOCKET EVENTS
  useEffect(() => {
    if (!socket || !chatUser || !user) return;

    const handleNewMessage = (message) => {
      const isRelevant =
        (message.senderId === chatUser._id && message.receiverId === user._id) ||
        (message.senderId === user._id && message.receiverId === chatUser._id);

      if (!isRelevant) return;

      setMessages((prev) =>
        prev.some((msg) => msg._id === message._id) ? prev : [...prev, message]
      );

      if (message.senderId === chatUser._id) {
        markAsSeen(chatUser._id);
        socket.emit("messagesSeen", { receiverId: chatUser._id });
      }
    };

    const handleUserTyping = ({ senderId }) => {
      if (String(senderId) === String(chatUser._id)) setIsTyping(true);
    };

    const handleUserStopTyping = ({ senderId }) => {
      if (String(senderId) === String(chatUser._id)) setIsTyping(false);
    };

    const handleMessagesSeen = ({ seenBy }) => {
      if (seenBy !== chatUser._id) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === user._id ? { ...msg, seen: true } : msg
        )
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isDeleted: true, text: "" } : msg
        )
      );
    };

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === String(messageId) ? { ...msg, reactions } : msg
        )
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("messagesSeenUpdate", handleMessagesSeen);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReactionUpdate", handleReactionUpdate);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messagesSeenUpdate", handleMessagesSeen);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReactionUpdate", handleReactionUpdate);
    };
  }, [socket, chatUser?._id, user?._id]);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const res = await sendMessage({
        receiverId: chatUser._id,
        text: text.trim(),
        replyTo: replyMessage?._id || null,
      });

      if (res.status) {
        setMessages((prev) =>
          prev.some((msg) => msg._id === res.message._id)
            ? prev
            : [...prev, res.message]
        );

        setText("");
        setReplyMessage(null);

        socket?.emit("stopTyping", { receiverId: chatUser._id });
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
      socket.emit("stopTyping", { receiverId: chatUser._id });
      clearTimeout(typingTimeoutRef.current);
      return;
    }

    socket.emit("typing", { receiverId: chatUser._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: chatUser._id });
    }, 1500);
  };

  // DELETE FOR ME
  const handleDeleteForMe = async (messageId) => {
    try {
      const res = await deleteMessageForMe(messageId);
      if (res.status) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
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
              ? { ...msg, isDeleted: true, text: "" }
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

  // REACTION
  const handleReaction = async (msg, emoji) => {
    try {
      const res = await reactToMessage(msg._id, emoji);

      if (res.status) {
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? res.message : m))
        );

        socket?.emit("messageReaction", {
          receiverId: chatUser._id,
          messageId: msg._id,
          reactions: res.message.reactions,
        });
      }

      setOpenReactionId(null);
    } catch (err) {
      console.log(err);
    }
  };

  // ONE POPUP AT A TIME
  useEffect(() => {
    if (openReactionId) setOpenMenuId(null);
  }, [openReactionId]);

  useEffect(() => {
    if (openMenuId) setOpenReactionId(null);
  }, [openMenuId]);

  // CLOSE POPUPS ON OUTSIDE TAP / ESC
  useEffect(() => {
    const close = () => {
      setOpenReactionId(null);
      setOpenMenuId(null);
    };
    const onPointerDown = (e) => {
      if (!e.target.closest(".sent-menu-wrapper, .received-menu-wrapper")) close();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return {
    user,
    onlineUsers,
    messages,
    text,
    isTyping,
    replyMessage,
    setReplyMessage,
    openReactionId,
    setOpenReactionId,
    openMenuId,
    setOpenMenuId,
    bottomRef,
    handleSend,
    handleInputChange,
    handleDeleteForMe,
    handleDeleteForEveryone,
    handleReaction,
  };
};

export default useChatWindow;