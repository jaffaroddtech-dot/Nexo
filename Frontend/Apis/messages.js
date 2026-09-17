import requests from "../utils/axios";


export const sendMessage = async (data) => {
    const res = await requests.post("/messages/send", data);
    return res;
};
export const getMessages = async (id) => {
    const res = await requests.get(`/messages/${id}`);
    return res;
};
export const getConversation = async () => {
    const res = await requests.get("/messages/conversations");
    return res;
};
export const markAsSeen = async (otherUserId) => {
    const res = await requests.put(`/messages/seen/${otherUserId}`);
    return res;
};
export const deleteMessageForMe = async (messageId) => {
    const res = await requests.delete(`/messages/delete-for-me/${messageId}`);
    return res;
};
export const deleteMessageForEveryone = async (messageId) => {
  const res = await requests.delete(`/messages/delete-for-everyone/${messageId}`);
  return res;
};