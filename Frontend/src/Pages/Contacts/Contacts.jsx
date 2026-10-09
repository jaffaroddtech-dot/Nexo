import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./Contacts.css";
import ContactsNotLogged from "../../Components/NotLoggedPages/ContactsNotLogged/ContactsNotLogged";
import { useSelector, useDispatch } from "react-redux";
import ContactSave from "../../Components/contSaveWindow/contactSave";
import { getContacts } from "../../../Apis/contact";
import { setContacts } from "../../features/contactSlice";
import ContactWindow from "../../Components/ContactWindow/ContactWindow";
import { toast } from "react-toastify";
import { Search, UserPlus, Users } from "lucide-react";
import defaultPic from "../../assets/default.jfif";

const getName = (c) => c.savedName || c.contactUser?.name || "";

const Contacts = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const contacts = useSelector((state) => state.contacts);
  const [showModal, setShowModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [searchcontact, setSearchContact] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchContacts = useCallback(
    async (failMsg = "Failed to fetch contacts") => {
      try {
        const res = await getContacts();
        if (res.status) {
          dispatch(setContacts(res.data));
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error(failMsg);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!user) return;
    fetchContacts();
  }, [user, fetchContacts]);

  // search + A-Z sort + letter ke hisaab se groups
  const groups = useMemo(() => {
    const query = searchcontact.toLowerCase().trim();

    const list = contacts
      .filter((c) => {
        const name = getName(c).toLowerCase();
        const bio = (c.contactUser?.bio || "").toLowerCase();
        return name && (name.includes(query) || bio.includes(query));
      })
      .sort((a, b) => getName(a).localeCompare(getName(b)));

    const map = {};
    list.forEach((c) => {
      const first = getName(c)[0].toUpperCase();
      const letter = /\p{L}/u.test(first) ? first : "#";
      (map[letter] = map[letter] || []).push(c);
    });

    return Object.entries(map);
  }, [contacts, searchcontact]);

  if (!user) {
    return <ContactsNotLogged />;
  }

  return (
    <div className="ct-main">
      {/* LEFT: LIST */}
      {(!isMobile || !selectedContactId) && (
        <div className="ct-left">
          <div className="ct-header">
            <div className="ct-title-row">
              <div>
                <h3 className="ct-title">Contacts</h3>
                <span className="ct-count">{contacts.length} saved</span>
              </div>
              <button
                type="button"
                className="ct-add"
                title="Add new contact"
                onClick={() => setShowModal(true)}
              >
                <UserPlus size={15} />
                <span>Add</span>
              </button>
            </div>

            <div className="ct-search">
              <Search size={16} />
              <input
                placeholder="Search contacts..."
                value={searchcontact}
                onChange={(e) => setSearchContact(e.target.value)}
              />
            </div>
          </div>

          {showModal && (
            <ContactSave
              onClose={() => setShowModal(false)}
              onSuccess={() => fetchContacts("Failed to refresh contacts")}
            />
          )}

          <div className="ct-list">
            {groups.length === 0 ? (
              <div className="ct-empty">
                <Users size={34} />
                <p>{searchcontact ? "Nothing found" : "No contacts saved yet"}</p>
              </div>
            ) : (
              groups.map(([letter, group]) => (
                <div key={letter} className="ct-group">
                  <h5 className="ct-letter">{letter}</h5>

                  {group.map((contact) => (
                    <div
                      key={contact._id}
                      role="button"
                      tabIndex={0}
                      className={`ct-item ${selectedContactId === contact._id ? "is-active" : ""}`}
                      onClick={() => setSelectedContactId(contact._id)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedContactId(contact._id)}
                    >
                      <img
                        src={contact.contactUser?.profilePic || defaultPic}
                        alt=""
                        className="ct-avatar"
                      />
                      <div className="ct-info">
                        <h6 className="ct-name">{getName(contact) || "Unknown"}</h6>
                        <p className="ct-bio">{contact.contactUser?.bio || "No bio available"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RIGHT: DETAILS */}
      {(!isMobile || selectedContactId) && (
        <div className="ct-right">
          <ContactWindow
            contactId={selectedContactId}
            onDeleted={() => setSelectedContactId(null)}
            onBack={isMobile ? () => setSelectedContactId(null) : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default Contacts;