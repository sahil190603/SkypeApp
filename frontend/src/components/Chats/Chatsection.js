import React from "react";
import { useSelector } from "react-redux";
import Chats from "../../pages/Chats";
import Welcome_page from "../../pages/Welcome_page";
const Chatsection = () => {
  const { userSelected } = useSelector((state) => state?.UserData) ?? {};

  return (
    <>
      {userSelected === null && <Welcome_page />}
      {userSelected !== null && <Chats />}
    </>
  );
};

export default Chatsection;
