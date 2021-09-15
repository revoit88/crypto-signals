import React from "react";
import { NavLink } from "react-router-dom";

const Header = () => {
  const links = [
    { to: "/", text: "Home" },
    { to: "/results", text: "Results" },
    {
      isDropdown: true,
      text: "More",
      children: [
        { to: "/pairs", text: "Pairs" },
        { to: "/about", text: "About" },
        { to: "/disclaimer", text: "Disclaimer" },
        { to: "/contact", text: "Contact" }
      ]
    }
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
            {links.map((link, index) =>
              !link.isDropdown ? (
                <NavLink
                  exact
                  to={link.to}
                  className="navbar-item has-text-white"
                  activeClassName="is-active"
                  key={`navbar-link-${index}`}>
                  {link.text}
                </NavLink>
              ) : (
                <div
                  className="navbar-item has-dropdown is-hoverable"
                  key={`navbar-link-${index}`}>
                  <NavLink to="#" className="navbar-link">
                    More
                  </NavLink>

                  <div className="navbar-dropdown">
                    {link.children.map(lnk => (
                      <NavLink to={lnk.to} className="navbar-item" key={lnk.to}>
                        {lnk.text}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
