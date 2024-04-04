import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'; 
import { useParams, Link } from 'react-router-dom'; 
import io from 'socket.io-client'; 
import '@fortawesome/fontawesome-free/css/all.min.css'; 
import './Chat.css'; 

const socket = io('https://rapidaidnetwork-backend.onrender.com', { transports: ['websocket'] }); 

const NavBar = ({ profilePic, currentUserEmail, roomDetails }) => {
  // Determine the username based on currentUserEmail and roomDetails
  let username = currentUserEmail === roomDetails.user1 ? roomDetails.userName2 : roomDetails.userName1;
  console.log({username})
  if(username)
  username=JSON.parse(username)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/messages"  style={{ fontSize: '20px', color: '#333'  }}>
          <i className="fas fa-arrow-left" style={{color: 'white'}} id='ico'></i>
        </Link>
        {profilePic && 
          <img
            src={`https://rapidaidnetwork-backend.onrender.com/${profilePic.replace(/\\/g, '/')}`}
            alt="Profile"
            style={{ width: '40px', height: '40px', borderRadius: '50%',marginleft:'5vh',marginBottom:'1vh' }} // Make it circular
          />
        }
        
        <span style={{ marginLeft: '10px', color: 'white' , fontSize: '2vh',marginBottom: '1vh' }}>{username}</span>
      </div>
    </div>
  );
};

const Chat = () => { 
  const messagesContainerRef = useRef(null);
  const { roomId } = useParams(); 
  const [messages, setMessages] = useState([]); 
  const [newMessage, setNewMessage] = useState(''); 
  const [roomDetails, setRoomDetails] = useState({}); 
  const currentUserEmail = localStorage.getItem('userEmail'); 
  const currentUserName = localStorage.getItem('userName'); 
  const [userProfile, setUserProfile] = useState(null);

const fetchProfilePic = useCallback(async (email) => {
  try {
    const response = await axios.get('https://rapidaidnetwork-backend.onrender.com/image', {
      params: { userEmail: email },
    });
    const data = response.data;
    setUserProfile(data);
    console.log(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
}, []);

const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    handleSendMessage();
    e.preventDefault();
  }
};

useEffect(() => {
  if (roomDetails.user1 && roomDetails.user2) {
    if (currentUserEmail === roomDetails.user1) {
      fetchProfilePic(JSON.parse(roomDetails.user2));
    } else {
      fetchProfilePic(JSON.parse(roomDetails.user1));
    }
  }
}, [currentUserEmail, fetchProfilePic, roomDetails]);

  useEffect(() => { 
    const fetchMessages = async () => { 
      try { 
        const response = await axios.get(`https://rapidaidnetwork-backend.onrender.com/messages/${roomId}`); 
        setMessages(response.data); 
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      } catch (error) { 
        console.error('Error fetching messages:', error.message); 
      } 
    }; 

    const fetchRoomDetails = async () => { 
      try { 
        const response = await axios.get(`https://rapidaidnetwork-backend.onrender.com/room/${roomId}`); 
        setRoomDetails(response.data); 
      } catch (error) { 
        console.error('Error fetching room details:', error.message); 
      } 
    }; 

    fetchMessages(); 
    fetchRoomDetails(); 

    socket.on('message', (newMessage) => { 
      setMessages((prevMessages) => [...prevMessages, newMessage]); 
    }); 

    return () => { 
      socket.off('message'); 
    }; 
  }, [roomId]); 

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => { 
    if (roomDetails.user1 && roomDetails.user2) { 
      socket.emit('sendMessage', { 
        roomId: roomId, 
        sender: currentUserEmail, 
        senderName: currentUserName, 
        text: newMessage 
      }); 
      setNewMessage(''); 
    } else { 
      console.error('Users not set.'); 
    } 
  }; 

  return ( 
    <div className="chat-container"> 
       <NavBar profilePic={userProfile} currentUserEmail={currentUserEmail} roomDetails={roomDetails} />
      <div className="messages-container" ref={messagesContainerRef}> 
        {messages.map((message) => ( 
          <div key={message._id} className={`message ${ message.sender === currentUserEmail ? 'sent' : 'received' }`} > 
          
            <div className='texty'>{message.text}</div> 
            <span className="message-time"> 
              {new Date(message.createdAt).toLocaleTimeString(undefined,{ hour: 'numeric', minute: 'numeric', hour12: true, })} 
            </span> 
          </div> 
        ))} 
      </div> 
      <div className="input-container"> 
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..."
        onKeyDown={handleKeyDown} /> 
        <button onClick={handleSendMessage}> 
          <i className="fas fa-paper-plane"></i> 
        </button> 
      </div> 
    </div> 
  ); 
}; 

export default Chat;
