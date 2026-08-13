import React, { useState, useEffect } from 'react';
import "./Contacts.css";
import ContactsNotLogged from '../../Components/NotLoggedPages/ContactsNotLogged/ContactsNotLogged';
import getComments from "../../Dummy Api/dummyApi";
import NoPfp from "../../Assets/nopfp.jpg";
import { useSelector } from "react-redux";


import ContactWindow from '../../Components/ContactWindow/ContactWindow';

const Contacts = () => {
  const { user } = useSelector((state) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const handleAddSuccess = (newContact) => {
    setContacts([...contacts, newContact]);
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await getComments();
      setContacts(data);
    };

    fetchData();
  }, []);

  if (!user) {
    return (
      < ContactsNotLogged />
    );
  }

  return (
    <div className="contactsMain d-flex">
      {/* Left Side */}
      <div className='left-side'>
        <div className="p-4 border-bottom d-flex flex-column align-items-start">
          <h3 className="fw-bold mb-1">Contacts</h3>
          <small className='text-muted'>Choose a contact to start chatting</small>
          <div className="d-flex justify-content-between w-100 mt-2 gap-3">
            <input className="contacts-search" placeholder="Search contacts..." />
            <button className="addCtsBtn" title='Add new contact' onClick={() => setShowModal(true)}>+</button>
          </div>
        </div>

        <div className="contacts-list">
          {Object.entries(
            contacts
              .slice()
              .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName))
              .reduce((groups, contact) => {
                const letter = contact.user.fullName[0].toUpperCase();
                if (!groups[letter]) groups[letter] = [];
                groups[letter].push(contact);
                return groups;
              }, {})
          ).map(([letter, group]) => (
            <div key={letter} className="contact-group">
              <h5 className="contact-letter">{letter}</h5>
              {group.map(contact => (
                <div
                  key={contact.id}
                  className={`contact-item ${selectedContact?.id === contact.id ? "active-contact" : ""}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <img src={NoPfp} alt="profile" className="contact-avatar-sm" />
                  <div className="contact-info d-flex flex-column align-items-start">
                    <h6 className="m-0">{contact.user.fullName}</h6>
                    <p className="bio">{contact.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>


      </div>

      {/* Right Side */}
      <div className='right-side'>
        <ContactWindow contact={selectedContact} />
      </div>
    </div>
  )
}

export default Contacts;
