const SOCKET_URL = "ws://localhost:8000/ws/Message/";

let chatSocket = null;

export const connectPrivateChat = (user1, user2, onMessageReceived) => {
  const [sortedUser1, sortedUser2] = [user1, user2].sort();

  chatSocket = new WebSocket(`${SOCKET_URL}${sortedUser1}/${sortedUser2}/`);

  chatSocket.onopen = () => {
    console.log(`WebSocket connected for: ${sortedUser1}-${sortedUser2}`);
  };

  chatSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Message received:", data);
    onMessageReceived(data);
  };

  chatSocket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  chatSocket.onclose = () => {
    console.log(
      `WebSocket connection closed for: ${sortedUser1}-${sortedUser2}`
    );
  };

  return chatSocket;
};

export const sendMessage = (user1, user2, message, sender, file, image, reply, groupId = null, group_name = null) => {
  debugger
  if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
    const reader = new FileReader();

    const basePayload = {
      sender: sender,
      message: message,
      reply_to: reply,
    };

    if (groupId) {
      basePayload.group_id = groupId;
      basePayload.group_name = group_name;
    } else {
      basePayload.receiver = user2;
    }

    if (image) {
      reader.onloadend = () => {
        const base64File = reader.result.split(",")[1];
        const payload = {
          ...basePayload,
          image: {
            base64: base64File,
            name: image.name,
            type: image.type,
            size: image.size,
          },
        };
        chatSocket.send(JSON.stringify(payload));
        console.log('chatsocket', payload);
      };
      reader.readAsDataURL(image);
    } else if (file) {
      reader.onloadend = () => {
        const base64File = reader.result.split(",")[1];
        const payload = {
          ...basePayload,
          file: {
            base64: base64File,
            name: file.name,
            type: file.type,
            size: file.size,
          },
        };
        chatSocket.send(JSON.stringify(payload));
      };
      reader.readAsDataURL(file);
    } else {
      chatSocket.send(JSON.stringify(basePayload));
    }
  } else {
    console.error("WebSocket is not open.");
  }
};



export const handleFileDownload = (messageId,group_id) => {
  debugger
  if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
    const payload = JSON.stringify({
      action: "download",
      message_id: messageId,
      group_id : group_id,
    });

    chatSocket.send(payload);
  } else {
    console.error(`WebSocket is not connected.`);
  }
};

export const disconnectWebSocket = (socket) => {
  if (socket) {
    socket.close();
    console.log("WebSocket disconnected");
  }
};
