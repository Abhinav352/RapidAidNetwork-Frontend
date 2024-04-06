import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Loc.css';
import { useNavigate } from 'react-router-dom';
import ImageSlider from './ImageSlider';

const Location = () => {
  const [userLocation, setUserLocation] = useState({ latitude: '', longitude: '' });
  const [disasterData, setDisasterData] = useState([]);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [userInDisasterArea, setUserInDisasterArea] = useState(false);
  const [checkedornot, setcheckedornot,] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserLocation({ ...userLocation, [name]: value });
  };

  const fetchAccessToken = async () => {
    try {
      const response = await axios.post('https://keycloak01.kontur.io/auth/realms/kontur/protocol/openid-connect/token', new URLSearchParams({
        client_id: 'kontur_platform',
        username: 'abhinav0298@gmail.com',
        password: '0096491UE5nlInx1M5',
        grant_type: 'password',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token } = response.data;
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
    } catch (error) {
      console.error('Error fetching access token:', error.message);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await axios.post('https://keycloak01.kontur.io/auth/realms/kontur/protocol/openid-connect/token', new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token } = response.data;
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
    } catch (error) {
      console.error('Error refreshing access token:', error.message);
      // If the refresh token is invalid or expired, fetch a new access token
      fetchAccessToken();
    }
  };

  const handleFetchData = async () => {
    try {
      const response = await axios.get(`https://rapidaidnetwork-backend.onrender.com/Location/${accessToken}`);
      setDisasterData(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching Data:', error.message);
    }
  };

  useEffect(() => {
    // Fetch access token when the component mounts
    fetchAccessToken();

    // Set up a timer to refresh the access token before it expires
    const intervalId = setInterval(() => {
      refreshAccessToken();
    }, 172800000); // Refresh every 2 days (2 * 24 * 60 * 60 * 1000 milliseconds)

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Fetch data when the access token changes
    if (accessToken) {
      handleFetchData();
    }
  }, [accessToken]);

  const checkIfUserInAnyDisasterArea = async () => {
  setcheckedornot(true);
    const { latitude, longitude } = userLocation;

    for (const event of disasterData) {
      const bbox = event.bbox;
      const userInCurrentDisasterArea = isPointInBoundingBox(latitude, longitude, bbox);

      if (userInCurrentDisasterArea) {
        console.log(`User is in the disaster area of ${event.location}`);
        console.log(userLocation);

        try {
          // Make a POST request to the backend endpoint
          await axios.post('https://rapidaidnetwork-backend.onrender.com/emergency', {
            latitude,
            longitude
          });

          console.log('Request submitted successfully');
        } catch (error) {
          console.error('Error submitting request:', error.message);
        }
        // Handle the case where the user is in a disaster area
        userInAnyDisasterArea = true;

         break;
      }
    }
    console.log('User is not in any of the disaster areas.');
    console.log(userLocation);
    console.log(disasterData)
    // Continue with your application logic
  };

  const isPointInBoundingBox = (lat, lon, bbox) => {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude: latitude.toString(), longitude: longitude.toString() });
        },
        (error) => {
          console.error('Error getting current location:', error.message);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  useEffect(() => {
    // Trigger disaster check when userLocation changes
    if (userLocation.latitude && userLocation.longitude) {
      checkIfUserInAnyDisasterArea();
    }
  }, [userLocation]);


  return (
    <>
    <div className='whole'>
      <div className="sos-container">
        {/* <div className="outer-circle"></div>
          <div className="inner-circle"></div> */}
            {/* <button
            className="sos-button"
            onClick={() => {
            getCurrentLocation();
            }} 
            >
            <span>
            SOS
            </span>
            </button> */}
            <button onClick={()=>
            {
              navigate('/chat/b03c0dc7-8adf-40d7-b61e-35fbda203c40')
            }}>Chat</button>
             <button onClick={()=>
            {
              navigate('/Login')
            }}>Login</button>
      </div>
      <ImageSlider/>
    </div>
        </>
    
  );
};

export default Location;
