import React from "react";
import { NavLink } from "react-router-dom";

const Header = () => {
  const links = [
    { to: "/", text: "Home" },
    { to: "/reports", text: "Reports" },
    { to: "/pairs", text: "Pairs" },
    { to: "/about", text: "About" },
    { to: "/disclaimer", text: "Disclaimer" }
  ];
  return (
    <nav
      className="navbar is-dark"
      role="navigation"
      aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <div className="navbar-item has-text-white">JJ's Crypto Signals</div>

          <button
            className="navbar-burger burger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbar-burger">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        <div id="navbar-burger" className="navbar-menu">
          <div className="navbar-end">
            {links.map((link, index) => (
              <NavLink
                exact
                to={link.to}
                className="navbar-item has-text-white"
                activeClassName="is-active"
                key={`navbar-link-${index}`}>
                {link.text}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
