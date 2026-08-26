// 

import React from 'react';
import './Navbar.css';
import {Inbox, CircleFadingPlus, Contact} from 'lucide-react';
import logo from '../../assets/logo.png';
import pfp from '../../assets/images.jpg';
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import defaultPic from '../../assets/default.jfif'

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  console.log('redux user',user)

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" width={70} height={50} />
      </div>

      <ul className="sidebar-list">
        <li><NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""}><Inbox /></NavLink></li>
        <li><NavLink to="/status" className={({ isActive }) => isActive ? "active-link" : ""}><CircleFadingPlus /></NavLink></li>
        <li><NavLink to="/contacts" className={({ isActive }) => isActive ? "active-link" : ""}><Contact /></NavLink></li>
      </ul>

      <div className="sidebar-footer">
        {user ? (
          <NavLink to="/user">
            <img src={user.profilePic || defaultPic } alt="Profile" className="profile-image rounded-5" height={45} />
          </NavLink>
        ) : (
          <NavLink to="/login" className="btn"> <span className="btn-text">Sign in</span> </NavLink>
        )}
      </div>
    </div>
  );
};

export default Navbar;
