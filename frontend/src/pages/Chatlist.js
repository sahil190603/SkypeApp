import React, { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUserSelected } from "../Redux/feature/feature";
import { Fetch_Chatlisting, create_Group, fetchAllContacts_by_user, send_message } from "../Services/services";
import { AuthContext } from "../Context/AuthProvider";
import { avatarData } from "../constant";
import { Modal, Button, Input, Checkbox } from "antd";
import "../Style/Chatlist.css";

const Chatlist = () => {
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext) ?? {};
  const { userSelected } = useSelector((state) => state.UserData);
  const [contacts, setContacts] = useState([]);
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] = useState(false);
  const [isSelectMembersModalVisible, setIsSelectMembersModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const userId = user.user_id;
        const chatList = await Fetch_Chatlisting(userId);
        setContacts(chatList);
      } catch (error) {
        console.error("Error fetching chat contacts:", error);
      }
    };

    fetchContacts();
  }, [user.user_id]);

  const handleContactClick = (contact) => {
    dispatch(setUserSelected(contact));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    const differenceInTime = now - date;
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays >= 1) {
      return date.toLocaleDateString("en-US");
    } else {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";

      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTime = `${hours}:${minutes} ${ampm}`;
      return formattedTime;
    }
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.toUpperCase();
  };

  const getAvatarColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex || "#ccc";
  };

  const getInitialsColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex2 || "#ccc";
  };

  const truncateText = (text, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  const handleCreateGroupClick = () => {
    setIsCreateGroupModalVisible(true);
  };

  const handleCreateGroupSubmit = async () => {
    try {
      const userId = user.user_id;
      const newGroup = await create_Group(groupName, groupDescription, userId, [userId, ...selectedMembers]);

      // Send a "Hello" message to the newly created group
      await send_message(userId, newGroup.id);

      // Reset states and close modal
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers([]);
      setIsCreateGroupModalVisible(false);
      setIsSelectMembersModalVisible(false);

      // Refresh the contact list after creating the group
      const chatList = await Fetch_Chatlisting(userId);
      setContacts(chatList);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleGroupNameChange = (e) => setGroupName(e.target.value);
  const handleGroupDescriptionChange = (e) => setGroupDescription(e.target.value);

  const handleSelectMembers = async () => {
    try {
      const userId = user.user_id;
      const contacts = await fetchAllContacts_by_user(userId);
      setAllContacts(contacts);
      setIsSelectMembersModalVisible(true);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleMemberSelect = (contactId) => {
    setSelectedMembers(prevState => {
      if (prevState.includes(contactId)) {
        return prevState.filter(id => id !== contactId);
      } else {
        return [...prevState, contactId];
      }
    });
  };

  const handleSelectMembersSubmit = () => {
    handleCreateGroupSubmit();
  };

  const canclecreategroup = () => {
    setIsCreateGroupModalVisible(false);
    setGroupName('');
    setGroupDescription('');
  }

  return (
    <div className="chatlist">
      <Button type="primary" onClick={handleCreateGroupClick} className="create-group-button">
        Create Group
      </Button>

      {/* Create Group Modal */}
      <Modal
        title="Create Group"
        visible={isCreateGroupModalVisible}
        onCancel={canclecreategroup}
        onOk={handleSelectMembers}
      >
        <Input
          placeholder="Group Name"
          value={groupName}
          onChange={handleGroupNameChange}
        />
        <Input
          placeholder="Group Description"
          value={groupDescription}
          onChange={handleGroupDescriptionChange}
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* Select Members Modal */}
      <Modal
        title="Select Members"
        visible={isSelectMembersModalVisible}
        onCancel={() => setIsSelectMembersModalVisible(false)}
        onOk={handleSelectMembersSubmit}
      >
        <div className="chatlist-container">
          {allContacts.map((contact) => (
            <div
              key={contact.contact_user_id}
              className={`chatlist-item ${selectedMembers.includes(contact.contact_user_id) ? 'selected' : ''}`}
              onClick={() => handleMemberSelect(contact.contact_user_id)}
            >
              <div
                className="chatlist-avatar"
                style={{
                  backgroundColor: getAvatarColor(contact.avatar || "default-avatar"),
                  color: getInitialsColor(contact.avatar || "default-avatar"),
                }}
              >
                {getInitials(contact.contact_first_name, contact.contact_last_name)}
              </div>
              <div className="chatlist-info">
                <div className="chatlist-name">
                  {contact.contact_first_name} {contact.contact_last_name}
                </div>
              </div>
              <Checkbox
                checked={selectedMembers.includes(contact.contact_user_id)}
                onChange={() => handleMemberSelect(contact.contact_user_id)}
                style={{ marginLeft: "auto" }}
              />
            </div>
          ))}
        </div>
      </Modal>

      <div className="chatlist-container">
        {contacts.map((contact) => {
          const isCurrentUser = user.user_id === contact.contact_user_id;
          const isGroup = contact.group_id !== undefined;
          const isSelected = isGroup ? userSelected?.group_id === contact.group_id : userSelected?.contact_user_id === contact.contact_user_id;
          return (
            <div
              key={contact.id}
              className={`chatlist-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleContactClick(contact)}
            >
              <div
                className="chatlist-avatar"
                style={{
                  backgroundColor: isGroup ? getAvatarColor(contact.avatar || "default-group") : getAvatarColor(contact.avatar || "default-avatar"),
                  color: isGroup ? getInitialsColor(contact.avatar || "default-group") : getInitialsColor(contact.avatar || "default-avatar"),
                }}
              >
                {isGroup ? contact.group_name.charAt(0) : getInitials(contact.contact_first_name, contact.contact_last_name)}
              </div>
              <div className="chatlist-info">
                <div className="chatlist-header">
                  <div className="chatlist-name">
                    {isGroup ? contact.group_name : `${contact.contact_first_name} ${contact.contact_last_name}`}
                    {isCurrentUser && " (You)"}
                  </div>
                  <div className="chatlist-timestamp">
                    {formatTime(contact.timestamp)}
                  </div>
                </div>
                <div className="chatlist-message">
                  {truncateText(contact.content || contact.file_name)}
                  {contact.unseen_message_count > 0 && (
                    <div className="un-seen">
                      <span className="unseen-message-count">
                        {contact.unseen_message_count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Chatlist;
