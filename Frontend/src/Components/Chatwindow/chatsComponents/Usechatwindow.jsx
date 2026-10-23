import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "../../../../SocketContext/sockectContext";

import {
  getMessages,
  sendMessage,
  markAsSeen,
  deleteMessageForMe,
  deleteMessageForEveryone,
  reactToMessage,
  pinMessage, 
  unpinMessage, 
} from "../../../../Apis/messages";
import {
  getGroupMessages,
  sendGroupMessage,
  getMemberName,
} from "../../../../Apis/group.js";

import { MAX_FILE_SIZE, formatFileSize, getFileKind } from "./mediaUtils.js";
import { isPinned } from "./pinUtils.js"; 

// 1-1 ya group, sahi API par bhej do
const sendTo = (target, payload, onProgress) =>
  target.isGroup
    ? sendGroupMessage(target._id, payload, onProgress)
    : sendMessage(payload, onProgress);

// NEW: message list mein ek message ke pin fields update karo
const withPin = (list, { messageId, pinnedBy, pinnedAt, pinnedUntil }) =>
  list.map((m) =>
    String(m._id) === String(messageId)
      ? { ...m, pinnedBy, pinnedAt, pinnedUntil }
      : m
  );

const useChatWindow = (chatUser, onMessageSent) => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false); // 1-1
  const [typingIds, setTypingIds] = useState([]); // group
  const [openReactionId, setOpenReactionId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // MEDIA UPLOAD STATE
  const [attachment, setAttachment] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  // VOICE MESSAGE STATE
  const [voiceSending, setVoiceSending] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sendingRef = useRef(false);
  const previewUrlRef = useRef(null);

  const onMessageSentRef = useRef(onMessageSent);
  onMessageSentRef.current = onMessageSent;

  const chatUserRef = useRef(chatUser);
  chatUserRef.current = chatUser;

  const chatUserId = chatUser?._id;
  const chatUserIdRef = useRef(chatUserId);
  chatUserIdRef.current = chatUserId;

  const isGroup = Boolean(chatUser?.isGroup);

  const replyMessageRef = useRef(replyMessage);
  replyMessageRef.current = replyMessage;

  // ---------- MEDIA: select / clear ----------
  const clearAttachment = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setAttachment(null);
    setCaption("");
    setUploadProgress(0);
    setUploadError("");
  }, []);

  const selectFile = useCallback((file) => {
    if (!file) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const kind = getFileKind(file);
    let previewUrl = null;
    if (kind === "image" || kind === "video") {
      previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
    }

    setAttachment({
      file,
      kind,
      previewUrl,
      error:
        file.size > MAX_FILE_SIZE
          ? `File is too large (${formatFileSize(file.size)}). Max is ${formatFileSize(MAX_FILE_SIZE)}.`
          : "",
    });
    setCaption("");
    setUploadProgress(0);
    setUploadError("");
  }, []);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  // FETCH MESSAGES WHEN CHAT CHANGES
  useEffect(() => {
    if (!chatUser) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const fetchMessages = async () => {
      try {
        setMessages([]);
        setOpenMenuId(null);

        if (chatUser.isGroup) {
          const res = await getGroupMessages(chatUser._id);
          if (cancelled) return;
          if (res.status) setMessages(res.messages);
          socket?.emit("groupMessagesSeen", { chatId: chatUser._id });
          return;
        }

        const res = await getMessages(chatUser._id);
        if (cancelled) return;
        if (res.status) setMessages(res.messages);

        await markAsSeen(chatUser._id);
        if (cancelled) return;
        socket?.emit("messagesSeen", { receiverId: chatUser._id });
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [chatUser?._id, socket]);

  // SOCKET EVENTS
  useEffect(() => {
    if (!socket || !chatUser || !user) return;

    /* ---------------- GROUP ---------------- */
    if (chatUser.isGroup) {
      const chatId = String(chatUser._id);
      const me = String(user._id);

      const onNew = (message) => {
        if (String(message.chatId) !== chatId) return;
        setMessages((prev) =>
          prev.some((m) => m._id === message._id) ? prev : [...prev, message]
        );
        setTypingIds((prev) => prev.filter((id) => String(id) !== String(message.senderId)));
        if (String(message.senderId) !== me) {
          socket.emit("groupMessagesSeen", { chatId });
        }
      };

      const onTyping = ({ chatId: id, senderId }) => {
        if (String(id) !== chatId) return;
        setTypingIds((prev) => (prev.includes(senderId) ? prev : [...prev, senderId]));
      };

      const onStopTyping = ({ chatId: id, senderId }) => {
        if (String(id) !== chatId) return;
        setTypingIds((prev) => prev.filter((x) => x !== senderId));
      };

      const onSeen = ({ chatId: id, seenBy }) => {
        if (String(id) !== chatId) return;
        setMessages((prev) =>
          prev.map((m) =>
            String(m.senderId) === me &&
              !(m.readBy || []).some((r) => String(r) === String(seenBy))
              ? { ...m, readBy: [...(m.readBy || []), seenBy] }
              : m
          )
        );
      };

      const onDeleted = ({ chatId: id, messageId }) => {
        if (String(id) !== chatId) return;
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(messageId)
              ? {
                ...m,
                isDeleted: true,
                text: "",
                caption: "",
                media: null,
                pinnedUntil: null, 
              }
              : m
          )
        );
      };

      const onReaction = ({ chatId: id, messageId, reactions }) => {
        if (String(id) !== chatId) return;
        setMessages((prev) =>
          prev.map((m) => (String(m._id) === String(messageId) ? { ...m, reactions } : m))
        );
      };

      // NEW: pin / unpin update
      const onPin = (p) => {
        if (String(p.chatId) !== chatId) return;
        setMessages((prev) => withPin(prev, p));
      };

      const onSystem = (msg) => {
        if (String(msg.chatId) !== String(chatUser?._id)) return;
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      };

      socket.on("groupSystemMessage", onSystem);
      socket.on("newGroupMessage", onNew);
      socket.on("groupTyping", onTyping);
      socket.on("groupStopTyping", onStopTyping);
      socket.on("groupSeenUpdate", onSeen);
      socket.on("groupMessageDeleted", onDeleted);
      socket.on("groupMessageReactionUpdate", onReaction);
      socket.on("messagePinUpdate", onPin); 

      return () => {
        socket.off("newGroupMessage", onNew);
        socket.off("groupTyping", onTyping);
        socket.off("groupStopTyping", onStopTyping);
        socket.off("groupSeenUpdate", onSeen);
        socket.off("groupMessageDeleted", onDeleted);
        socket.off("groupMessageReactionUpdate", onReaction);
        socket.off("groupSystemMessage", onSystem);
        socket.off("messagePinUpdate", onPin); 
      };
    }

    /* ---------------- 1-1 ---------------- */
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
          msg._id === messageId
            ? {
              ...msg,
              isDeleted: true,
              text: "",
              caption: "",
              media: null,
              pinnedUntil: null, 
            }
            : msg
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

    // NEW: pin / unpin update
    const handlePinUpdate = (p) => {
      setMessages((prev) => withPin(prev, p));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("messagesSeenUpdate", handleMessagesSeen);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReactionUpdate", handleReactionUpdate);
    socket.on("messagePinUpdate", handlePinUpdate); 

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messagesSeenUpdate", handleMessagesSeen);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReactionUpdate", handleReactionUpdate);
      socket.off("messagePinUpdate", handlePinUpdate); 
    };
  }, [socket, chatUser?._id, chatUser?.isGroup, user?._id]);

  // typing: dm ya group
  const typing = isGroup ? typingIds.length > 0 : isTyping;

  const typingLabel = useMemo(() => {
    if (!isGroup || !typingIds.length) return "";
    const names = typingIds.map((id) => getMemberName(chatUser, id, "Someone"));
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return "Several people are typing...";
  }, [isGroup, typingIds, chatUser]);

  const meId = user?._id;
  const memberCount = chatUser?.participants?.length || 0;
  const displayMessages = useMemo(() => {
    if (!isGroup) return messages;
    const others = Math.max(1, memberCount - 1);
    return messages.map((m) => {
      if (String(m.senderId) !== String(meId)) return m;
      const readers = (m.readBy || []).filter((id) => String(id) !== String(meId)).length;
      const seen = readers >= others;
      return m.seen === seen ? m : { ...m, seen };
    });
  }, [messages, isGroup, memberCount, meId]);

  // AUTO SCROLL
  const lastMessageId = messages[messages.length - 1]?._id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId, typing]);

  const handleMediaLoad = useCallback(() => {
    const body = bottomRef.current?.parentElement;
    if (!body) return;
    const distanceFromBottom = body.scrollHeight - body.scrollTop - body.clientHeight;
    if (distanceFromBottom < 500) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  // RESET WHEN CHAT CHANGES
  useEffect(() => {
    setIsTyping(false);
    setTypingIds([]);
    clearTimeout(typingTimeoutRef.current);
    setReplyMessage(null);
    setText("");
    setOpenReactionId(null);
    setOpenMenuId(null);
    clearAttachment();
  }, [chatUser?._id, clearAttachment]);

  // typing event (dm / group)
  const emitTyping = (kind) => {
    if (!socket || !chatUser) return;
    if (chatUser.isGroup) {
      socket.emit(kind === "typing" ? "groupTyping" : "groupStopTyping", {
        chatId: chatUser._id,
      });
    } else {
      socket.emit(kind, { receiverId: chatUser._id });
    }
  };

  // SEND TEXT MESSAGE
  const handleSend = async () => {
    if (!text.trim() || !chatUser || sendingRef.current) return;

    sendingRef.current = true;
    try {
      const payload = chatUser.isGroup
        ? { text: text.trim(), replyTo: replyMessage?._id || null }
        : { receiverId: chatUser._id, text: text.trim(), replyTo: replyMessage?._id || null };

      const res = await sendTo(chatUser, payload);

      if (res.status) {
        setMessages((prev) =>
          prev.some((msg) => msg._id === res.message._id)
            ? prev
            : [...prev, res.message]
        );

        setText("");
        setReplyMessage(null);

        emitTyping("stopTyping");
        clearTimeout(typingTimeoutRef.current);

        onMessageSent?.(res.message);
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      sendingRef.current = false;
    }
  };

  // SEND MEDIA MESSAGE
  const handleSendMedia = async () => {
    if (!attachment || attachment.error || !chatUser || sendingRef.current) return;

    const target = chatUser;
    const targetId = target._id;

    sendingRef.current = true;
    setUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const formData = new FormData();
      if (!target.isGroup) formData.append("receiverId", targetId);
      formData.append("media", attachment.file);
      if (caption.trim()) formData.append("caption", caption.trim());
      if (replyMessage?._id) formData.append("replyTo", replyMessage._id);

      const res = await sendTo(target, formData, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      });

      if (res.status) {
        if (chatUserIdRef.current === targetId) {
          setMessages((prev) =>
            prev.some((msg) => msg._id === res.message._id)
              ? prev
              : [...prev, res.message]
          );
          setReplyMessage(null);
        }

        clearAttachment();
        onMessageSentRef.current?.(res.message);
      } else {
        setUploadError(res.message || "Upload failed. Try again.");
      }
    } catch (err) {
      setUploadError(
        err?.response?.data?.message || err?.message || "Upload failed. Try again."
      );
    } finally {
      sendingRef.current = false;
      setUploading(false);
    }
  };

  // SEND VOICE MESSAGE
  const handleSendVoice = useCallback(async (file, duration) => {
    const target = chatUserRef.current;
    if (!target?._id || !file) return;
    const targetId = target._id;

    setVoiceSending(true);
    try {
      const formData = new FormData();
      if (!target.isGroup) formData.append("receiverId", targetId);
      formData.append("media", file);
      formData.append("duration", String(duration));
      if (replyMessageRef.current?._id) {
        formData.append("replyTo", replyMessageRef.current._id);
      }

      const res = await sendTo(target, formData);

      if (res.status) {
        if (chatUserIdRef.current === targetId) {
          setMessages((prev) =>
            prev.some((m) => m._id === res.message._id)
              ? prev
              : [...prev, res.message]
          );
          setReplyMessage(null);
        }
        onMessageSentRef.current?.(res.message);
      }
    } catch (err) {
      console.error("Send voice error:", err);
    } finally {
      setVoiceSending(false);
    }
  }, []);

  // INPUT CHANGE / TYPING
  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!socket || !chatUser) return;

    if (!value.trim()) {
      emitTyping("stopTyping");
      clearTimeout(typingTimeoutRef.current);
      return;
    }

    emitTyping("typing");

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping("stopTyping");
    }, 1500);
  };

  // DELETE FOR ME
  const handleDeleteForMe = useCallback(async (messageId) => {
    try {
      const res = await deleteMessageForMe(messageId);
      if (res.status) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    } catch (err) {
      console.error("Delete for me error:", err);
    }
    setOpenMenuId(null);
  }, []);

  // DELETE FOR EVERYONE
  const handleDeleteForEveryone = useCallback(
    async (messageId) => {
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
                  caption: "",
                  media: null,
                  pinnedUntil: null, 
                }
                : msg
            )
          );

          if (chatUserRef.current?.isGroup) {
            socket?.emit("groupMessageDeleted", { chatId: chatUserId, messageId });
          } else {
            socket?.emit("messageDeleted", { messageId, receiverId: chatUserId });
          }

          onMessageSentRef.current?.();
        }
      } catch (err) {
        console.error(err);
      }
      setOpenMenuId(null);
    },
    [socket, chatUserId]
  );

  // REACTION
  const handleReaction = useCallback(
    async (msg, emoji) => {
      try {
        const res = await reactToMessage(msg._id, emoji);

        if (res.status) {
          setMessages((prev) =>
            prev.map((m) => (m._id === msg._id ? res.message : m))
          );

          if (chatUserRef.current?.isGroup) {
            socket?.emit("groupMessageReaction", {
              chatId: chatUserId,
              messageId: msg._id,
              reactions: res.message.reactions,
            });
          } else {
            socket?.emit("messageReaction", {
              receiverId: chatUserId,
              messageId: msg._id,
              reactions: res.message.reactions,
            });
          }
        }

        setOpenReactionId(null);
      } catch (err) {
        console.log(err);
      }
    },
    [socket, chatUserId]
  );

  // ---------- NEW: PIN / UNPIN ----------
  const handlePin = useCallback(async (messageId, duration) => {
    try {
      const res = await pinMessage(messageId, duration);
      if (res.status) {
        setMessages((prev) =>
          withPin(prev, {
            messageId,
            pinnedBy: res.message.pinnedBy,
            pinnedAt: res.message.pinnedAt,
            pinnedUntil: res.message.pinnedUntil,
          })
        );
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } catch (err) {
      return {
        ok: false,
        message: err?.response?.data?.message || "Could not pin message",
      };
    }
  }, []);

  const handleUnpin = useCallback(async (messageId) => {
    try {
      const res = await unpinMessage(messageId);
      if (res.status) {
        setMessages((prev) =>
          withPin(prev, {
            messageId,
            pinnedBy: null,
            pinnedAt: null,
            pinnedUntil: null,
          })
        );
      }
    } catch (err) {
      console.error("Unpin error:", err);
    }
    setOpenMenuId(null);
  }, []);

  // banner ke liye: active pins, newest first
  const pinnedMessages = useMemo(
    () =>
      messages
        .filter(isPinned)
        .sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt)),
    [messages]
  );

  useEffect(() => {
    if (!chatUser?.isGroup) return;

    const onLocal = (e) => {
      const list = (e.detail || []).filter(
        (m) => String(m.chatId) === String(chatUser._id)
      );
      if (!list.length) return;
      setMessages((prev) => {
        const have = new Set(prev.map((m) => String(m._id)));
        const fresh = list.filter((m) => !have.has(String(m._id)));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
    };

    window.addEventListener("group-system-messages", onLocal);
    return () => window.removeEventListener("group-system-messages", onLocal);
  }, [chatUser?._id, chatUser?.isGroup]);

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
    messages: displayMessages,
    text,
    isTyping: typing,
    typingLabel,
    isGroup,
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
    // pin
    handlePin,
    handleUnpin,
    pinnedMessages,
    // media
    attachment,
    caption,
    setCaption,
    uploading,
    uploadProgress,
    uploadError,
    selectFile,
    clearAttachment,
    handleSendMedia,
    handleMediaLoad,
    // voice
    handleSendVoice,
    voiceSending,
  };
};

export default useChatWindow;