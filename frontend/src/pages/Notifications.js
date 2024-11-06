import React from "react";
import "../Style/Notifications.css";
import NotificationGif from "../img/notification.gif";

const Notifications = () => {
  return (
    <div className="notifications-container">
      <div className="notifications-header">
        Push notifications are turned off
      </div>
      <div className="notifications-content">
        <h2>No new notifications</h2>
        <p>
          Check back to see new @ mentions, reactions, quotes and much more.
        </p>
        <img
          src={NotificationGif}
          alt="Notification Bell"
          className="notification-gif"
        />
      </div>
    </div>
  );
};

export default Notifications;
