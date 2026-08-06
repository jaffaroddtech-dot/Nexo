import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nopfp from '../../../assets/nopfp.jpg'
import './HomeNot.css'
const HomeNot = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState("all");
    return (
        <>
            <div className='not-logged-main'>
                <div className=" not-log-area">
                    <div className='logo'></div>
                    <div className='welcome'>
                        <h1>Welcome to <span>Nexo</span>!</h1>
                        <span>A secure space to connect, collaborate, and communicate seamlessly.</span>
                    </div>
                    <div className='button'>
                        <button className='nexo-btn-primary main-button' onClick={()=>{navigate('/login')}}>
                            Sign In to Get Started
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HomeNot;