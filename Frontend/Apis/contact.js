import requests from "../utils/axios";


export const addContact = async (data) => {
  const res = await requests.post("/contacts/addContacts", data);
  return res;
};

export const deleteContact = async (id) => {
  const res = await requests.delete(`/contacts/deleteContact/${id}`);
  return res
};

export const getContacts = async () => {
  const res = await requests.get("/contacts/getContacts");
  return res; // sirf data return karo
};

export const updateContact = async (id, data) => {
  const res = await requests.put(`/contacts/updateContact/${id}`, data);
  return res;
};