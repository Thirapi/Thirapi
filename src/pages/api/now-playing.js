import axios from 'axios';

let accessToken = '';
let expiresIn = 3600; // Default 1 hour
const refreshToken = 'AQDpNESTK-ZHC53Ma48twshu_GDQxhWpPFrZv5bAUuz6ZOCIQytnfmeYWAgjogt7jplFgFKCHQMl80rxI85zlq3g4ccSAL_YgthpsgoNHaYnZhCUZUj1IuPaGrNviMw7Cs0';
const clientId = '2676f25cf69141128b893bf3098af62a';
const clientSecret = 'f5bb445b86574b4ea866307a6a345d48';

const updateAccessToken = async () => {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    accessToken = response.data.access_token;
    expiresIn = response.data.expires_in;
  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
  }
};

const fetchNowPlaying = async () => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data && response.data.is_playing) {
      return {
        track: response.data.item,
        progress: response.data.progress_ms,
        duration: response.data.item.duration_ms,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching currently playing track:', error.response ? error.response.data : error.message);
    return null;
  }
};

export default async function handler(req, res) {
  // Refresh access token if needed
  if (!accessToken || expiresIn < 60) {
    await updateAccessToken();
  }

  const nowPlaying = await fetchNowPlaying();

  res.setHeader('Content-Type', 'image/svg+xml');

  if (!nowPlaying) {
    res.status(200).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" style="min-width: 380px;">
        <text x="10" y="50" font-size="16" fill="white">No track is currently playing</text>
      </svg>
    `);
    return;
  }

  const { track, progress, duration } = nowPlaying;

  const calculateProgress = () => {
    if (!track || duration === 0) return 0;
    return (progress / duration) * 100;
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  res.status(200).send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="380" height="150" >
      <!-- Album Image -->
      <image href="${track.album.images[0].url}" x="10" y="10" width="80" height="80" />

      <!-- Track Name -->
      <text x="100" y="30" font-size="16" font-weight="bold" fill="white">${track.name}</text>

      <!-- Artist Name -->
      <text x="100" y="55" font-size="12" fill="white">${track.artists.map((artist) => artist.name).join(', ')}</text>

      <!-- Album Name -->
      <text x="100" y="80" font-size="12" fill="white">${track.album.name}</text>

      <!-- Progress Bar -->
      <rect x="10" y="100" width="370" height="4" fill="gray" />
      <rect x="10" y="100" width="${calculateProgress()}%" height="4" fill="green" />

      <!-- Time -->
      <text x="10" y="126" font-size="12" fill="white">${formatTime(progress)} / ${formatTime(duration)}</text>
    </svg>
  `);
}
