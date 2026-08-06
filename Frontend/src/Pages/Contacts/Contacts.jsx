import React from 'react';
import { useSelector } from "react-redux";
import ContactsNotLogged from '../../Components/NotLoggedPages/ContactsNotLogged/ContactsNotLogged.jsx';

const Contacts = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) {
    return (
      <ContactsNotLogged/>
    );
  }
  return (
    <div className="Main">Contacts</div>
  )
}

export default Contacts