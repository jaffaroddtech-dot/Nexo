import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import { Inbox, CircleFadingPlus, Contact, User, Bell, CheckCheck } from 'lucide-react';
import logo from '../../assets/logo.png';
import { NavLink, useNavigate } from "react-router-dom";
import { useSocket } from '../../../SocketContext/sockectContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../../Apis/notification';
import { useSelector } from "react-redux";
import defaultPic from '../../assets/default.jfif';

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  // ---------- fetch ----------
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await getNotifications();
        if (res.status) setNotifications(res.notifications);
      } catch (error) {
        console.log(error);
      }
    };

    if (user) fetchNotifications();
    else setNotifications([]);
  }, [user]);

  // ---------- realtime ----------
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => {
        const filtered = prev.filter((n) => {
          if (n._id === notification._id) return false;
          // same sender ki purani unread message notification hata do
          if (
            notification.type === "message" &&
            n.type === "message" &&
            !n.isRead &&
            n.sender?._id === notification.sender?._id
          ) {
            return false;
          }
          return true;
        });
        return [notification, ...filtered];
      });
    };

    socket.on("newNotification", handleNewNotification);
    return () => socket.off("newNotification", handleNewNotification);
  }, [socket]);

  // ---------- bahar click par band ----------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------- time-ago har minute refresh ----------
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // ---------- actions ----------
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.log(error);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
      );
      try {
        await markNotificationRead(n._id);
      } catch (error) {
        console.log(error);
      }
    }

    setShowNotifications(false);

    if (n.type === "status_like" || n.type === "status_reply") {
      navigate("/status");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" width={70} height={50} />
      </div>

      <ul className="sidebar-list">
        <li><NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""}><Inbox /></NavLink></li>
        <li><NavLink to="/status" className={({ isActive }) => isActive ? "active-link" : ""}><CircleFadingPlus /></NavLink></li>
        <li><NavLink to="/contacts" className={({ isActive }) => isActive ? "active-link" : ""}><Contact /></NavLink></li>
      </ul>

      <div className="sidebar-footer">
        {user && (
          <div className="notification-wrapper" ref={notifRef}>
            <button
              type="button"
              className={`notification-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell size={24} />
              {unreadNotifications > 0 && (
                <span className="notification-badge">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-header">
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <button
                      type="button"
                      className="mark-read-btn"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck size={14} />
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notification-item ${!n.isRead ? "unread" : ""}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <img src={n.sender?.profilePic || defaultPic} alt="" />
                      <div className="notification-content">
                        <div className="notification-top">
                          <strong>{n.sender?.name}</strong>
                          <span className="notification-time">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p>{n.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-notifications">
                    <Bell size={28} />
                    <span>No notifications</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {user ? (
          <NavLink to="/user">
            <img
              src={user.profilePic || defaultPic}
              alt="Profile"
              className="profile-nav-image rounded-5"
              height={45}
            />
          </NavLink>
        ) : (
          <NavLink to="/login">
            <div className="no-user">
              <User size={22} />
            </div>
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default Navbar;