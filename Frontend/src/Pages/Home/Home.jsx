import React, { useEffect, useState } from "react";
import "./Home.css";
import HomeNot from "../../Components/NotLoggedPages/HomeNotLogged/HomeNot.jsx";
import { useSelector } from "react-redux";
import getComments from "../../Dummy Api/dummyApi";
import Nopfp from "../../Assets/nopfp.jpg";
import ChatWindow from "../../Components/Chatwindow/Chatwindow.jsx";
import time from "../../Helpers/Helper";
import { NavLink } from "react-router-dom";

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const [selected, setSelected] = useState("all");
  const [comments, setComments] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getComments();
      setComments(data);
    };

    fetchData();
  }, []);

  //---Guest interface
  if (!user) {
    return (
      <HomeNot/>
    );
  }

  //---LoggedIn interface
  return (
    <div className="Main">

      {/* Left Side */}
      <div className="messages-content">

        <div className="search mt-4">
          <input
            type="text"
            className="search__input"
            placeholder="Search"
          />
        </div>

        <div className="mt-3 d-flex align-items-center justify-content-around messages-header">

          <div
            className="radio-input"
            style={{
              "--translate": selected === "all" ? "0%" : "100%",
            }}
          >
            <label onClick={() => setSelected("all")}>
              <span className={selected === "all" ? "active" : ""}>
                All
              </span>
            </label>

            <label onClick={() => setSelected("unread")}>
              <span className={selected === "unread" ? "active" : ""}>
                Unread
              </span>
            </label>

            <div className="selection"></div>
          </div>

          <button className="new-button">
            New Message
          </button>

        </div>

        <div className="messages-list mt-3">
          {comments.map((message) => (
            <div
              key={message.id}
              className={`messages p-2 d-flex gap-3 ${selectedChat?.id === message.id ? "selected-chat" : ""}`}
              onClick={() => setSelectedChat(message)}
            >
              <div className="profilePictures">
                <img
                  src={Nopfp}
                  alt="Profile"
                  className="profile-image rounded-5"
                  height={45}
                />
              </div>

              <div className="message-content">
                <div className="message-header">
                  <h5 className="message-sender">
                    {message.user.fullName}
                  </h5>

                  <span className={`message-time ${selectedChat?.id === message.id ? "selected-chat" : ""}`}>
                    {time}
                  </span>
                </div>

                <p className={`message-text ${selectedChat?.id === message.id ? "selected-chat" : ""}`}>
                  {message.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div className="User-messages">
        <ChatWindow chat={selectedChat} />
      </div>

    </div>
  );
};

export default Home;
