import React from "react";
import Chatsection from "../components/Chats/Chatsection";
import Profiledetail from "../components/Profiledetails/Profiledetail";
import "../Style/skype.css";
// import { useSelector } from "react-redux";

const skype = () => {

  return (
    <div className="container">
      <div className="contact-section">
        <div className="profile-selection">
          <Profiledetail />
        </div>
      </div>
      <div className="chat-section">
        <Chatsection />
      </div>
    </div>
  );
};

export default skype;
