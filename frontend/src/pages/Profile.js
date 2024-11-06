import React, { useState, useContext } from "react";
import { Button, Dropdown, Menu, Modal, Input, Upload, message } from "antd";
import {
  EllipsisOutlined,
  SearchOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import "../Style/Profile.css";
import { AuthContext } from "../Context/AuthProvider";
import { avatarData } from "../constant";
import { add_profile } from "../Services/services";

const Profile = ({ setShowSearch, setSearchQuery, selectedsOption }) => {
  const { user, logoutUser } = useContext(AuthContext) ?? {};
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [searchSet, issearchSet] = useState(false);
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);

  const logout = () => {
    logoutUser();
  };

  const showLogoutModal = () => {
    setIsLogoutModalVisible(true);
  };

  const showProfileModal = () => {
    setIsProfileModalVisible(true);
  };

  const handleLogoutOk = () => {
    setIsLogoutModalVisible(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalVisible(false);
  };

  const handleProfileCancel = () => {
    setIsProfileModalVisible(false);
  };

  const goToSearchPage = () => {
    setShowSearch(true);
    issearchSet(true);
  };

  const handleSearchInput = (e) => {
    setQuery(e.target.value);
    setSearchQuery(e.target.value);
  };

  const cancelHandle = () => {
    setShowSearch(false);
    issearchSet(false);
    setQuery("");
    setSearchQuery("");
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    return `${firstName?.charAt(0) ?? ""}${
      lastName?.charAt(0) ?? ""
    }`.toUpperCase();
  };

  const getAvatarColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex || "#ccc";
  };

  const getInitialsColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex2 || "#ccc";
  };

  const handleFileChange = (info) => {
    const latestFile = info.file;

    if (latestFile) {
      setFile(latestFile);
      message.success(`${latestFile.name} file selected.`);
    } else {
      message.error(`Failed to select file.`);
    }
  };

  const handleProfileSubmit = async () => {
    if (!file) {
      message.error("Please upload a profile photo.");
      return;
    }

    try {

      const formData = new FormData();
      formData.append("Profile", file);

      await add_profile(user.user_id, formData);
      message.success("Profile photo uploaded successfully!");
      setIsProfileModalVisible(false);
    } catch (error) {
      message.error("Failed to upload profile photo.");
    }
  };

  const initials = getInitials(user?.first_name, user?.last_name);
  const initialsColor = getInitialsColor(user?.avatar);
  const avatarColor = getAvatarColor(user?.avatar);

  const menu = (
    <Menu>
      <Menu.Item onClick={showLogoutModal}>Logout</Menu.Item>
      <Menu.Item onClick={showProfileModal}>Profile</Menu.Item>
    </Menu>
  );

  return (
    <div>
      <div className="profile-container">
        {user?.Profile ? (
          <div >
            <img className="profile-avatar"
              src={`http://localhost:8000${user?.Profile}`}
              alt="Profile"
              onError={(e) => (e.target.src = "/path/to/default-avatar.png")} 
            />
          </div>
        ) : (
          <div
            className="profile-avatar"
            style={{
              backgroundColor: avatarColor,
              color: initialsColor,
            }}
          >
            {initials}
          </div>
        )}

        <div className="profile-name">
          {user?.first_name} {user?.last_name}
        </div>
        <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
          <Button
            icon={<EllipsisOutlined className="setting-icon" />}
            style={{ border: "none", background: "none" }}
          />
        </Dropdown>
      </div>
      <div className="profile-search-bar">
        {searchSet && (
          <Input
            placeholder={`Search by ${selectedsOption}`}
            value={query}
            onChange={handleSearchInput}
            className="skype-search-button"
          />
        )}
        {!searchSet && (
          <Button
            icon={<SearchOutlined />}
            type="text"
            onClick={goToSearchPage}
            className="skype-search-button"
          >
            Search by people, message, group
          </Button>
        )}
        {searchSet && (
          <Button
            icon={<CloseOutlined />}
            type="text"
            onClick={cancelHandle}
            className="search-cancel-button"
          />
        )}
      </div>

      {/* Logout Modal */}
      <Modal
        title="Confirm Logout"
        visible={isLogoutModalVisible}
        onOk={handleLogoutOk}
        onCancel={handleLogoutCancel}
        okText="Logout"
        cancelText="Cancel"
        wrapClassName="custom-modal"
        maskClosable={false}
        destroyOnClose
      >
        <p>Are you sure you want to log out?</p>
      </Modal>

      {/* Profile Modal */}
      <Modal
        title="Add Profile"
        visible={isProfileModalVisible}
        onOk={handleProfileSubmit}
        onCancel={handleProfileCancel}
        okText="Submit"
        cancelText="Cancel"
        wrapClassName="custom-modal"
        maskClosable={false}
        destroyOnClose
      >
        <Upload
          name="Profile"
          listType="picture"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleFileChange}
        >
          <Button icon={<UploadOutlined />}>
            Click to Upload Profile Photo
          </Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default Profile;
