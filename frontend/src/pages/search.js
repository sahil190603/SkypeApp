import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'antd';
import "../Style/SearchPage.css";
import { search_message } from '../Services/services';
import { AuthContext } from "../Context/AuthProvider";
import { avatarData } from "../constant";
import { useDispatch } from 'react-redux';
import { setUserSelected } from '../Redux/feature/feature';

const SearchPage = ({ setSlectedsOption, searchQuery }) => {
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext) ?? {};
  const [selectedOption, setSelectedOption] = useState("Messages");
  const [searchResults, setSearchResults] = useState([]);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const search = async (option, query) => {
    const results = await search_message(user?.user_id, query || null, option);
    setSearchResults(results);
    setSlectedsOption(option);
  };

  useEffect(() => {
    search(selectedOption, searchQuery);
  }, [searchQuery, selectedOption]);

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
      return `${hours}:${minutes} ${ampm}`;
    }
  };

  const getAvatarColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex || "#ccc";
  };

  const getInitialsColor = (avatarValue) => {
    const avatar = avatarData.find((item) => item.name === avatarValue);
    return avatar?.Hex2 || "#ccc";
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.toUpperCase();
  };

  const truncateMessage = (message) => {
    return message.length > 20 ? `${message.substring(0, 20)}...` : message;
  };

  const handleContactClick = (contact) => {
    dispatch(setUserSelected(contact));
  };

  const highlightText = (text, query) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => (
      part.toLowerCase() === query.toLowerCase() ? <span key={index} className="highlight">{part}</span> : part
    ));
  };

  return (
    <div className="search-page-container">
      <div className='filters'>
        <div className="search-filters">
          <Button
            type="text"
            className={selectedOption === "People" ? "selected" : ""}
            onClick={() => handleOptionClick("People")}
          >
            People
          </Button>
          <Button
            type="text"
            className={selectedOption === "Messages" ? "selected" : ""}
            onClick={() => handleOptionClick("Messages")}
          >
            Messages
          </Button>
          <Button
            type="text"
            className={selectedOption === "Groups" ? "selected" : ""}
            onClick={() => handleOptionClick("Groups")}
          >
            Groups
          </Button>
        </div>
      </div>
      <div className="search-page-content">
        <div className="search-results">
          {searchResults.length > 0 ? (
            searchResults.map((result, index) => {
              const isGroup = result.group_id && result.group_name;
              const avatarName = result.avatar || "default-avatar";
              const displayName = isGroup
                ? result.group_name
                : `${result.contact_first_name || result.sender} ${result.contact_last_name || ''}`;
              const displayMessage = isGroup
                ? `@${result.contact_first_name}: ${truncateMessage(result.content || result.file_name || result.image_name || '')}`
                : truncateMessage(result.content || result.file_name || result.image_name || '');

              return (
                <div key={index} className="search-result-item" onClick={() => handleContactClick(result)}>
                  <div
                    className="search-result-avatar"
                    style={{
                      backgroundColor: getAvatarColor(avatarName),
                      color: getInitialsColor(avatarName),
                    }}
                  >
                    {isGroup
                      ? getInitials(result.group_name, '')
                      : getInitials(result.contact_first_name || result.sender, result.contact_last_name || '')}
                  </div>
                  <div className="search-result-info">
                    <div className="search-result-header">
                      <div className="search-result-sender">
                        {highlightText(displayName, searchQuery)}
                      </div>
                      <div className="search-result-timestamp">
                        {formatTime(result.timestamp)}
                      </div>
                    </div>
                    <div className="search-result-message">
                      {highlightText(displayMessage, searchQuery)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No results found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
