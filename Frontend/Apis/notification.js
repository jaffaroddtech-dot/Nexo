import requests from "../utils/axios";

export const getNotifications = async () =>
    requests.get("/notification");

export const markNotificationRead = async (id) =>
    requests.patch(`/notification/${id}/read`);

export const markAllNotificationsRead = async () =>
    requests.patch("/notification/read-all");