import axios from 'axios';

let accessToken = '';
let expiresIn = 3600; 
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

const convertImageToBase64 = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:image/jpeg;base64,${imageBase64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error.message);
    return null;
  }
};

export default async function handler(req, res) {
  if (!accessToken || expiresIn < 60) {
    await updateAccessToken();
  }

  const nowPlaying = await fetchNowPlaying();

  res.setHeader('Content-Type', 'image/svg+xml');

  if (!nowPlaying) {
    res.status(200).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
        <text x="10" y="50" font-size="16" fill="white">No track is currently playing</text>
      </svg>
    `);
    return;
  }

  const track = nowPlaying.track;

  const imageUrl = track.album.images[0].url;

  const imageBase64 = await convertImageToBase64(imageUrl);

  if (!imageBase64) {
    res.status(200).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
        <text x="10" y="50" font-size="16" fill="white">Error loading album image</text>
      </svg>
    `);
    return;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="240">
      <foreignObject x="10" y="10" width="420" height="240">
        <style>
          .now-playing-container {
            position: relative;
            background-color:rgba(46, 47, 52, 0.37);
            border-radius: 10px;
            padding: 0 15px 10px 15px;
            width: 100%;
            max-width: 340px;
            font-family: Arial, sans-serif;
            color: white;
            display: flex;
            justify-content: center;
            flex-direction: column;
            margin: 0 auto;
            margin-bottom: 10px;
            overflow: hidden;
          }
          .now-playing-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('${imageBase64}');
            background-repeat: no-repeat;
            background-size: cover;
            background-position: center;
            filter: blur(10px); 
            z-index: -1;
          }

          .now-playing h4 {
            color: #a9a9a9;
            font-size: 12px;
            margin-bottom: 10px;
          }

          .track-info {
            display: flex;
            flex-direction: row;
            margin-bottom: 10px;
            margin-top: 15px;
          }

          .album-art {
            height: 80px;
            width: 80px;
            border-radius: 8px;
            margin-right: 15px;
            transition: transform 0.3s ease;
          }

          .album-art:hover {
            height: 80px;
            width: 80px;
            border-radius: 8px;
            margin-right: 15px;
            transform: scale(1.1);
          }

          a {
            text-decoration: none;
          }

          .track-details {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .track-details .track-name {
            margin: 0 0 5px 0;
            color: #fff;
            font-size: 16px;  
            font-weight: 900;
            transition: background-color 0.5s ease, color 0.3s ease;
          }

          .track-details .track-name:hover {
            margin: 0 0 5px 0;
            background-color:rgba(0, 0, 0, 0.25);
            color: #fff;
            font-size: 16px;  
            font-weight: 900;
          }

          .track-details .track-artist-album {
            margin: 5px 0;
            font-size: 14px;
            color:rgb(201, 201, 201);
            transition: background-color 0.5s ease, color 0.3s ease;
          }

          .track-details .track-artist-album:hover {
            margin: 5px 0;
            background-color:rgba(0, 0, 0, 0.25);
            font-size: 14px;
            color:rgb(201, 201, 201);
          }

          .time-progress-container {
            width: 100%;
          }

          .progress-bar {
            width: 100%;
            height: 4px;
            // background-color: #40444b;
            border-radius: 2px;
            margin-top: 4px;
            margin-bottom: 10px;
            position: relative;
          }

          .progress {
            height: 100%;
            background-color: #1db954;
            border-radius: 2px;
            transition: width 0.5s;
          }

          .time-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #b3b3b3;
            margin-top: 5px;
          }

          #bars {
            width: 40px;
            height: 30px;
            bottom: 23px;
            position: absolute;
            margin: 20px 0 0 0px;
          }

          .bar {
              width: 3px;                    
              height: 3px;                    
              position: absolute;             
              background: linear-gradient(0deg, #D9AFD9 0%, #97D9E1 100%);
              animation: sound 0ms -800ms linear infinite alternate;  
          }

          @keyframes sound {
              0% {
                  height: 3px;
                  opacity: .35;
              }
              100% {
                  height: 15px;
                  opacity: 0.95;
              }
          }

          .bar:nth-child(1)  { left: 1px; animation-duration: 1320ms; }
          .bar:nth-child(2)  { left: 5px; animation-duration: 1213ms; }
          .bar:nth-child(3)  { left: 9px; animation-duration: 1336ms; }
          .bar:nth-child(4)  { left: 13px; animation-duration: 1122ms; }
          .bar:nth-child(5)  { left: 17px; animation-duration: 1100ms; }
          .bar:nth-child(6)  { left: 21px; animation-duration: 1016ms; }
          .bar:nth-child(7)  { left: 25px; animation-duration: 1247ms; }
          .bar:nth-child(8)  { left: 29px; animation-duration: 1214ms; }
          .bar:nth-child(9)  { left: 33px; animation-duration: 1221ms; }
          .bar:nth-child(10) { left: 37px; animation-duration: 1036ms; }
          .bar:nth-child(11) { left: 41px; animation-duration: 1129ms; }
          .bar:nth-child(12) { left: 45px; animation-duration: 1029ms; }
            .bar:nth-child(13) { left: 49px; animation-duration: 1340ms; }
            .bar:nth-child(14) { left: 53px; animation-duration: 1130ms; }
            .bar:nth-child(15) { left: 57px; animation-duration: 1040ms; }
            .bar:nth-child(16) { left: 61px; animation-duration: 1220ms; }
            .bar:nth-child(17) { left: 65px; animation-duration: 1330ms; }
            .bar:nth-child(18) { left: 69px; animation-duration: 1110ms; }
            .bar:nth-child(19) { left: 73px; animation-duration: 1010ms; }
            .bar:nth-child(20) { left: 77px; animation-duration: 1240ms; }
            .bar:nth-child(21) { left: 81px; animation-duration: 1210ms; }
            .bar:nth-child(22) { left: 85px; animation-duration: 1230ms; }
            .bar:nth-child(23) { left: 89px; animation-duration: 1030ms; }
            .bar:nth-child(24) { left: 93px; animation-duration: 1130ms; }
            .bar:nth-child(25) { left: 97px; animation-duration: 1020ms; }
            .bar:nth-child(26) { left: 101px; animation-duration: 1340ms; }
            .bar:nth-child(27) { left: 105px; animation-duration: 1140ms; }
            .bar:nth-child(28) { left: 109px; animation-duration: 1040ms; }
            .bar:nth-child(29) { left: 113px; animation-duration: 1220ms; }
            .bar:nth-child(30) { left: 117px; animation-duration: 1330ms; }
            .bar:nth-child(31) { left: 121px; animation-duration: 1110ms; }
            .bar:nth-child(32) { left: 125px; animation-duration: 1010ms; }
            .bar:nth-child(33) { left: 129px; animation-duration: 1240ms; }
            .bar:nth-child(34) { left: 133px; animation-duration: 1210ms; }
            .bar:nth-child(35) { left: 137px; animation-duration: 1230ms; }
            .bar:nth-child(36) { left: 141px; animation-duration: 1030ms; }
            .bar:nth-child(37) { left: 145px; animation-duration: 1130ms; }
            .bar:nth-child(38) { left: 149px; animation-duration: 1020ms; }
            .bar:nth-child(39) { left: 153px; animation-duration: 1340ms; }
            .bar:nth-child(40) { left: 157px; animation-duration: 1140ms; }
            .bar:nth-child(41) { left: 161px; animation-duration: 1040ms; }
            .bar:nth-child(42) { left: 165px; animation-duration: 1220ms; }
            .bar:nth-child(43) { left: 169px; animation-duration: 1330ms; }
            .bar:nth-child(44) { left: 173px; animation-duration: 1110ms; }
            .bar:nth-child(45) { left: 177px; animation-duration: 1010ms; }
            .bar:nth-child(46) { left: 181px; animation-duration: 1240ms; }
            .bar:nth-child(47) { left: 185px; animation-duration: 1210ms; }
            .bar:nth-child(48) { left: 189px; animation-duration: 1230ms; }
            .bar:nth-child(49) { left: 193px; animation-duration: 1030ms; }
            .bar:nth-child(50) { left: 197px; animation-duration: 1130ms; }
            .bar:nth-child(51) { left: 201px; animation-duration: 1020ms; }
            .bar:nth-child(52) { left: 205px; animation-duration: 1340ms; }
            .bar:nth-child(53) { left: 209px; animation-duration: 1140ms; }
            .bar:nth-child(54) { left: 213px; animation-duration: 1040ms; }
            .bar:nth-child(55) { left: 217px; animation-duration: 1220ms; }
            .bar:nth-child(56) { left: 221px; animation-duration: 1330ms; }
            .bar:nth-child(57) { left: 225px; animation-duration: 1110ms; }
            .bar:nth-child(58) { left: 229px; animation-duration: 1010ms; }
            .bar:nth-child(59) { left: 233px; animation-duration: 1240ms; }
            .bar:nth-child(60) { left: 237px; animation-duration: 1210ms; }
            .bar:nth-child(61) { left: 241px; animation-duration: 1230ms; }
            .bar:nth-child(62) { left: 245px; animation-duration: 1030ms; }
            .bar:nth-child(63) { left: 249px; animation-duration: 1130ms; }
            .bar:nth-child(64) { left: 253px; animation-duration: 1020ms; }
            .bar:nth-child(65) { left: 257px; animation-duration: 1340ms; }
            .bar:nth-child(66) { left: 261px; animation-duration: 1140ms; }
            .bar:nth-child(67) { left: 265px; animation-duration: 1040ms; }
            .bar:nth-child(68) { left: 269px; animation-duration: 1220ms; }
            .bar:nth-child(69) { left: 273px; animation-duration: 1330ms; }
            .bar:nth-child(70) { left: 277px; animation-duration: 1110ms; }
            .bar:nth-child(71) { left: 281px; animation-duration: 1010ms; }
            .bar:nth-child(72) { left: 285px; animation-duration: 1240ms; }
            .bar:nth-child(73) { left: 289px; animation-duration: 1210ms; }
            .bar:nth-child(74) { left: 293px; animation-duration: 1230ms; }
            .bar:nth-child(75) { left: 297px; animation-duration: 1030ms; }
            .bar:nth-child(76) { left: 301px; animation-duration: 1130ms; }
            .bar:nth-child(77) { left: 305px; animation-duration: 1020ms; }
            .bar:nth-child(78) { left: 309px; animation-duration: 1340ms; }
            .bar:nth-child(79) { left: 313px; animation-duration: 1140ms; }
            .bar:nth-child(80) { left: 317px; animation-duration: 1040ms; }
            .bar:nth-child(81) { left: 321px; animation-duration: 1220ms; }
            .bar:nth-child(82) { left: 325px; animation-duration: 1330ms; }
            .bar:nth-child(83) { left: 329px; animation-duration: 1110ms; }
            .bar:nth-child(84) { left: 333px; animation-duration: 1010ms; }
        </style>
        <div xmlns="http://www.w3.org/1999/xhtml" class="now-playing-container">
          <div class="track-info">
            <a href="${track.external_urls.spotify}" target="_blank" rel="noopener noreferrer">
              <img src="${imageBase64}" alt="${track.name}" class="album-art" />
            </a>
            <div class="track-details">
            <a href="${track.external_urls.spotify}" target="_blank" rel="noopener noreferrer">
              <div class="track-name">${track.name}</div>
            </a>
            <a href="${track.artists[0].external_urls.spotify}" target="_blank" rel="noopener noreferrer">
              <div class="track-artist-album">${track.artists.map(artist => artist.name).join(', ')}</div>
            </a>
            <a href="${track.album.external_urls.spotify}" target="_blank" rel="noopener noreferrer">
              <div class="track-artist-album">${track.album.name}</div>
            </a>
            </div>
          </div>
          <div class="time-progress-container">
            <div class="progress-bar">
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
              <div class='bar'></div>
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  `;

  res.status(200).send(svgContent);
}
