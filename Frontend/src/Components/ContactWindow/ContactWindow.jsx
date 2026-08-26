import React from "react";
import "./ContactWindow.css";
import { Phone, MessageCircle } from "lucide-react";
import nopfp from "../../Assets/nopfp.jpg";

import {
    Mail,
    UserRound,
    MapPin,
} from "lucide-react";

const ContactWindow = ({ contact }) => {
    console.log("reponse",contact)
    if (!contact) {
        return (
            <div className="empty-contact d-flex flex-column justify-content-center">
                <div className="contact-logo"></div>
                <h2>Choose a conversation to continue</h2>
            </div>
        );
    }

    return (
        <div className="contact-page">

            <div className="contact-card">

                {/* Profile Image */}
                <div className="profile-avatar">
                    <img src={contact.contactUser.profilePic} className="profilepic"/>
                </div>

                {/* Header */}
                <div className="contact-header">
                    <h2>{contact.savedName}</h2>
                    <span>{contact.contactUser.online? "Online":"Offline"}</span>
                </div>

                <div className="divider"></div>

                {/* Contact Details */}
                <div className="contact-body">

                    <div className="contact-top">

                        <div className="contact-info-2">

                            <div className="info-row">
                                <Phone size={18} />
                                <span>{contact.contactUser.phoneNumber}</span>
                            </div>

                        </div>

                        {/* Action Icons */}
                        <div className="action-icons">
                            <Phone size={20} />
                            <MessageCircle size={20} />
                        </div>

                    </div>

                    {/* Contact Info */}
                    <div className="details">

                        <p className="details-title">
                            Contact Info
                        </p>

                        <div className="detail-row">
                            <UserRound size={18} />
                            <span>{contact.contactUser.bio}</span>
                        </div>

                        <div className="detail-row">
                            <MapPin size={18} />
                            <span>{contact.contactUser.country}</span>
                        </div>

                    </div>

                    {/* Button */}
                    <button className="sendd-btn">
                        Send Message
                    </button>

                </div>

            </div>

        </div>
    );
};

export default ContactWindow;
