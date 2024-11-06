import React, { useState, useEffect, useContext } from "react";
import {
  fetchAllContacts_by_user,
  get_user_by_username,
  addContact,
  delete_connection,
} from "../../Services/services";
import { avatarData } from "../../constant";
import "../../Style/Contacts.css";
import { AuthContext } from "../../Context/AuthProvider";
import { IoPersonAddSharp } from "react-icons/io5";
import { Modal, Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { setUserSelected } from "../../Redux/feature/feature";
import { useSelector } from "react-redux";

const Contacts = () => {
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext) ?? {};

  const { userSelected } = useSelector((state) => state?.UserData) ?? {};
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState();

  useEffect(() => {
    getContacts();

    setSelectedUser(userSelected?.contact_user_id);
  }, []);

  const getContacts = async () => {
    try {
      const data = await fetchAllContacts_by_user(user?.user_id);
      const ownContact = {
        username: user?.username,
        contact_user_id: user?.user_id,
        contact_first_name: user?.first_name || "You",
        contact_last_name: user?.last_name || "",
        avatar: user?.avatar || "default-avatar",
      };
      const allContacts = [ownContact, ...data].sort((a, b) =>
        a.contact_first_name.localeCompare(b.contact_first_name)
      );

      const groupedContacts = allContacts.reduce((acc, contact) => {
        const firstLetter = contact.contact_first_name.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter].push(contact);
        return acc;
      }, {});

      setContacts(groupedContacts);
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

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSearchResults([]);
    setSelectedContact(null);
    setSearchQuery("");
  };

  const handleSearch = async () => {
    try {
      const result = await get_user_by_username(searchQuery);
      setSearchResults(result ? result : []);
    } catch (error) {
      console.error("Error fetching user by username:", error);
    }
  };

  const handleAddContact = async () => {
    try {
      if (selectedContact && user?.user_id) {
        const ContactAdd = {
          user: user.user_id,
          contact_user: selectedContact?.id,
        };
        await addContact(ContactAdd);
        getContacts();
        handleCancel();
      }
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const showDeleteModal = (contact, e) => {
    e.preventDefault();
    setContactToDelete(contact);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setContactToDelete(null);
  };

  const handleDeleteContact = async () => {
    try {
      if (contactToDelete) {
        await delete_connection(contactToDelete.id);
        getContacts();
        handleDeleteCancel();
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };
  console.log(contacts);
  return (
    <div className="contact-container">
      <div className="add-btn">
        <button className="add-contact" onClick={showModal}>
          <IoPersonAddSharp className="add-contact-icon" />
          <span className="add-contact-text">New Contact</span>
        </button>
      </div>
      <div className="contacts-list">
        {Object.keys(contacts)
          .sort()
          .map((letter) => (
            <div key={letter}>
              <div className="contact-letter">{letter}</div>
              {contacts[letter].map((contact) => (
                <div
                  className={`contact-item ${
                    userSelected?.contact_user_id === contact.contact_user_id
                      ? "selected"
                      : ""
                  }`}
                  key={contact.id}
                  onContextMenu={(e) => showDeleteModal(contact, e)}
                  onClick={() => handleContactClick(contact)}
                >
                  {contact?.Profile ? (
                    <div>
                      <img className="contact-avatar"
                        src={`http://localhost:8000${contact.Profile}`}
                        alt="Contact Profile"
                        onError={(e) =>
                          (e.target.src = "/path/to/default-avatar.png")
                        } 
                      />
                    </div>
                  ) : (
                    <div
                      className="contact-avatar"
                      style={{
                        backgroundColor: getAvatarColor(contact.avatar),
                        color: getInitialsColor(contact.avatar),
                      }}
                    >
                      {getInitials(
                        contact.contact_first_name,
                        contact.contact_last_name
                      )}
                    </div>
                  )}
                  <div className="contact-name">
                    {`${contact.contact_first_name} ${contact.contact_last_name}`}
                    {contact.contact_user_id === user?.user_id && " (You)"}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Modal for Adding Contact */}
      <Modal
        title="Add Contact"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        className="add-contact-modal"
      >
        <Input
          placeholder="Search by username"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suffix={<SearchOutlined onClick={handleSearch} />}
        />
        {searchResults.map((result) => (
          <div
            className="search-result"
            key={result.id}
            onClick={() => setSelectedContact(result)}
          >
            <div
              className="contact-avatar"
              style={{
                backgroundColor: getAvatarColor(
                  result.avatar || "default-avatar"
                ),
                color: getInitialsColor(result.avatar || "default-avatar"),
              }}
            >
              {getInitials(result.firstname, result.lastname)}
            </div>
            <div className="search-result-name">
              {`${result.firstname} ${result.lastname}`}
            </div>
            <Button
              type="primary"
              onClick={handleAddContact}
              disabled={selectedContact?.id !== result.id}
            >
              Add to Contact
            </Button>
          </div>
        ))}
      </Modal>

      {/* Modal for Deleting Contact */}
      <Modal
        title="Delete Contact"
        visible={isDeleteModalVisible}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteContact}
      >
        <p>Are you sure you want to delete this contact?</p>
        <p>
          {contactToDelete?.contact_first_name}{" "}
          {contactToDelete?.contact_last_name}
        </p>
      </Modal>
    </div>
  );
};

export default Contacts;
