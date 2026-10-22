import requests from "../utils/axios";

export const deleteChat = async (userId) =>{
  const res = await requests.delete(`/delete/user/${userId}`);
  return res
}

export const deleteGroup = async (chatId) =>{
  const res = await requests.delete(`/delete/group/${chatId}`);
  return res
}  