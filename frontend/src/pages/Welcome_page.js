import React, { useContext } from "react";
import { AuthContext } from "../Context/AuthProvider";
import { avatarData } from "../constant";
import "../Style/Welcome.css";

const Welcome_page = () => {
  const { user } = useContext(AuthContext) ?? {};
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const avatarInitials = `${firstName.charAt(0)}${lastName.charAt(
    0
  )}`.toUpperCase();

  const getAvatarColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex || "#1890ff"; 
  };

  const avatarColor = getAvatarColor(user?.avatar);

  return (
    <div className="welcome-container">
      <div className="welcome-avatar" style={{ backgroundColor: avatarColor }}>
        {avatarInitials}
      </div>
      <div className="welcome-message">Welcome!</div>
      <div className="welcome-name">{`${firstName} ${lastName}`}</div>
    </div>
  );
};

export default Welcome_page;
