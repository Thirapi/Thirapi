import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Buat context untuk Spotify
const SpotifyContext = createContext();

const SpotifyProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken] = useState('AQDpNESTK-ZHC53Ma48twshu_GDQxhWpPFrZv5bAUuz6ZOCIQytnfmeYWAgjogt7jplFgFKCHQMl80rxI85zlq3g4ccSAL_YgthpsgoNHaYnZhCUZUj1IuPaGrNviMw7Cs0');
  const [expiresIn, setExpiresIn] = useState(3600); // Default 1 hour

  const updateAccessToken = async () => {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Authorization': `Basic ${btoa('2676f25cf69141128b893bf3098af62a:f5bb445b86574b4ea866307a6a345d48')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      setAccessToken(response.data.access_token);
      setExpiresIn(response.data.expires_in);
    } catch (error) {
      console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    updateAccessToken(); // Call once on mount

    // Set up an interval to refresh token before it expires
    const interval = setInterval(() => {
      updateAccessToken();
    }, (expiresIn - 60) * 1000); // Refresh 1 minute before expiration

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  return (
    <SpotifyContext.Provider value={{ accessToken }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export { SpotifyContext, SpotifyProvider };
