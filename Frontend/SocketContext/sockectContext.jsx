import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
const SocketContext = createContext({ socket: null, onlineUsers: [] });
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { token, user } = useSelector((state) => state.auth);
  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io("http://localhost:5000", {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("getOnlineUsers", (users) => setOnlineUsers(users));

    return () => socket.disconnect();
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};