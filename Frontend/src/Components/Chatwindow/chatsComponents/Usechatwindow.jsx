import { useEffect, useState, useRef, useCallback } from "react";
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

import { MAX_FILE_SIZE, formatFileSize, getFileKind } from "./mediaUtils.js";

const useChatWindow = (chatUser, onMessageSent) => {
  const { user } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [openReactionId, setOpenReactionId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // MEDIA UPLOAD STATE
  const [attachment, setAttachment] = useState(null); // { file, kind, previewUrl, error }
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  // VOICE MESSAGE STATE
  const [voiceSending, setVoiceSending] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sendingRef = useRef(false); // blocks double send
  const previewUrlRef = useRef(null);

  // keep latest callback in a ref so handlers below stay stable (needed for React.memo)
  const onMessageSentRef = useRef(onMessageSent);
  onMessageSentRef.current = onMessageSent;

  const chatUserId = chatUser?._id;
  const chatUserIdRef = useRef(chatUserId);
  chatUserIdRef.current = chatUserId;

  // keep latest reply target for the voice handler
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

  // free the blob URL on unmount
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  // FETCH MESSAGES WHEN CHAT USER CHANGES
  useEffect(() => {
    if (!chatUser) {
      setMessages([]);
      return;
    }

    let cancelled = false; // ignore responses of a previous chat

    const fetchMessages = async () => {
      try {
        setMessages([]);
        setOpenMenuId(null);

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
            ? { ...msg, isDeleted: true, text: "", caption: "", media: null }
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
  // only when the LAST message changes (new message) or typing toggles,
  // not on reactions / deletes of older messages
  const lastMessageId = messages[messages.length - 1]?._id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId, isTyping]);

  // Images / videos finish loading AFTER the scroll above and push the list down.
  // Wired to the chat body's onLoadCapture / onLoadedMetadataCapture.
  const handleMediaLoad = useCallback(() => {
    const body = bottomRef.current?.parentElement;
    if (!body) return;
    const distanceFromBottom = body.scrollHeight - body.scrollTop - body.clientHeight;
    // only follow if the user is already near the bottom (don't yank them while reading history)
    if (distanceFromBottom < 500) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  // RESET WHEN CHAT CHANGES
  // reply / draft / popups / pending attachment must not leak into the next chat
  useEffect(() => {
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
    setReplyMessage(null);
    setText("");
    setOpenReactionId(null);
    setOpenMenuId(null);
    clearAttachment();
  }, [chatUser?._id, clearAttachment]);

  // SEND TEXT MESSAGE
  const handleSend = async () => {
    if (!text.trim() || !chatUser || sendingRef.current) return;

    sendingRef.current = true;
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
    } finally {
      sendingRef.current = false;
    }
  };

  // SEND MEDIA MESSAGE (image / video / document + optional caption)
  const handleSendMedia = async () => {
    if (!attachment || attachment.error || !chatUser || sendingRef.current) return;

    const targetId = chatUser._id;

    sendingRef.current = true;
    setUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("receiverId", targetId);
      formData.append("media", attachment.file); // field name must match upload.single("media")
      if (caption.trim()) formData.append("caption", caption.trim());
      if (replyMessage?._id) formData.append("replyTo", replyMessage._id);

      const res = await sendMessage(formData, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      });

      if (res.status) {
        // user may have switched chats while uploading
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

  // SEND VOICE MESSAGE (called automatically when recording stops)
  const handleSendVoice = useCallback(async (file, duration) => {
    const targetId = chatUserIdRef.current;
    if (!targetId || !file) return;

    setVoiceSending(true);
    try {
      const formData = new FormData();
      formData.append("receiverId", targetId);
      formData.append("media", file); // same field name as upload.single("media")
      formData.append("duration", String(duration));
      if (replyMessageRef.current?._id) {
        formData.append("replyTo", replyMessageRef.current._id);
      }

      const res = await sendMessage(formData);

      if (res.status) {
        // user may have switched chats while uploading
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
                ? { ...msg, isDeleted: true, text: "", caption: "", media: null }
                : msg
            )
          );

          socket?.emit("messageDeleted", {
            messageId,
            receiverId: chatUserId,
          });

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

          socket?.emit("messageReaction", {
            receiverId: chatUserId,
            messageId: msg._id,
            reactions: res.message.reactions,
          });
        }

        setOpenReactionId(null);
      } catch (err) {
        console.log(err);
      }
    },
    [socket, chatUserId]
  );

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