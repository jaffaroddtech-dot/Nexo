  import requests from "../utils/axios";


  export const addContact = async (data) => {
    const res = await requests.post("/contacts/addContacts", data);
    return res;
  };


  export const getContacts = async () => {
  const res = await requests.get("/contacts/getContacts");
  return res; // sirf data return karo
};