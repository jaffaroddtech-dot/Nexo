import './App.css'
import Layout from "../Layout/Layout.jsx";
import Status from "../../Pages/Status/Status.jsx";
import Contacts from "../../Pages/Contacts/Contacts.jsx";
import Login from "../../Pages/Login/Login.jsx";
import UserPage from '../../Pages/User/UserPage.jsx';
import Signup from '../../Pages/Signup/Signup.jsx';
import Home from "../../Pages/Home/Home.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,

    children: [{
      path: "/",
      index: true,
      element: <Home />
    }
      , {
      path: "/status",
      element: <Status />
    }
      , {
      path: "/contacts",
      element: <Contacts />
    },
    {
      path: '/user',
      element : <UserPage/>
    }
  ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: '/Signup',
    element: <Signup />
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
};

export default App;
