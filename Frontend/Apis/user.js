import requests from "../utils/axios";

export const updateProfile = async (id, data) => {
    const res = await requests.put(`/users/profile/${id}`, data);
  return res;
};
