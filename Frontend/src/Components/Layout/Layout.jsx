import Navbar from "../Navbar/Navbar.jsx";
import { Outlet } from "react-router-dom";

// function Layout() {
//     return (
//         <div className="App">
//             <Navbar />
//             <main>
//                 <Outlet />
//             </main>
//         </div>
//     );
// }

function Layout() {
  return (
    <div className="App d-flex">
      <Navbar />
      <main style={{ marginLeft: "60px", width: "100%" }}>
        <Outlet />
      </main>
    </div>
  );
}


export default Layout;