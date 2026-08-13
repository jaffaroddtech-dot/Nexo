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
    console.log(contact)
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
                    EW
                </div>

                {/* Header */}
                <div className="contact-header">
                    <h2>{contact.user.fullName}</h2>
                    <span>Online</span>
                </div>

                <div className="divider"></div>

                {/* Contact Details */}
                <div className="contact-body">

                    <div className="contact-top">

                        <div className="contact-info-2">

                            <div className="info-row">
                                <Mail size={18} />
                                <span>{`${contact.user.username}@gmail.com`}</span>
                            </div>

                            <div className="info-row">
                                <Phone size={18} />
                                <span>+1 123 456 7890</span>
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
                            <span>{contact.body}</span>
                        </div>

                        <div className="detail-row">
                            <MapPin size={18} />
                            <span>Dormont, PA</span>
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
