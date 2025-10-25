import { useState } from 'react';

const songs = {
  easy: [
    { id: 'better-off-alone', artist: 'Alice Deejay', title: 'Better Off Alone', available: true },
    { id: 'trans-europe-express', artist: 'Kraftwerk', title: 'Trans-Europe Express', available: false },
    { id: 'cars', artist: 'Gary Numan', title: 'Cars', available: false },
    { id: 'electricity', artist: 'OMD', title: 'Electricity', available: false },
    { id: 'sleepwalk', artist: 'Ultravox', title: 'Sleepwalk', available: false },
    { id: 'homosapien', artist: 'Pete Shelley', title: 'Homosapien', available: false },
    { id: 'europa-pirate-twins', artist: 'Thomas Dolby', title: 'Europa and the Pirate Twins', available: false },
    { id: 'tainted-love', artist: 'Soft Cell', title: 'Tainted Love', available: false },
    { id: 'dont-you-want-me', artist: 'Human League', title: "Don't You Want Me", available: false },
    { id: 'homeless-club-kids', artist: 'My Favorite', title: 'Homeless Club Kids', available: false },
    { id: 'romantic-me', artist: 'Polyrock', title: 'Romantic Me', available: false },
    { id: 'enjoy-the-silence', artist: 'Depeche Mode', title: 'Enjoy the Silence', available: false },
    { id: 'blue-monday', artist: 'New Order', title: 'Blue Monday', available: false },
    { id: 'cant-get-you-out', artist: 'Kylie Minogue', title: "Can't Get You Out of My Head", available: false },
    { id: 'straight-lines', artist: 'New Musik', title: 'Straight Lines', available: false },
    { id: 'beautiful-world', artist: 'Devo', title: 'Beautiful World', available: false },
    { id: 'its-my-life', artist: 'Talk Talk', title: "It's My Life", available: false }
  ],
  medium: [
    { id: 'change', artist: 'Tears for Fears', title: 'Change', available: false },
    { id: 'i-feel-love', artist: 'Donna Summer', title: 'I Feel Love', available: false },
    { id: 'quiet-men', artist: 'Ultravox', title: 'Quiet Men', available: false },
    { id: 'acceleration', artist: 'Bill Nelson', title: 'Acceleration', available: false },
    { id: 'enola-gay', artist: 'OMD', title: 'Enola Gay', available: false },
    { id: 'candy-cane-carriage', artist: 'Joy Electric', title: 'Candy Cane Carriage', available: false },
    { id: '88-lines', artist: 'The Nails', title: '88 Lines About 44 Women', available: false },
    { id: 'nobodys-diary', artist: 'Yaz', title: "Nobody's Diary", available: false },
    { id: 'wishing', artist: 'A Flock of Seagulls', title: 'Wishing', available: false },
    { id: 'no-one-driving', artist: 'John Foxx', title: 'No one Driving', available: false },
    { id: 'one-submarines', artist: 'Thomas Dolby', title: 'One of Our Submarines', available: false },
    { id: 'just-cant-get-enough', artist: 'Depeche Mode', title: "Just Can't Get Enough", available: false },
    { id: 'harsh-distractions', artist: 'Beautiful Skin', title: 'Harsh Distractions', available: false },
    { id: 'souvenir', artist: 'OMD', title: 'Souvenir', available: false },
    { id: 'snowball', artist: 'Devo', title: 'Snowball', available: false },
    { id: 'love-is-stranger', artist: 'Eurythmics', title: 'Love Is A Stranger', available: false },
    { id: 'vienna', artist: 'Ultravox', title: 'Vienna', available: false },
    { id: 'but-not-tonight', artist: 'Depeche Mode', title: 'But Not Tonight', available: false },
    { id: 'worked-up-sexual', artist: 'The Faint', title: 'Worked Up So Sexual', available: false },
    { id: 'marbeleyezed', artist: 'Soviet', title: 'Marbeleyezed', available: false },
    { id: 'suburbia', artist: 'Pet Shop Boys', title: 'Suburbia', available: false },
    { id: 'telephone-operator', artist: 'Pete Shelley', title: 'Telephone Operator', available: false }
  ],
  hard: [
    { id: 'playgirl', artist: 'Ladytron', title: 'Playgirl', available: false },
    { id: 'are-friends-electric', artist: 'Gary Numan', title: 'Are Friends Electric?', available: false },
    { id: 'number-one', artist: 'Goldfrapp', title: 'Number One', available: false },
    { id: 'real-adventure', artist: 'Bill Nelson', title: 'The Real Adventure', available: false },
    { id: 'europe-endless', artist: 'Kraftwerk', title: 'Europe Endless', available: false },
    { id: 'warm-leatherette', artist: 'The Normal', title: 'Warm Leatherette', available: false },
    { id: 'sex-dwarf', artist: 'Soft Cell', title: 'Sex Dwarf', available: false },
    { id: 'your-silent-face', artist: 'New Order', title: 'Your Silent Face', available: false },
    { id: 'pale-shelter', artist: 'Tears for Fears', title: 'Pale Shelter', available: false },
    { id: 'world-of-water', artist: 'New Musik', title: 'This World of Water', available: false },
    { id: 'da-da-da', artist: 'Trio', title: "Da Da Da I Don't Love You You Don't Love Me", available: false },
    { id: 'promised-miracle', artist: 'Simple Minds', title: 'Promised You a Miracle', available: false },
    { id: 'delirious', artist: 'Prince', title: 'Delirious', available: false },
    { id: 'fade-to-grey', artist: 'Visage', title: 'Fade to Grey', available: false }
  ]
};

export function SongBank({ onSelectSong }) {
  const [expandedDifficulty, setExpandedDifficulty] = useState('easy');
  const [selectedSong, setSelectedSong] = useState(null);

  const difficultyColors = {
    easy: { bg: '#4CAF50', hover: '#45a049' },
    medium: { bg: '#FF9800', hover: '#e68900' },
    hard: { bg: '#f44336', hover: '#da190b' }
  };

  return (
    <>
      {/* Level Selection Modal */}
      {selectedSong && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            border: '2px solid #4CAF50',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              color: '#fff',
              fontSize: '24px',
              textAlign: 'center'
            }}>
              {selectedSong.title}
            </h2>
            <p style={{
              margin: '0 0 24px 0',
              color: '#aaa',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              by {selectedSong.artist}
            </p>

            <p style={{
              margin: '0 0 24px 0',
              color: '#ddd',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              Choose your learning level:
            </p>

            {/* Level 1 Button */}
            <button
              onClick={() => {
                onSelectSong(selectedSong, 1);
                setSelectedSong(null);
              }}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: 12,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              <div style={{ marginBottom: 4 }}>🎓 Level 1: Guided Tutorial</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Step-by-step guide to building the synth
              </div>
            </button>

            {/* Level 2 Button */}
            <button
              onClick={() => {
                onSelectSong(selectedSong, 2);
                setSelectedSong(null);
              }}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: 12,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              <div style={{ marginBottom: 4 }}>🎯 Level 2: Challenge Mode</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Connect & tune pre-placed nodes yourself
              </div>
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => setSelectedSong(null)}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'transparent',
                color: '#aaa',
                border: '1px solid #666',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.borderColor = '#fff'}
              onMouseOut={(e) => e.target.style.borderColor = '#666'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Song Bank Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '300px',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderLeft: '2px solid #4CAF50',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: '2px solid #4CAF50'
      }}>
        <h2 style={{
          margin: 0,
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          🎵 Song Bank
        </h2>
        <p style={{
          margin: '8px 0 0 0',
          color: '#ddd',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Learn to recreate classic synth sounds
        </p>
      </div>

      {/* Song List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {Object.entries(songs).map(([difficulty, songList]) => (
          <div key={difficulty} style={{ marginBottom: '16px' }}>
            {/* Difficulty Header */}
            <button
              onClick={() => setExpandedDifficulty(expandedDifficulty === difficulty ? null : difficulty)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: difficultyColors[difficulty].bg,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: expandedDifficulty === difficulty ? 8 : 0,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = difficultyColors[difficulty].hover}
              onMouseOut={(e) => e.target.style.background = difficultyColors[difficulty].bg}
            >
              <span>{difficulty.toUpperCase()} ({songList.length})</span>
              <span>{expandedDifficulty === difficulty ? '▼' : '▶'}</span>
            </button>

            {/* Song List */}
            {expandedDifficulty === difficulty && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                {songList.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => song.available && setSelectedSong(song)}
                    disabled={!song.available}
                    style={{
                      padding: '10px 12px',
                      background: song.available ? '#2a2a3e' : '#1a1a2e',
                      color: song.available ? '#fff' : '#666',
                      border: song.available ? '1px solid #4CAF50' : '1px solid #333',
                      borderRadius: 6,
                      cursor: song.available ? 'pointer' : 'not-allowed',
                      textAlign: 'left',
                      fontSize: '12px',
                      opacity: song.available ? 1 : 0.5,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (song.available) {
                        e.target.style.background = '#3a3a4e';
                        e.target.style.borderColor = '#4CAF50';
                        e.target.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (song.available) {
                        e.target.style.background = '#2a2a3e';
                        e.target.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 2 }}>
                      {song.available ? '🎓 ' : '🔒 '}{song.title}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      {song.artist}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
