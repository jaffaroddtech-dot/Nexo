import requests from "../utils/axios";

export const updateProfile = async (id, data) => {
    const res = await requests.put(`/users/profile/${id}`, data);
  return res;
};


export const uploadProfilePic = async (id, formData) => {
  try {
    const res = await requests.post(`/users/updateProfile/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res; // backend se {status, url, message} aayega
  } catch (err) {
    return { status: false, message: "Upload failed", error: err.message };
  }
};