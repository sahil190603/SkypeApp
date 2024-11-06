import React, { useState } from "react";
import { IoChatbubbleEllipsesOutline, IoCallOutline } from "react-icons/io5";
import { IoMdNotificationsOutline } from "react-icons/io";
import { RiContactsBook3Line } from "react-icons/ri";
import Contacts from "../components/Contacts/Contacts";
import Chatlist from "./Chatlist";
import Notifications from "./Notifications";
import Calls from "./calls";
import "../Style/Option.css";

const Options = () => {
  const [selectedOption, setSelectedOption] = useState("Chats");

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  return (
    <div>
      <div className="options-container">
        <div
          className={`option-item ${
            selectedOption === "Chats" ? "selected" : ""
          }`}
          onClick={() => handleOptionClick("Chats")}
        >
          <IoChatbubbleEllipsesOutline className="option-icon" />
          <div className="option-label">Chats</div>
        </div>
        <div
          className={`option-item ${
            selectedOption === "Calls" ? "selected" : ""
          }`}
          onClick={() => handleOptionClick("Calls")}
        >
          <IoCallOutline className="option-icon" />
          <div className="option-label">Calls</div>
        </div>
        <div
          className={`option-item ${
            selectedOption === "Contacts" ? "selected" : ""
          }`}
          onClick={() => handleOptionClick("Contacts")}
        >
          <RiContactsBook3Line className="option-icon" />
          <div className="option-label">Contacts</div>
        </div>
        <div
          className={`option-item ${
            selectedOption === "Notifications" ? "selected" : ""
          }`}
          onClick={() => handleOptionClick("Notifications")}
        >
          <IoMdNotificationsOutline className="option-icon" />
          <div className="option-label">Notifications</div>
        </div>
      </div>
      {selectedOption === "Contacts" && <Contacts />}
      {selectedOption === "Notifications" && <Notifications />}
      {selectedOption === "Calls" && <Calls />}
      {selectedOption === "Chats" && <Chatlist />}
    </div>
  );
};

export default Options;
