import React from "react";

const NavBarComp = () => {
  return (
    <div className="container py-4">
      <nav
        className="navbar navbar-expand-lg navbar-light bg-light rounded"
        style={{ backgroundColor: "#e3f2fd" }}
      >
        <a className="navbar-brand" href="/">
          Let's learn Sinhala Fingerspelling Alphabet
        </a>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item active">
              <a className="nav-link" href="/">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/about">
                About
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default NavBarComp;
