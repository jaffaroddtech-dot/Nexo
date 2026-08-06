import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './statusNotLogged.css'
const statusNotLogged = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState("all");
    return (
        <>
            <div className='not-logged-main-2'>
                <div className=" not-log-area-2">
                    <div className='logo-2'></div>
                    <div className='welcome-2'>
                        <h1>Your Status Updates</h1>
                        <span>Sign in to view status updates from your contacts and to share your own.</span>
                    </div>
                    <div className='button-2'>
                        <button className='nexo-btn-primary main-button-2' onClick={()=>{navigate('/login')}}>
                            Sign In to Get Started
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default statusNotLogged;