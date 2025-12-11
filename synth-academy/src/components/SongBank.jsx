import { useState, useMemo } from 'react';
import { getSongList } from '../tutorialGenerator';

// Base song catalog (songs without tutorials yet)
const baseSongs = {
  easy: [
    { id: 'trans-europe-express', artist: 'Kraftwerk', title: 'Trans-Europe Express', available: false },
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

// Merge available tutorials with base catalog
function getMergedSongs() {
  const availableSongs = getSongList();
  const merged = { easy: [], medium: [], hard: [] };

  // Create a set of available song IDs for quick lookup
  const availableIds = new Set();
  Object.values(availableSongs).forEach(list => {
    list.forEach(song => availableIds.add(song.id));
  });

  // For each difficulty, add available songs first, then unavailable ones
  ['easy', 'medium', 'hard'].forEach(difficulty => {
    // Add songs from tutorial configs (available)
    merged[difficulty].push(...(availableSongs[difficulty] || []));

    // Add remaining songs from base catalog (unavailable), skip duplicates
    baseSongs[difficulty].forEach(song => {
      if (!availableIds.has(song.id)) {
        merged[difficulty].push(song);
      }
    });
  });

  return merged;
}

const songs = getMergedSongs();

export function SongBank({ onSelectSong, isCollapsed: controlledCollapsed, setIsCollapsed: controlledSetIsCollapsed }) {
  const [expandedDifficulty, setExpandedDifficulty] = useState('easy');
  const [selectedSong, setSelectedSong] = useState(null);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setIsCollapsed = controlledSetIsCollapsed || setInternalCollapsed;

  return (
    <>
      {/* StarCrush Font */}
      <style>{`
        @font-face {
          font-family: 'StarCrush';
          src: url('/Star Crush.ttf') format('truetype');
        }
      `}</style>


      {/* Collapse/Expand Tab - Glassmorphic Style */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'fixed',
          right: isCollapsed ? 0 : '320px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '100px',
          background: 'rgba(30, 30, 40, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRight: isCollapsed ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          borderRadius: isCollapsed ? '8px 0 0 8px' : '0 8px 8px 0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#fff',
          zIndex: 1001,
          transition: 'all 0.3s ease-in-out',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.4)',
          fontFamily: 'ByteBounce, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          padding: '10px 6px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(50, 50, 60, 0.9)';
          e.currentTarget.style.boxShadow = '-4px 0 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 182, 193, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(30, 30, 40, 0.8)';
          e.currentTarget.style.boxShadow = '-4px 0 20px rgba(0, 0, 0, 0.4)';
        }}
      >
        <span style={{ fontSize: '14px', opacity: 0.8 }}>{isCollapsed ? '◀' : '▶'}</span>
        <div style={{
          fontSize: '9px',
          textAlign: 'center',
          lineHeight: '1.2',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          opacity: 0.9
        }}>
          SONGS
        </div>
      </button>

      {/* Song Bank Sidebar - Glassmorphic Dark */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isCollapsed ? '-320px' : 0,
        width: '320px',
        height: '100vh',
        background: 'rgba(20, 20, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.3s ease-in-out'
      }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.03)'
      }}>
        <h2 style={{
          margin: 0,
          color: '#fff',
          fontSize: '22px',
          fontWeight: 'bold',
          textAlign: 'center',
          letterSpacing: '2px',
          fontFamily: 'ByteBounce, sans-serif',
          textShadow: '0 0 20px rgba(255, 182, 193, 0.5)'
        }}>
          SONG BANK
        </h2>
        <p style={{
          margin: '6px 0 0 0',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          textAlign: 'center',
          fontFamily: 'ByteBounce, sans-serif',
          letterSpacing: '1px'
        }}>
          Classic Synth Tutorials
        </p>
      </div>

      {/* Song List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px'
      }}>
        {Object.entries(songs).map(([difficulty, songList]) => {
          // Pastel gradients matching the app's aesthetic
          const difficultyStyles = {
            easy: {
              gradient: 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)',
              glow: 'rgba(168, 230, 207, 0.4)',
              color: '#1a3a1a'
            },
            medium: {
              gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
              glow: 'rgba(253, 203, 110, 0.4)',
              color: '#3a3a1a'
            },
            hard: {
              gradient: 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%)',
              glow: 'rgba(255, 182, 193, 0.4)',
              color: '#3a1a2a'
            }
          };
          const style = difficultyStyles[difficulty];

          return (
          <div key={difficulty} style={{ marginBottom: '12px' }}>
            {/* Difficulty Header - Pastel Gradient Style */}
            <button
              onClick={() => setExpandedDifficulty(expandedDifficulty === difficulty ? null : difficulty)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: style.gradient,
                color: style.color,
                border: '2px solid rgba(0, 0, 0, 0.2)',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: expandedDifficulty === difficulty ? 8 : 0,
                transition: 'all 0.2s',
                boxShadow: expandedDifficulty === difficulty
                  ? `0 0 20px ${style.glow}, inset 0 2px 4px rgba(0,0,0,0.1)`
                  : '0 2px 8px rgba(0,0,0,0.3)',
                fontFamily: 'ByteBounce, sans-serif',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 15px rgba(0,0,0,0.3), 0 0 20px ${style.glow}`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = expandedDifficulty === difficulty
                  ? `0 0 20px ${style.glow}, inset 0 2px 4px rgba(0,0,0,0.1)`
                  : '0 2px 8px rgba(0,0,0,0.3)';
              }}
            >
              <span>{difficulty.toUpperCase()} ({songList.length})</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>{expandedDifficulty === difficulty ? '▼' : '▶'}</span>
            </button>

            {/* Song List */}
            {expandedDifficulty === difficulty && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                {songList.map((song) => (
                  <div key={song.id}>
                    <button
                      onClick={() => song.available && setSelectedSong(selectedSong?.id === song.id ? null : song)}
                      disabled={!song.available}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: song.available
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.02)',
                        color: song.available ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: selectedSong?.id === song.id ? '6px 6px 0 0' : 6,
                        cursor: song.available ? 'pointer' : 'not-allowed',
                        textAlign: 'left',
                        fontSize: '11px',
                        opacity: song.available ? 1 : 0.5,
                        transition: 'all 0.2s',
                        fontFamily: 'ByteBounce, sans-serif'
                      }}
                      onMouseOver={(e) => {
                        if (song.available) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 182, 193, 0.2)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (song.available && selectedSong?.id !== song.id) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: 3, fontSize: '13px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!song.available && <span style={{ opacity: 0.5 }}>🔒</span>}
                        {song.title}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.6 }}>
                        {song.artist}
                      </div>
                    </button>

                    {/* Difficulty selection buttons - shown when song is selected */}
                    {selectedSong?.id === song.id && (
                      <div style={{
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderTop: 'none',
                        borderRadius: '0 0 6px 6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '8px',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        {/* Easy Button */}
                        <button
                          onClick={() => {
                            onSelectSong(selectedSong, 1);
                            setSelectedSong(null);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            background: 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)',
                            color: '#1a3a1a',
                            border: '2px solid rgba(0, 0, 0, 0.2)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            fontFamily: 'ByteBounce, sans-serif',
                            letterSpacing: '1px',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 15px rgba(168, 230, 207, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
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
                            flex: 1,
                            padding: '10px 12px',
                            background: 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%)',
                            color: '#3a1a2a',
                            border: '2px solid rgba(0, 0, 0, 0.2)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            fontFamily: 'ByteBounce, sans-serif',
                            letterSpacing: '1px',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 15px rgba(255, 182, 193, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
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
        );
        })}
      </div>
      </div>
    </>
  );
}
