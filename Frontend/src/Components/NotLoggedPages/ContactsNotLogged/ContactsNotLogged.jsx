import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ContactsNotLogged.css'
const ContactsNotLogged = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState("all");
    return (
        <>
            <div className='not-logged-main-3'>
                <div className=" not-log-area-3">
                    <div className='logo-3'></div>
                    <div className='welcome-3'>
                        <h1>Access Your Contacts</h1>
                        <span>Sign in to view your full contact list, manage groups, and start connecting.</span>
                    </div>
                    <div className='button-3'>
                        <button className='nexo-btn-primary main-button-3' onClick={()=>{navigate('/login')}}>
                            Sign In to Get Started
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ContactsNotLogged;