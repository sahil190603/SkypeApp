import React, { useState, useEffect, useContext } from "react";
import {
  fetchAllContacts_by_user,
} from "../Services/services";
import { avatarData } from "../constant";
import "../Style/Contacts.css";
import { AuthContext } from "../Context/AuthProvider";
import { useDispatch } from "react-redux";
import { setUserSelected } from "../Redux/feature/feature";
import { useSelector } from "react-redux";
import { IoCallOutline } from "react-icons/io5";
import { message } from "antd";

const Calls = () => {
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext) ?? {};

  const { userSelected } = useSelector((state) => state?.UserData) ?? {};
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState();

  useEffect(() => {
    getContacts();

    setSelectedUser(userSelected?.contact_user_id);
  }, []);

  const getContacts = async () => {
    try {
      const data = await fetchAllContacts_by_user(user?.user_id);

      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleContactClick = (contact) => {
    dispatch(setUserSelected(contact));
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.toUpperCase();
  };

  const getInitialsColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex2 || "#ccc";
  };

  const getAvatarColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex || "#ccc";
  };

  const callContact = (contact) => {
    console.log(`Calling ${contact?.contact_No} by ${user?.contact_no}`);
    message.success(`Calling ${contact?.username} by ${user?.username}`);
  };

  return (
    <div className="contacts-container">
      <div className="contact-divider"></div>
      {/* Contacts displayed in a simple list */}
      <div className="contacts-list">
        {contacts.map((contact) => (
          <div
            className={`contact-item ${userSelected?.contact_user_id === contact.contact_user_id ? 'selected' : ''}`}
            key={contact.contact_user_id}
            onClick={() => handleContactClick(contact)}
          >
            <div
              className="contact-avatar"
              style={{
                backgroundColor: getAvatarColor(contact.avatar),
                color: getInitialsColor(contact.avatar),
              }}
            >
              {getInitials(contact.contact_first_name, contact.contact_last_name)}
            </div>
            <div className="contact-name">
              {contact.contact_first_name} {contact.contact_last_name}
            </div>
            <button
              className="call-button"
              onClick={(e) => {
                e.stopPropagation();
                callContact(contact);
              }}
            >
              <IoCallOutline size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calls;
