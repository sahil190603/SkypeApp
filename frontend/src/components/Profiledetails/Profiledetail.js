import React, { useState } from "react";
import Profile from "../../pages/Profile";
import Options from "../../pages/Options";
import SearchPage from "../../pages/search"; 
import "../../Style/profiledetail.css";

const Profiledetail = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedsOption, setSelectedsOption] = useState("Messages");


  return (
    <div className={`profiledetail-container ${showSearch ? 'search-active' : ''}`}>
      <div className="profiledetail-selection">
        <Profile setShowSearch={setShowSearch} setSearchQuery={setSearchQuery} selectedsOption={selectedsOption} />
      </div>
      {!showSearch && <div className="options-section">
        <Options />
      </div>}
      {showSearch && <SearchPage searchQuery={searchQuery} setSlectedsOption = {setSelectedsOption}/>}
    </div>
  );
};

export default Profiledetail;
