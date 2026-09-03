// import React, { useState, useEffect } from 'react';
// import "./Contacts.css";
// import ContactsNotLogged from '../../Components/NotLoggedPages/ContactsNotLogged/ContactsNotLogged';
// import NoPfp from "../../Assets/nopfp.jpg";
// import { useSelector } from "react-redux";
// import ContactSave from '../../Components/contSaveWindow/contactSave';
// import { getContacts } from "../../../Apis/contact";
// import { setContacts } from '../../features/contactSlice';
// import ContactWindow from '../../Components/ContactWindow/ContactWindow';
// import { toast } from "react-toastify";
// import { useDispatch } from 'react-redux';
// import defaultPic from "../../assets/default.jfif"


// const Contacts = () => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const contacts = useSelector((state) => state.contacts)
//   const [showModal, setShowModal] = useState(false);
//   const [selectedContact, setSelectedContact] = useState(null);


//   if (!user) {
//     return <ContactsNotLogged />;
//   }
//   // ✅ Add new contact safely
//   const handleAddSuccess = async (newContact) => {
//     try {
//       // fetch populated contact from backend (fresh copy)
//       const res = await getContacts();
//       if (res.status) {
//         dispatch(setContacts(res.data));
//       } else {
//         toast.error(res.message);
//       }
//     } catch (err) {
//       toast.error("Failed to refresh contacts");
//     }
//   };
  

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await getContacts();
//         console.log('contact reponses', res)
//         if (res.status) {
//           dispatch(setContacts(res.data));
//         } else {
//           toast.error(res.message);
//         }
//       } catch (err) {
//         toast.error("Failed to fetch contacts");
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className="contactsMain d-flex">
//       {/* Left Side */}
//       <div className='left-side'>
//         <div className="p-4 border-bottom d-flex flex-column align-items-start">
//           <h3 className="fw-bold mb-1">Contacts</h3>
//           <small className='text-muted'>Choose a contact to start chatting</small>
//           <div className="d-flex justify-content-between w-100 mt-2 gap-3">
//             <input className="contacts-search" placeholder="Search contacts..." />
//             <button
//               className="addCtsBtn"
//               title='Add new contact'
//               onClick={() => setShowModal(true)}
//             >
//               +
//             </button>
//           </div>
//           {showModal && (
//             <ContactSave
//               onClose={() => setShowModal(false)}
//             />
//           )}
//         </div>

//         {/* Contacts List */}
//         {/* Contacts List */}
// <div className="contacts-list">
//   {contacts.length === 0 ? (
//     <div className="no-contacts text-center">
//       <p className="text-muted">No saved contacts</p>
//     </div>
//   ) : (
//     Object.entries(
//       contacts
//         .slice()
//         .sort((a, b) => {
//           const nameA = a.savedName || a.contactUser?.name || "";
//           const nameB = b.savedName || b.contactUser?.name || "";
//           return nameA.localeCompare(nameB);
//         })
//         .reduce((groups, contact) => {
//           const displayName = contact.savedName || contact.contactUser?.name || "";
//           if (!displayName) return groups; // skip incomplete
//           const letter = displayName[0].toUpperCase();
//           if (!groups[letter]) groups[letter] = [];
//           groups[letter].push(contact);
//           return groups;
//         }, {})
//     ).map(([letter, group]) => (
//       <div key={letter} className="contact-group">
//         <h5 className="contact-letter">{letter}</h5>
//         {group.map(contact => (
//           <div
//             key={contact._id}
//             className={`contact-item ${selectedContact?._id === contact._id ? "active-contact" : ""}`}
//             onClick={() => setSelectedContact(contact)}
//           >
//             <img src={contact.contactUser.profilePic || defaultPic} alt="profile" className="contact-avatar-sm" />
//             <div className="contact-info d-flex flex-column align-items-start">
//               <h6 className="m-0">
//                 {contact.savedName || contact.contactUser?.name || "Unknown"}
//               </h6>
//               <p className="bio">
//                 {contact.contactUser?.bio || "No bio available"}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     ))
//   )}
// </div>

//       </div>

//       {/* Right Side */}
//       <div className='right-side'>
//         {selectedContact ? (
//           <ContactWindow contact={selectedContact} onDeleted={() => setSelectedContact(null)} />
//         ) : (
//           <div className="empty-contact d-flex flex-column justify-content-center">
//             <div>
//               <div className="contact-logo"></div>
//               <h2>Select a contact to view details</h2>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Contacts;



import React, { useState, useEffect } from 'react';
import "./Contacts.css";
import ContactsNotLogged from '../../Components/NotLoggedPages/ContactsNotLogged/ContactsNotLogged';
import { useSelector, useDispatch } from "react-redux";
import ContactSave from '../../Components/contSaveWindow/contactSave';
import { getContacts } from "../../../Apis/contact";
import { setContacts } from '../../features/contactSlice';
import ContactWindow from '../../Components/ContactWindow/ContactWindow';
import { toast } from "react-toastify";
import defaultPic from "../../assets/default.jfif";

const Contacts = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const contacts = useSelector((state) => state.contacts);
  const [showModal, setShowModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);

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

  return (
    <div className="contactsMain d-flex">
      {/* Left Side */}
      <div className='left-side'>
        <div className="p-4 border-bottom d-flex flex-column align-items-start">
          <h3 className="fw-bold mb-1">Contacts</h3>
          <small className='text-muted'>Choose a contact to start chatting</small>
          <div className="d-flex justify-content-between w-100 mt-2 gap-3">
            <input className="contacts-search" placeholder="Search contacts..." />
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
          {contacts.length === 0 ? (
            <div className="no-contacts text-center">
              <p className="text-muted">No saved contacts</p>
            </div>
          ) : (
            Object.entries(
              contacts
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
                    <img src={contact.contactUser.profilePic || defaultPic} alt="profile" className="contact-avatar-sm" />
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
      </div>

      {/* Right Side */}
      <div className='right-side'>
        {selectedContactId ? (
          <ContactWindow contactId={selectedContactId} onDeleted={() => setSelectedContactId(null)} />
        ) : (
          <div className="empty-contact d-flex flex-column justify-content-center">
            <h2>Select a contact to view details</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;
