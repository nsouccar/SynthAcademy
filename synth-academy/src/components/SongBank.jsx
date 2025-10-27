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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const difficultyColors = {
    easy: { bg: '#4CAF50', hover: '#45a049' },
    medium: { bg: '#FF9800', hover: '#e68900' },
    hard: { bg: '#f44336', hover: '#da190b' }
  };

  return (
    <>
      {/* StarCrush Font */}
      <style>{`
        @font-face {
          font-family: 'StarCrush';
          src: url('/Star Crush.ttf') format('truetype');
        }
      `}</style>


      {/* Collapse/Expand Tab - iPod Chrome Style */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'fixed',
          right: isCollapsed ? 0 : '320px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '120px',
          background: 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%)',
          border: '2px solid #b0b0b0',
          borderRight: isCollapsed ? 'none' : '2px solid #b0b0b0',
          borderLeft: isCollapsed ? '2px solid #b0b0b0' : 'none',
          borderRadius: isCollapsed ? '8px 0 0 8px' : '0 8px 8px 0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '16px',
          color: '#333',
          zIndex: 1001,
          transition: 'all 0.3s ease-in-out',
          boxShadow: isCollapsed
            ? '-4px 0 12px rgba(0,0,0,0.3), inset 1px 0 0 rgba(255,255,255,0.8)'
            : '4px 0 12px rgba(0,0,0,0.3), inset -1px 0 0 rgba(255,255,255,0.8)',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          textShadow: '0 1px 0 rgba(255,255,255,0.8)',
          padding: '10px 8px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%)';
        }}
      >
        <span style={{ fontSize: '18px' }}>{isCollapsed ? '◀' : '▶'}</span>
        <div style={{
          fontSize: '9px',
          textAlign: 'center',
          lineHeight: '1.2',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)'
        }}>
          SONG BANK
        </div>
      </button>

      {/* Song Bank Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isCollapsed ? '-320px' : 0,
        width: '320px',
        height: '100vh',
        background: 'linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%)',
        borderLeft: '3px solid #c0c0c0',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.4), inset 2px 0 4px rgba(255,255,255,0.6)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.3s ease-in-out',
        borderRadius: '12px 0 0 12px'
      }}>
      {/* Header - iPod Chrome Style */}
      <div style={{
        padding: '24px 20px',
        background: 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d0d0d0 100%)',
        borderBottom: '2px solid #a0a0a0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
      }}>
        <h2 style={{
          margin: 0,
          color: '#333',
          fontSize: '22px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '0 1px 0 rgba(255,255,255,0.8)',
          letterSpacing: '0.5px',
          fontFamily: 'Arial, sans-serif'
        }}>
          🎵 SONG BANK
        </h2>
        <p style={{
          margin: '8px 0 0 0',
          color: '#666',
          fontSize: '11px',
          textAlign: 'center',
          textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          fontFamily: 'Arial, sans-serif'
        }}>
          Classic Synth Tutorials
        </p>
      </div>

      {/* Song List - iPod Playlist Style */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)'
      }}>
        {Object.entries(songs).map(([difficulty, songList]) => (
          <div key={difficulty} style={{ marginBottom: '16px' }}>
            {/* Difficulty Header - iPod Button Style */}
            <button
              onClick={() => setExpandedDifficulty(expandedDifficulty === difficulty ? null : difficulty)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: expandedDifficulty === difficulty
                  ? 'linear-gradient(180deg, #4a9eff 0%, #2d7fd9 100%)'
                  : 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%)',
                color: expandedDifficulty === difficulty ? '#fff' : '#333',
                border: '1px solid #b0b0b0',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: expandedDifficulty === difficulty ? 6 : 0,
                transition: 'all 0.2s',
                boxShadow: expandedDifficulty === difficulty
                  ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  : '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
                textShadow: expandedDifficulty === difficulty
                  ? '0 1px 1px rgba(0,0,0,0.3)'
                  : '0 1px 0 rgba(255,255,255,0.8)',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '0.3px'
              }}
              onMouseOver={(e) => {
                if (expandedDifficulty !== difficulty) {
                  e.currentTarget.style.background = 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%)';
                }
              }}
              onMouseOut={(e) => {
                if (expandedDifficulty !== difficulty) {
                  e.currentTarget.style.background = 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%)';
                }
              }}
            >
              <span>{difficulty.toUpperCase()} ({songList.length})</span>
              <span style={{ fontSize: '10px' }}>{expandedDifficulty === difficulty ? '▼' : '▶'}</span>
            </button>

            {/* Song List */}
            {expandedDifficulty === difficulty && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                {songList.map((song) => (
                  <div key={song.id}>
                    <button
                      onClick={() => song.available && setSelectedSong(selectedSong?.id === song.id ? null : song)}
                      disabled={!song.available}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: song.available
                          ? 'linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)'
                          : 'linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%)',
                        color: song.available ? '#000' : '#999',
                        border: '1px solid #c0c0c0',
                        borderBottom: selectedSong?.id === song.id ? 'none' : '1px solid #a0a0a0',
                        borderRadius: selectedSong?.id === song.id ? '4px 4px 0 0' : 0,
                        cursor: song.available ? 'pointer' : 'not-allowed',
                        textAlign: 'left',
                        fontSize: '11px',
                        opacity: song.available ? 1 : 0.6,
                        transition: 'all 0.15s',
                        boxShadow: song.available
                          ? 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.1)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.5)',
                        fontFamily: 'Arial, sans-serif',
                        textShadow: song.available ? '0 1px 0 rgba(255,255,255,0.8)' : 'none'
                      }}
                      onMouseOver={(e) => {
                        if (song.available) {
                          e.currentTarget.style.background = 'linear-gradient(180deg, #4a9eff 0%, #2d7fd9 100%)';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.textShadow = '0 1px 1px rgba(0,0,0,0.3)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (song.available && selectedSong?.id !== song.id) {
                          e.currentTarget.style.background = 'linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)';
                          e.currentTarget.style.color = '#000';
                          e.currentTarget.style.textShadow = '0 1px 0 rgba(255,255,255,0.8)';
                        }
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: 3, fontSize: '11px' }}>
                        {song.available ? '▶ ' : '🔒 '}{song.title}
                      </div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>
                        {song.artist}
                      </div>
                    </button>

                    {/* Difficulty selection buttons - shown when song is selected */}
                    {selectedSong?.id === song.id && (
                      <div style={{
                        border: '1px solid #c0c0c0',
                        borderTop: 'none',
                        borderRadius: '0 0 4px 4px',
                        background: 'linear-gradient(180deg, #f8f8f8 0%, #f0f0f0 100%)',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        {/* Easy Button */}
                        <button
                          onClick={() => {
                            onSelectSong(selectedSong, 1);
                            setSelectedSong(null);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%)',
                            color: '#333',
                            border: '1px solid #b0b0b0',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Arial, sans-serif',
                            textShadow: '0 1px 0 rgba(255,255,255,0.8)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
                          }}
                        >
                          EASY
                        </button>

                        {/* Hard Button */}
                        <button
                          onClick={() => {
                            onSelectSong(selectedSong, 2);
                            setSelectedSong(null);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%)',
                            color: '#333',
                            border: '1px solid #b0b0b0',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Arial, sans-serif',
                            textShadow: '0 1px 0 rgba(255,255,255,0.8)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
                          }}
                        >
                          HARD
                        </button>
                      </div>
                    )}
                  </div>
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
