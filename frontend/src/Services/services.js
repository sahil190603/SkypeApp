import axios from "axios";

export const BASE_URL = "http://127.0.0.1:8000/";

export const fetchAllContacts_by_user = async (userId) => {
  const response = await axios.get(
    `${BASE_URL}contact/Contact/user/${userId}/`
  );
  return response.data;
};

export const updateUser = async (userId) => {
  const response = await axios.put(`${BASE_URL}auth/Users/${userId}/`);
  return response.data;
};

export const addContact = async (ContactAdd) => {
  const response = await axios.post(`${BASE_URL}contact/Contact/`, ContactAdd);
  return response.data;
};

export const get_user_by_username = async (username) => {
  const response = await axios.get(
    `${BASE_URL}auth/Users/username/${username}/`
  );
  return response.data;
};

export const delete_connection = async (connection_id) => {
  const response = await axios.delete(
    `${BASE_URL}contact/Contact/${connection_id}/`
  );
  return response.data;
};

export const Fetch_Chatlisting = async (userId) => {
  const response = await axios.get(
    `${BASE_URL}message/Message/user/${userId}/`
  );
  return response.data;
};

export const Fetch_chat_by_user_and_reciver = async (userId, reciverId) => {
  const response = await axios.get(
    `${BASE_URL}message/Message/user/${userId}/reciver/${reciverId}/`
  );
  return response.data;
};


export const put_is_read_chat_by_reciver_as_user = async (reciverId ,userId) =>{
  const response = await axios.get(
    `${BASE_URL}message/Message/sender/${reciverId}/reciver/${userId}/`
  );
  return response.data;
}

export const put_is_read_in_message_of_Group = async (groupName, userId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}message/GMessage/group_seen/${groupName}/?user_id=${userId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error in put_is_read_in_message_of_Group:", error);
    throw error; 
  }
};

export const get_max_read_message_id_by_reciver = async (userId ,reciverId ) =>
{
  const response = await axios.get(`${BASE_URL}message/Message/max-read-id/send_by/${userId}/seen_by/${reciverId}/`);
  return response.data;
}

export const For_ward_message = async (user_id, selcted_User, content, message_id) =>{
  const response = await axios.post(`${BASE_URL}message/Message/`, {
    sender: user_id,
    recipient:selcted_User,
    content: content,
    Forward_to:message_id
  })
  return response.data;
}

export const get_message_by_message_id = async (message_id) =>{
  const response = await axios.get(`${BASE_URL}message/Message/msg/${message_id}/`)
  return response.data;
}  

export const get_all_messages_for_group = async(group_name) =>{
  const response = await axios.get(`${BASE_URL}message/GMessage/group/${group_name}/`)
  return response.data;
}

export const get_all_group_users_last_message_seen = async(group_name, userID)=>{
  const response = await axios.get(`${BASE_URL}message/GMessage/max_seen/${group_name}/?user_id=${userID}`)
  return response.data;
}

export const create_Group = async(Group_name , Description ,userId ,members) =>{
  const response = await axios.post(`${BASE_URL}contact/Groups/` , {
    name: Group_name,
    Description: Description,
    created_by: userId,
    members:members
  })
  return response.data;
}

export const send_message = async(sender , Group_name ) =>{
  const response = await axios.post(`${BASE_URL}message/GMessage/`,{
    sender : sender,
    group  : Group_name,
    content : 'Hello',
    is_read_by : [sender],
  })
  return response.data;
  }


// For search Component...

const getApiEndpoint = (sender, query, option) => {
  switch (option) {
    case 'Messages':
      if (query === null) {
        return `${BASE_URL}message/Message/user/${sender}/`;
      }
      return `${BASE_URL}message/Message/Message&GMessage/search-messages/?user=${sender}&query=${query}`;
      
    case 'People':
      if (query === null) {
        return `${BASE_URL}message/Message/unique/${sender}/`;
      }
      return `${BASE_URL}message/Message/unique/4/?username=${query}`;
      
    case 'Groups':
      if (query === null) {
        return `${BASE_URL}message/GMessage/latest-messages/${sender}/`;
      }
      return `${BASE_URL}message/Message/latest_groupname/${sender}/${query}/`;
      
    default:
      throw new Error('Invalid option');
  }
};

export const search_message = async (sender, query, option) => {
  try {
    const endpoint = getApiEndpoint(sender, query, option);
    const response = await axios.get(endpoint);
    
    switch (option) {
      case 'Messages':
        return response.data;
        
      case 'People':
        return response.data.messages;
        
      case 'Groups':
        return response.data.latest_messages;
        
      default:
        throw new Error('Invalid option');
    }
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw error;  
  }
};

//Fetch all group member data by group_name

export const get_group_member_by_group_name = async (groupname) =>{
  const response = await axios.get(`${BASE_URL}contact/Groups/Group_usersname/${groupname}/`)
  return response.data;
}


export const add_profile = async (userID, formData) => {
  debugger
  const response = await axios.put(`${BASE_URL}auth/Users/${userID}/`,formData)
  return response.data;
}


// export const logout = async (JWT_TOKEN) => {
//   debugger
//   try {
//     const response = await axios.post(
//       `${BASE_URL}auth/logout/`,
//       {},
//       {
//         headers: {
//           'Authorization': `Bearer ${JWT_TOKEN}`, 
//         },
//       }
//     );

//     // Handle response
//     if (response.status === 200) {
//       console.log('Logout successful');
//       // Additional logic after successful logout
//     } else {
//       console.log('Logout failed', response.data);
//       // Handle different response statuses if necessary
//     }
//   } catch (error) {
//     console.error('Error during logout:', error);
//     // Handle errors (e.g., network issues)
//   }
// };