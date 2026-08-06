import React from "react";
import "./Chatwindow.css";
import Nopfp from "../../Assets/nopfp.jpg";
import { Phone, Video, Info,Type,
  Paperclip,
  Link2,
  Smile,
  Trash2,
  Send, } from "lucide-react";

const ChatWindow = ({ chat }) => {

    if (!chat) {

        return (
            <div className="empty-chat d-flex flex-column justify-content-center">


                <div className="chat-logo"></div>
                <h2>Select a conversation</h2>

            </div>
        );
    }

    return (

        <div className="chat-window">

            <div className="chat-header">

                <img src={Nopfp} alt="" height={40} className="rounded-circle" />
                <div className="chat-user-info w-100 d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="username p-0 m-0">{chat.user.fullName}</h4>
                        <p className="online-indicator p-0 m-0 ">Online</p>
                    </div>

                    <div className="chat-actions d-flex gap-4 align-items-center">
                        <div className="callIcon">
                            <Phone color="#7758f9" />
                        </div>
                        <div className="videoCallIcon">
                            <Video color="#7758f9" />
                        </div>
                        <div className='info'>
                            <Info color="#7758f9" />
                        </div>
                    </div>

                </div>

            </div>

            <div className="chat-body">

                <div className="received">
                    {chat.body}
                </div>

                <div className="sent">
                    Hi 👋
                </div>

                <div className="received">
                    How are you?
                </div>

            </div>

            
            <div className="message-box">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="message-input"
                />

                <div className="message-footer">
                    <div className="left-icons">
                        <Type size={18} />
                        <Paperclip size={18} />
                        <Link2 size={18} />
                        <Smile size={18} />
                        <Info size={18} />
                        <Trash2 size={18} />
                    </div>

                    <button className="send-btn">
                        <Send size={16} />
                        Send
                    </button>
                </div>
            </div>

        </div>

    );
};

export default ChatWindow;