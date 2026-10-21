import requests from "../utils/axios";

// ⚠️ Ye wahi path ho jo server mein mount hai:
// app.use("/api/chats", groupRoutes)  -> "/chats"
// app.use("/api/groups", groupRoutes) -> "/groups"
const BASE = "/chats";

// Group helpers
export const normalizeGroup = (group) => ({
  ...group,
  isGroup: true,
  name: group.chatName,
  profilePic: group.groupAvatar || "",
});

export const getMemberName = (group, userId, fallback = "Former member") => {
  const id = String(userId?._id || userId || "");
  return (
    group?.participants?.find((p) => String(p?._id) === id)?.name || fallback
  );
};

const PALETTE = [
  "#50e3c2",
  "#ffb86b",
  "#ff7a90",
  "#7cc4ff",
  "#c9a7ff",
  "#9be564",
  "#ffd166",
  "#f78fb3",
];

export const getSenderColor = (id = "") => {
  let hash = 0;
  for (const char of String(id)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
};

// GET /  -> { status, groups }
export const getGroups = async () => {
  const res = await requests.get(`${BASE}/`);
  return res;
};
export const getUserChats = getGroups; // purane naam ke liye

// POST /create-group  body: { chatName, participants }
export const createGroup = async (data) => {
  const res = await requests.post(`${BASE}/create-group`, data);
  return res;
};

// PUT /:chatId  body: { chatName }
export const updateGroup = async (chatId, data) => {
  const res = await requests.put(`${BASE}/${chatId}`, data);
  return res;
};

// PUT /:chatId/add  body: { userIds }
export const addGroupMembers = async (chatId, userIds) => {
  const res = await requests.put(`${BASE}/${chatId}/add`, { userIds });
  return res;
};

// PUT /:chatId/remove/:userId
export const removeGroupMember = async (chatId, userId) => {
  const res = await requests.put(`${BASE}/${chatId}/remove/${userId}`);
  return res;
};

// PUT /:chatId/leave
export const leaveGroup = async (chatId) => {
  const res = await requests.put(`${BASE}/${chatId}/leave`);
  return res;
};

// GET /:chatId/messages  -> { status, messages }
export const getGroupMessages = async (chatId) => {
  const res = await requests.get(`${BASE}/${chatId}/messages`);
  return res;
};

// POST /:chatId/messages  (FormData: text, caption, replyTo, duration, media)
export const sendGroupMessage = async (chatId, payload, onProgress) => {
  const res = await requests.post(
    `${BASE}/${chatId}/messages`,
    payload,
    onProgress ? { onUploadProgress: onProgress } : undefined
  );
  return res;
};


// PUT /:chatId/avatar  (FormData field: "avatar")
export const updateGroupAvatar = async (chatId, file) => {
  const fd = new FormData();
  fd.append("avatar", file);
  const res = await requests.put(`${BASE}/${chatId}/avatar`, fd);
  return res;
};