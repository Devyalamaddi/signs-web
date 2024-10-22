import React from 'react';
import './Switch.css';

const Switch = ({ isChecked, onToggle }) => {
  return (
    <>
      <input
        className="react-switch-checkbox"
        id="react-switch-new"
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
      />
      <label
        className="react-switch-label"
        htmlFor="react-switch-new"
      >
        <span className="react-switch-button" />
      </label>
    </>
  );
};

export default Switch;
