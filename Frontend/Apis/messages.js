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