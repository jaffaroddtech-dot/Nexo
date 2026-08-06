import React from 'react';
import './Status.css';
import { useSelector } from "react-redux";
import StatusNotLogged from '../../Components/NotLoggedPages/statusNotLogged/statusNotLogged.jsx';


const Status = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) {
    return (
      <StatusNotLogged />
    );
  }

  const statuses = [
  { id: 1, name: "Emma Wilson", time: "10m ago" },
  { id: 2, name: "Cameron Perez", time: "22m ago" },
];

  return (
    <div className="Main">
      <div className="container-fluid p-0 status-page">
        <div className="main-status">

          {/* Left Panel */}
          <div className=" status-sidebar">

            <div className="p-4 border-bottom">
              <h3 className="fw-bold mb-1">Status</h3>
              <small className="text-muted">
                Updates disappear after 24 hours
              </small>
            </div>

            <div className="p-3">
              <input
                className="search__input status-search"
                placeholder="Search status..."
              />
            </div>

            <div className="status-list">

              <div className="status-item">
                <div className="avatar">+</div>

                <div className="flex-grow-1">
                  <h6 className="mb-0">My Status</h6>
                  <small>Add to your status</small>
                </div>
              </div>

              <p className="section-title">Recent Updates</p>

              {statuses.map((item) => (
                <div className="status-item" key={item.id}>
                  <div className="avatar">
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <div className="flex-grow-1">
                    <h6 className="mb-0">{item.name}</h6>
                    <small>{item.time}</small>
                  </div>
                </div>
              ))}
              <p className="section-title">Viewed Status</p>

              {statuses.map((item) => (
                <div className="status-item" key={item.id}>
                  <div className="avatar">
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <div className="flex-grow-1">
                    <h6 className="mb-0">{item.name}</h6>
                    <small>{item.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}

          <div className="status-view">
            <div className="text-center text">
              <div className="display-2"></div>

              <h4 className="mt-3">
                Select The Status You Want To View
              </h4>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Status