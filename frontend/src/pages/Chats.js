import React, { useState, useEffect, useContext, useRef } from "react";
import Modal from "react-modal";
import { useSelector } from "react-redux";
import {
  connectPrivateChat,
  sendMessage,
  disconnectWebSocket,
  handleFileDownload,
} from "../Services/chatservices";
import {
  Fetch_chat_by_user_and_reciver,
  put_is_read_chat_by_reciver_as_user,
  get_max_read_message_id_by_reciver,
  fetchAllContacts_by_user,
  For_ward_message,
  get_message_by_message_id,
  get_all_messages_for_group,
  put_is_read_in_message_of_Group,
  get_all_group_users_last_message_seen,
  get_group_member_by_group_name,
} from "../Services/services";
import { AuthContext } from "../Context/AuthProvider";
import { avatarData } from "../constant";
import "../Style/Chats.css";
import EmojiPicker from "emoji-picker-react";
import {
  FaFilePdf,
  FaFileAlt,
  FaFileArchive,
  FaFileExcel,
  FaRegCopy,
} from "react-icons/fa";
import { MdOutlineDownloading, MdFolderZip, MdDelete } from "react-icons/md";
import { LuFileUp, LuReply } from "react-icons/lu";
import { LiaFileVideoSolid } from "react-icons/lia";
import { BiSolidFileDoc } from "react-icons/bi";
import { CiEdit } from "react-icons/ci";
import { LuForward } from "react-icons/lu";
import { IoReturnUpBack } from "react-icons/io5";
import { getLinkPreview } from "link-preview-js";

Modal.setAppElement("#root");

const Chats = () => {
  const { user } = useContext(AuthContext) ?? {};
  const { userSelected } = useSelector((state) => state.UserData);
  const selectedContactUser = userSelected?.group_id
    ? userSelected?.group_name
    : userSelected?.username;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalMessage, setOriginalMessage] = useState("");
  const [maxreadMessageId, setMaxreadMessageId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [forwardedMessage, setForwardedMessage] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [forwardMessageContent, setForwardMessageContent] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [seenMessages, setSeenMessages] = useState({});
  const messagesEndRef = useRef(null);
  const chatSocket = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});

  const handleGroupMembersClick = async () => {
    if (userSelected?.group_id) {
      try {
        const members = await get_group_member_by_group_name(
          userSelected.group_name
        );
        setGroupMembers(members);
        setShowMembers(true);
      } catch (error) {
        console.error("Failed to fetch group members:", error);
      }
    }
  };

  useEffect(() => {
    if (userSelected?.group_id) {
      get_all_group_users_last_message_seen(
        userSelected.group_name,
        user?.user_id
      ).then((data) => {
        setSeenMessages(data);
      });
    }
  }, [userSelected?.group_id]);

  const renderAvatars = (messageId) => {
    const seenUsers = Object.entries(seenMessages).filter(
      ([userId, info]) => info.max_seen_message_id === messageId
    );

    const avatarsToShow = seenUsers.slice(0, 3);
    const extraCount = seenUsers.length - 3;

    return (
      <div className="receiver-avatar">
        {avatarsToShow.map(([userId, info], index) => (
          <div
            key={userId}
            className="avatar-circle"
            style={{
              backgroundColor: getAvatarColor(info.avatar || "blue-4"),
              color: getInitialsColor(info.avatar || "blue-4"),
              zIndex: 3 - index,
            }}
          >
            {getInitials(info.first_name, info.last_name)}
          </div>
        ))}
        {extraCount > 0 && <div className="extra-count">+{extraCount}</div>}
      </div>
    );
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetchAllContacts_by_user(user.user_id);

        setContacts(response || []);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    if (user?.user_id) {
      fetchContacts();
    }
  }, [user?.user_id]);
  console.log("slected recipient", selectedRecipient);
  const handleForwardMessage = async () => {
    if (!selectedRecipient || !selectedMessage) return;
    try {
      const messageContent =
        forwardMessageContent.trim() === "" ? null : forwardMessageContent;
      await For_ward_message(
        user.user_id,
        selectedRecipient?.contact_user_id,
        messageContent,
        selectedMessage.message_id
      );
      setIsForwardOpen(false);
      setForwardMessageContent("");
      setSelectedRecipient(null);
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error forwarding message:", error);
    }
  };
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      setAudioBlob(event.data);
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const handleSendRecording = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });
      handleSendMessage(audioFile);
      setAudioBlob(null);
    }
  };

  const ForwardedMessage = ({ msg }) => {
    useEffect(() => {
      const fetchForwardedMessage = async () => {
        if (forwardedMessage === null) {
          if (msg.Forward_to) {
            try {
              const response = await get_message_by_message_id(msg.Forward_to);
              setForwardedMessage(response);
            } catch (error) {
              console.error("Error fetching forwarded message:", error);
            }
          }
        }
      };
      fetchForwardedMessage();
    }, [msg.Forward_to]);

    return (
      <div className="forwarded-message">
        <div className="forwarded-message-header">
          <IoReturnUpBack />
        </div>
        <div className="forwarded-message-content">
          {forwardedMessage ? (
            forwardedMessage.content
          ) : (
            <span>Fetching forwarded message...</span>
          )}
          {forwardedMessage && (
            <div className="forwarded-message-header-info">
              <span>
                {forwardedMessage.sender?.first_name}{" "}
                {forwardedMessage.sender?.last_name}
              </span>
              &nbsp;&nbsp;
              <span>
                {new Date(forwardedMessage.timestamp).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleReply = (message) => {
    setReplyMessage(message);
    handleContextMenuClose();
  };

  const handlePreviewClick = (type, contentUrl) => {
    setPreviewType(type);
    setPreviewContent(contentUrl);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewContent(null);
    setIsForwardOpen(false);
    setPreviewType("");
    setShowMembers(false);
  };

  useEffect(() => {
    if (!user?.username || !userSelected) return;

    const currentUser = user?.username;
    setMessages([]);
    setMaxreadMessageId(null);
    console.log("Selected user changed, resetting messages...");

    const handleMessage = (newMessage) => {
      if (newMessage.action === "delete") {
        handleMessageDelete(newMessage);
      } else if (newMessage.action === "update") {
        handleMessageUpdate(newMessage);
      } else {
        setMessages((prevMessages) => {
          if (
            prevMessages.some((msg) => msg.message_id === newMessage.message_id)
          ) {
            console.log("Duplicate message detected, skipping:", newMessage);
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      }
    };

    const fetchMessages = async () => {
      try {
        let historicalMessages = [];
        if (userSelected?.group_id) {
          const response = await get_all_messages_for_group(
            userSelected?.group_name
          );
          historicalMessages = response || [];
        } else {
          const response = await Fetch_chat_by_user_and_reciver(
            user?.user_id,
            userSelected?.contact_user_id
          );
          historicalMessages = response.messages || [];
        }
        setMessages(
          historicalMessages.map((msg) => ({
            message_id: msg.id,
            message: msg.message || msg.content,
            sender: msg.sender,
            receiver: msg.recipient,
            contact_first_name: msg.contact_first_name,
            contact_last_name: msg.contact_last_name,
            file: msg.file,
            thumbnail: msg.thumbnail,
            avatar: msg.avatar,
            image: msg.image,
            is_download: msg.is_download,
            timestamp: msg.timestamp,
            reply_to: msg.reply_to,
            Forward_to: msg.Forward_to,
          }))
        );
      } catch (error) {
        console.error("Error fetching messages from API:", error);
      }
    };

    chatSocket.current = connectPrivateChat(
      userSelected?.group_id ? userSelected?.group_name : currentUser,
      selectedContactUser,
      handleMessage
    );

    fetchMessages();

    return () => {
      disconnectWebSocket(chatSocket.current);
    };
  }, [user?.username, selectedContactUser]);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      try {
        if (userSelected?.group_id) {
          await put_is_read_in_message_of_Group(
            userSelected?.group_name,
            user.user_id
          );
        } else {
          await put_is_read_chat_by_reciver_as_user(
            userSelected?.contact_user_id,
            user.user_id
          );
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    if (
      user?.user_id &&
      (userSelected?.group_id || userSelected?.contact_user_id)
    ) {
      markMessagesAsRead();
    }
  }, [
    user?.user_id,
    userSelected?.group_id,
    userSelected?.group_name,
    userSelected?.contact_user_id,
  ]);

  useEffect(() => {
    const fetchMinUnreadMessageId = async () => {
      try {
        const response = await get_max_read_message_id_by_reciver(
          user.user_id,
          userSelected?.contact_user_id
        );
        setMaxreadMessageId(response.max_read_message_id || null);
      } catch (error) {
        console.error("Error fetching minimum unread message ID:", error);
      }
    };
    fetchMinUnreadMessageId();
    // const intervalId = setInterval(fetchMinUnreadMessageId, 4000);

    // return () => clearInterval(intervalId);
  }, [user?.user_id, userSelected?.contact_user_id]);

  useEffect(() => {
    console.log("Messages updated, scrolling to end...");
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() && !file && !image && !audioBlob) return;

    const currentUser = user.username;
    const replyTo = selectedMessage ? selectedMessage.message_id : null;
    const isGroupChat = userSelected?.group_id;

    try {
      await sendMessage(
        currentUser,
        isGroupChat ? null : selectedContactUser,
        message,
        currentUser,
        file ? file : audioBlob,
        image,
        replyTo,
        isGroupChat ? userSelected.group_id : null,
        isGroupChat ? userSelected.group_name : null
      );

      setMessage("");
      setFile(null);
      setImage(null);
      setIsEditing(false);
      setOriginalMessage("");
      setSelectedMessage(null);
      setReplyMessage(null);
      setShowEmojiPicker(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      if (["png", "jpg", "jpeg"].includes(fileExtension)) {
        setImage(selectedFile);
        setFile(null);
        setSelectedMessage(null);
      } else {
        setFile(selectedFile);
        setImage(null);
        setSelectedMessage(null);
      }
    }
  };

  const handleDeleteMessage = (messageId) => {
    chatSocket.current.send(
      JSON.stringify({
        action: "delete",
        group_id: userSelected?.group_id,
        message_id: messageId,
        sender: user.username,
        receiver: selectedContactUser,
      })
    );
  };

  const handleUpdateMessage = async (messageId, newContent) => {
    if (newContent !== null && newContent.trim() !== "") {
      chatSocket.current.send(
        JSON.stringify({
          action: "update",
          group_id: userSelected?.group_id,
          message_id: messageId,
          message: newContent,
          sender: user.username,
          receiver: selectedContactUser,
        })
      );
    }
  };

  const handleMessageUpdate = (updatedMessage) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.message_id === updatedMessage.message_id
          ? { ...msg, message: updatedMessage.new_content }
          : msg
      )
    );
  };
  const handleMessageDelete = (deletedMessage) => {
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.message_id !== deletedMessage.message_id)
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const initials = `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`;
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

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setSelectedMessage(msg);
    setContextMenu({
      top: e.clientY,
      left: e.clientX,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
    // setSelectedMessage(null);
  };

  const handleEditMessage = () => {
    setMessage(selectedMessage.message);
    setOriginalMessage(selectedMessage.message);
    setIsEditing(true);
    handleContextMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      handleDeleteMessage(selectedMessage.message_id);
    }
    handleContextMenuClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(selectedMessage.message);
    alert("Message copied to clipboard!");
    handleContextMenuClose();
  };

  const onEmojiClick = (event, emojiObject) => {
    setMessage((prevMessage) => prevMessage + event.emoji);
  };

  const handleDownloadClick = (messageId) => {
    const groupId = userSelected?.group_id;
    handleFileDownload(messageId, groupId);
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.message_id === messageId ? { ...msg, is_download: true } : msg
      )
    );
  };

  const handelopenForward = () => {
    setIsForwardOpen(true);
  };

  const renderFile = (fileUrl, messageId, thumbnailUrl, is_download) => {
    if (!fileUrl) return null;

    const fileExtension = fileUrl.split(".").pop().toLowerCase();
    const filename = fileUrl.split("/").pop();

    const baseDownloadUrl = `http://localhost:8000/message/Message/download/${messageId}/`;

    const downloadUrl = userSelected?.group_id
      ? `${baseDownloadUrl}?group_id=${userSelected.group_id}`
      : baseDownloadUrl;

    const renderIcon = () => {
      switch (fileExtension) {
        case "pdf":
          return <FaFilePdf style={{ color: "red" }} className="file-icon" />;
        case "zip":
          return (
            <MdFolderZip style={{ color: "#FF9100" }} className="file-icon" />
          );
        case "rar":
          return <FaFileArchive className="file-icon" />;
        case "xlsx":
          return (
            <FaFileExcel style={{ color: "#1d6f42" }} className="file-icon" />
          );
        case "mp4":
          return (
            <LiaFileVideoSolid
              style={{ color: "blue" }}
              className="file-icon"
              onClick={() =>
                handlePreviewClick("mp4", `http://127.0.0.1:8000${fileUrl}`)
              }
            />
          );
        case "docx":
          return (
            <BiSolidFileDoc
              style={{ color: "skyblue" }}
              className="file-icon"
            />
          );
        case "mp3":
          return (
            <div className="audio-player">
              <audio controls>
                <source
                  src={`http://127.0.0.1:8000${fileUrl}`}
                  type="audio/mpeg"
                />
                Your browser does not support the audio element.
              </audio>
            </div>
          );
        default:
          return <FaFileAlt className="file-icon" />;
      }
    };

    return (
      <div className="file-preview">
        <div className="file-icon-container">
          {fileExtension === "pdf" && thumbnailUrl ? (
            <img
              src={`http://127.0.0.1:8000${thumbnailUrl}`}
              alt="PDF thumbnail"
              className="pdf-thumbnail"
              onClick={() =>
                window.open(`http://127.0.0.1:8000${fileUrl}`, "_blank")
              }
            />
          ) : (
            <div
              className="icon"
              onClick={() =>
                window.open(`http://127.0.0.1:8000${fileUrl}`, "_blank")
              }
            >
              {renderIcon()}
            </div>
          )}
          {is_download === false && fileExtension !== "mp3" && (
            <a
              href={downloadUrl}
              className="download-icon"
              onClick={() => handleDownloadClick(messageId)}
            >
              <MdOutlineDownloading />
            </a>
          )}
        </div>
        {fileExtension !== "mp3" && fileExtension !== "pdf" && (
          <div className="file-preview-filename">{filename}</div>
        )}
      </div>
    );
  };

  const renderImage = (imageUrl, messageId, is_download) => {
    if (!imageUrl) return null;

    const baseDownloadUrl = `http://localhost:8000/message/Message/download/${messageId}/`;

    const downloadUrl = userSelected?.group_id
      ? `${baseDownloadUrl}?group_id=${userSelected.group_id}`
      : baseDownloadUrl;

    return (
      <div className="file-icon-container">
        <img
          src={`http://localhost:8000${imageUrl}`}
          alt="Image preview"
          className="image-preview"
          onClick={() =>
            handlePreviewClick("jpg", `http://localhost:8000${imageUrl}`)
          }
        />
        {!is_download && (
          <a
            href={downloadUrl}
            className="download-icon"
            onClick={() => handleDownloadClick(messageId)}
          >
            <MdOutlineDownloading />
          </a>
        )}
      </div>
    );
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleCancelEdit = () => {
    setMessage("");
    setIsEditing(false);
    setOriginalMessage("");
  };

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);

      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 4000);
    }
  };
////// These commented code is use to create to create and get the link tubnail to show like an skype..
  // const LinkPreview = ({ url }) => {
  //   debugger
  //   const [metadata, setMetadata] = useState(null);
  
  //   useEffect(() => {
  //     getLinkPreview(url)
  //       .then((data) => setMetadata(data))
  //       .catch((error) => console.error("Error fetching link preview:", error));
  //   }, [url]);
  
  //   if (!metadata) return null;
  
  //   return (
  //     <div className="link-preview">
  //       {metadata.images?.length > 0 && (
  //         <img
  //           src={metadata.images[0]}
  //           alt={metadata.title}
  //           className="link-thumbnail"
  //         />
  //       )}
  //       <div className="link-info">
  //         <a href={metadata.url} target="_blank" rel="noopener noreferrer">
  //           <h4 className="link-title">{metadata.title}</h4>
  //         </a>
  //         <p className="link-description">{metadata.description}</p>
  //       </div>
  //     </div>
  //   );
  // };
  // const renderMessageContent = (content) => {
  //   const urlPattern = /(https?:\/\/[^\s]+)/g;
  //   const parts = content.split(urlPattern);

  //   return parts.map((part, index) => {
  //     if (part.match(urlPattern)) {
  //       return <LinkPreview key={index} url={part} />;
  //     }
  //     return <span key={index}>{part}</span>;
  //   });
  // };

  function renderMessageContent(content) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlPattern);
  
    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'blue' }}
          >
            {part}
          </a>
        );
      }
  
      return <span key={index}>{part}</span>;
    });
  }

  return (
    <div className="chat-container" onClick={handleContextMenuClose}>
      <div className="chat-header">
        <div
          className="chat-avatar"
          style={{
            backgroundColor: getAvatarColor(
              userSelected?.avatar || "default-avatar"
            ),
            color: getInitialsColor(userSelected?.avatar || "default-avatar"),
          }}
        >
          {userSelected?.group_id
            ? getInitials(userSelected.group_name.charAt(0))
            : getInitials(
                userSelected?.contact_first_name,
                userSelected?.contact_last_name
              )}
        </div>
        <div className="chat-contact-name">
          {userSelected?.group_id
            ? userSelected.group_name
            : userSelected?.contact_first_name}{" "}
          {userSelected?.contact_last_name}{" "}
          {userSelected?.group_id && (
            <div
              className="participent-Count"
              onClick={handleGroupMembersClick}
            >
              {" "}
              {userSelected?.group_member_count} Participents
            </div>
          )}
          {userSelected?.username === user?.username && " (you)"}
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => {
          const repliedMessage = messages.find(
            (replyMsg) => replyMsg.message_id === msg.reply_to
          );
          return (
            <div
              key={msg.message_id}
              className={`message ${
                msg.sender === user?.username ? "sent" : "received"
              } ${msg.reply_to ? "reply" : ""}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              ref={(el) => (messageRefs.current[msg.message_id] = el)}
              style={{ position: "relative" }}
            >
              {highlightedMessageId === msg.message_id && (
                <div className="highlight-overlay"></div>
              )}
              <div className="message-header">
                {msg.sender !== user?.username && (
                  <>
                    <div
                      className="message-avatar"
                      style={{
                        backgroundColor: getAvatarColor(
                          userSelected?.group_id
                            ? msg.avatar
                            : userSelected?.avatar || "default-avatar"
                        ),
                        color: getInitialsColor(
                          userSelected?.group_id
                            ? msg.avatar
                            : userSelected?.avatar || "default-avatar"
                        ),
                      }}
                    >
                      {userSelected?.group_id
                        ? getInitials(
                            msg.contact_first_name,
                            msg.contact_last_name
                          )
                        : getInitials(
                            userSelected?.contact_first_name,
                            userSelected?.contact_last_name
                          )}
                    </div>
                    <div className="message-info">
                      <div className="message-sender">
                        {userSelected?.group_id
                          ? msg.sender
                          : userSelected?.contact_first_name}
                        ,&nbsp;
                      </div>
                    </div>
                  </>
                )}
                <div className="message-timestamp">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
              <div className="message-content">
                {msg.reply_to && repliedMessage && (
                  <div
                    className="replied-message"
                    onClick={() => scrollToMessage(repliedMessage.message_id)}
                  >
                    <div className="replied-message-header">Replied to:</div>
                    <div className="replied-message-content">
                      {repliedMessage.message ||
                        (repliedMessage.file &&
                          renderFile(
                            repliedMessage.file,
                            repliedMessage.message_id,
                            repliedMessage.thumbnail,
                            repliedMessage.is_download
                          )) ||
                        (repliedMessage.image && (
                          <img
                            src={`http://127.0.0.1:8000${repliedMessage.image}`}
                            alt="Replied Image"
                            className="replied-image-thumbnail"
                            style={{ maxHeight: "200px", maxWidth: "150px" }}
                          />
                        )) || <span>Original message was deleted</span>}
                    </div>
                  </div>
                )}
                {msg.Forward_to && <ForwardedMessage msg={msg} />}
                {msg.image &&
                  renderImage(msg.image, msg.message_id, msg.is_download)}
                {msg.file &&
                  renderFile(
                    msg.file,
                    msg.message_id,
                    msg.thumbnail,
                    msg.is_download
                  )}
                {/* {msg.message && <p>{msg.message}</p>} */}
                {msg.message && <p>{renderMessageContent(msg.message)}</p>}
              </div>
              {msg.message_id === maxreadMessageId && (
                <div className="receiver-avatar">
                  <div
                    className="avatar-circle"
                    style={{
                      backgroundColor: getAvatarColor(
                        userSelected?.avatar || "default-avatar"
                      ),
                      color: getInitialsColor(
                        userSelected?.group_id
                          ? msg.avatar
                          : userSelected?.avatar || "default-avatar"
                      ),
                    }}
                  >
                    {getInitials(
                      userSelected?.contact_first_name,
                      userSelected?.contact_last_name
                    )}
                  </div>
                </div>
              )}
              {msg.message_id !== maxreadMessageId &&
                renderAvatars(msg.message_id)}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {replyMessage && (
        <div className="reply-preview">
          <div className="reply-preview-message">
            <p>
              {replyMessage.message
                ? replyMessage.message
                : replyMessage.file
                ? replyMessage.file.split("/").pop()
                : replyMessage.image.split("/").pop()}
            </p>
          </div>
          <button
            onClick={() => setReplyMessage(null)}
            className="cancel-reply"
          >
            X
          </button>
        </div>
      )}

      <div className="chat-input-wrapper">
        <div className="emoji-picker-wrapper">
          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <input
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="fileUpload"
            ref={fileInputRef}
          />
          <button onClick={() => document.getElementById("fileUpload").click()}>
            <LuFileUp style={{ fontSize: "20px" }} />
          </button>
          <button onClick={toggleEmojiPicker}>😎</button>
          {isRecording ? (
            <button onClick={stopRecording}>Stop Recording</button>
          ) : (
            <button onClick={startRecording}>🎤</button>
          )}
          {audioBlob && (
            <button onClick={handleSendRecording}>Send Recording</button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  if (message !== originalMessage) {
                    handleUpdateMessage(selectedMessage?.message_id, message);
                  }
                  handleCancelEdit();
                }}
              >
                {message === originalMessage ? "X" : "Update"}
              </button>
            </>
          ) : (
            <button onClick={handleSendMessage}>Send</button>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.top, left: contextMenu.left }}
        >
          <div onClick={handleCopyMessage}>
            <FaRegCopy /> Copy
          </div>
          <div onClick={() => handleReply(selectedMessage)}>
            <LuReply /> Reply
          </div>
          <div onClick={handelopenForward}>
            <LuForward /> Forward
          </div>
          {selectedMessage.sender === user?.username && (
            <>
              <div onClick={handleEditMessage}>
                <CiEdit /> Edit
              </div>
              <div onClick={handleDeleteConfirm}>
                <MdDelete /> Delete
              </div>
            </>
          )}
        </div>
      )}
      <Modal
        isOpen={isForwardOpen}
        onRequestClose={handleClosePreview}
        contentLabel="Forward Preview"
        className="forward-modal"
        overlayClassName="preview-overlay"
      >
        <h3>Forward Message</h3>
        <div className="Type-message">
          <div className="container-forward">
            <div className="replied-message">
              <div className="forward-message-header">Forward Message:</div>
              <div className="replied-message-content">
                {selectedMessage?.message}
              </div>
            </div>
          </div>
          <div className="message-Container">
            <input
              type="text"
              className="message-type"
              value={forwardMessageContent}
              onChange={(e) => setForwardMessageContent(e.target.value)}
              placeholder="Type meassage here (Optional)"
            />
          </div>
        </div>
        <div className="forward-contacts-list">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="contact-item"
              onClick={() => setSelectedRecipient(contact)}
            >
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
              <span>
                {contact.contact_first_name} {contact.contact_last_name}
              </span>

              <button
                className="Forward-send-button"
                onClick={() => handleForwardMessage()}
              >
                Send
              </button>
            </div>
          ))}
        </div>
        <div className="btn-container">
          <button className="Done-button" onClick={handleClosePreview}>
            Done
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={showMembers}
        title="Group Members"
        onRequestClose={handleClosePreview}
        className="forward-modal"
        overlayClassName="preview-overlay"
      >
        <div>
          <h1 style={{ textAlign: "center" }}>{userSelected?.group_name}</h1>
          <h3>Members:</h3>
          <div className="group-member-list">
            {groupMembers.length > 0 ? (
              groupMembers.map((member) => (
                <div key={member.id} className="contact-ite">
                  <div
                    className="contact-avatar"
                    style={{
                      backgroundColor: getAvatarColor(member.avatar),
                      color: getInitialsColor(member.avatar),
                    }}
                  >
                    {getInitials(member.first_name, member.last_name)}
                  </div>
                  <span style={{ fontFamily: "cursive" }}>
                    {member.first_name} {member.last_name}{" "}
                    {member.id === user?.user_id && "(you)"}
                  </span>
                </div>
              ))
            ) : (
              <div>No members found</div>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isPreviewOpen}
        onRequestClose={handleClosePreview}
        contentLabel="File Preview"
        className="preview-modal"
        overlayClassName="preview-overlay"
      >
        <div className="preview">
          {["jpg", "jpeg", "png"].includes(previewType) && (
            <img
              src={previewContent}
              alt="Image Preview"
              className="preview-content"
            />
          )}
          {previewType === "mp4" && (
            <video controls className="preview-content">
              <source src={previewContent} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </Modal>
    </div>
  );
};
export default Chats;
