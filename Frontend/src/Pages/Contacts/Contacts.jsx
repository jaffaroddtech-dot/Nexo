import React, { useState, useEffect } from 'react';
import "./Contacts.css";
import ContactsNotLogged from '../../Components/NotLoggedPages/ContactsNotLogged/ContactsNotLogged';
import { useSelector, useDispatch } from "react-redux";
import ContactSave from '../../Components/contSaveWindow/contactSave';
import { getContacts } from "../../../Apis/contact";
import { setContacts } from '../../features/contactSlice';
import ContactWindow from '../../Components/ContactWindow/ContactWindow';
import { toast } from "react-toastify";
import {ChevronLeft} from "lucide-react"
import defaultPic from "../../assets/default.jfif";

const Contacts = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const contacts = useSelector((state) => state.contacts);
  const [showModal, setShowModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [searchcontact, setSearchContact] = useState("");
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  if (!user) {
    return <ContactsNotLogged />;
  }

  // ✅ Refresh contacts after adding
  const handleAddSuccess = async () => {
    try {
      const res = await getContacts();
      if (res.status) {
        dispatch(setContacts(res.data));
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to refresh contacts");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getContacts();
        if (res.status) {
          dispatch(setContacts(res.data));
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error("Failed to fetch contacts");
      }
    };
    fetchData();
  }, [dispatch]);


  const filteredContacts = contacts.filter((contact) => {
    const name = (
      contact.savedName ||
      contact.contactUser?.name ||
      ""
    ).toLowerCase();

    const bio = (
      contact.contactUser?.bio ||
      ""
    ).toLowerCase();

    const query = searchcontact.toLowerCase().trim();

    return name.includes(query) || bio.includes(query);
  });

  return (
    <div className="contactsMain">
      {/* Left Side */}
      {(!isMobile || !selectedContactId) && (
        <div className='left-side'>
          <div className="p-4 border-bottom d-flex flex-column align-items-start">
            <h3 className="fw-bold mb-1">Contacts</h3>
            <small className='text-muted'>Choose a contact to start chatting</small>
            <div className="d-flex justify-content-between w-100 mt-2 gap-3">
              <input className="contacts-search" placeholder="Search contacts..." value={searchcontact} onChange={(e) => { setSearchContact(e.target.value) }} />
              <button
                className="addCtsBtn"
                title='Add new contact'
                onClick={() => setShowModal(true)}
              >
                +
              </button>
            </div>
            {showModal && (
              <ContactSave onClose={() => setShowModal(false)} onSuccess={handleAddSuccess} />
            )}
          </div>

          {/* Contacts List */}
          <div className="contacts-list">
            {filteredContacts.length === 0 ? (
              <div className="no-contacts text-center">
                <p className="text-muted">No saved contacts</p>
              </div>
            ) : (
              Object.entries(
                filteredContacts
                  .slice()
                  .sort((a, b) => {
                    const nameA = a.savedName || a.contactUser?.name || "";
                    const nameB = b.savedName || b.contactUser?.name || "";
                    return nameA.localeCompare(nameB);
                  })
                  .reduce((groups, contact) => {
                    const displayName = contact.savedName || contact.contactUser?.name || "";
                    if (!displayName) return groups;
                    const letter = displayName[0].toUpperCase();
                    if (!groups[letter]) groups[letter] = [];
                    groups[letter].push(contact);
                    return groups;
                  }, {})
              ).map(([letter, group]) => (
                <div key={letter} className="contact-group">
                  <h5 className="contact-letter">{letter}</h5>
                  {group.map(contact => (
                    <div
                      key={contact._id}
                      className={`contact-item ${selectedContactId === contact._id ? "active-contact" : ""}`}
                      onClick={() => setSelectedContactId(contact._id)}
                    >
                      <img
                        src={contact.contactUser?.profilePic || defaultPic}
                        alt="profile"
                        className="contact-avatar-sm"
                      />
                      <div className="contact-info d-flex flex-column align-items-start">
                        <h6 className="m-0">
                          {contact.savedName || contact.contactUser?.name || "Unknown"}
                        </h6>
                        <p className="bio">
                          {contact.contactUser?.bio || "No bio available"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>)}

      {/* Right Side */}
      {(!isMobile || selectedContactId) && (
        <div className='right-side'>
          {isMobile && selectedContactId && (
            < button className="mobile-back-btn" onClick={() => setSelectedContactId(null)}>
            <ChevronLeft/>
           </button>
          )}


      {selectedContactId ? (
        <ContactWindow contactId={selectedContactId} onDeleted={() => setSelectedContactId(null)} onBack={() => setSelectedContactId(null)} />
      ) : (
        <div className="empty-contact d-flex flex-column justify-content-center">
          <div className="contact-logo"></div>
          <h2>Select a contact to view details</h2>
        </div>
      )}
    </div>)
}
    </div >
  );
};

export default Contacts;
