import requests from "../utils/axios";

export const getStatus = async () => requests.get("/status");

export const createStatus = async (formdata) =>
  requests.post("/status/create", formdata, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const markStatusAsSeen = async (statusId) => requests.post(`/status/${statusId}/view`);

export const deleteStatus = async (statusId) => requests.delete(`/status/${statusId}`);

export const likeStatus = async (statusId) => requests.post(`/status/${statusId}/like`);