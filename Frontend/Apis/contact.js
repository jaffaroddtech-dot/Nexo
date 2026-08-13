import requests from "../utils/axios";


export const addContact = async (phoneNumber) => {
  const res = await requests.post("/contacts/addContacts", { phoneNumber });
  return res;
};