import React, { useState } from "react";

function goToTelegram(closeModal) {
  window.open("https://t.me/jjscryptosignals", "_blank");
  if (typeof closeModal === "function") {
    closeModal();
  }
}
const Modal = ({ show, closeModal }) => {
  const [state, setState] = useState({ disclaimer: false, about: false });
  function tickCheckbox(key, event) {
    setState(prevState => ({ ...prevState, [key]: event.target.checked }));
  }
  if (!show) {
    return null;
  }
  return (
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Join Telegram Channel</p>
        </header>
        <section className="modal-card-body">
          <div>
            <label className="checkbox">
              <input
                type="checkbox"
                onChange={tickCheckbox.bind(null, "disclaimer")}
              />{" "}
              I have read the{" "}
              <a
                href="https://jjscryptosignals.com/disclaimer"
                target="_blank"
                rel="noreferrer">
                disclaimer
              </a>{" "}
              and understand the risks that come from trading cryptocurrencies.
            </label>
          </div>
          <div>
            <label className="checkbox">
              <input
                type="checkbox"
                onChange={tickCheckbox.bind(null, "about")}
              />{" "}
              I have read{" "}
              <a
                href="https://jjscryptosignals.com/about"
                target="_blank"
                rel="noreferrer">
                about the strategy
              </a>{" "}
              used and understand how it works.
            </label>
          </div>
        </section>
        <footer className="modal-card-foot">
          <button
            className="button is-primary"
            onClick={goToTelegram.bind(null, closeModal)}
            disabled={!state.about || !state.disclaimer}>
            Join
          </button>
          <button className="button" onClick={closeModal}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Modal;
