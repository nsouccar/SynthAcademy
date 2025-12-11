import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

const Studio = ({ audioGraph }) => {
  const [tracks, setTracks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const recorderRef = useRef(null);
  const trackPlayersRef = useRef({});
  const wavesurfersRef = useRef({});
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const animationFrameRef = useRef(null);

  // Initialize recorder
  useEffect(() => {
    const recorder = new Tone.Recorder();
    Tone.Destination.connect(recorder);
    recorderRef.current = recorder;

    return () => {
      recorder.dispose();
    };
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    await Tone.start();
    recorderRef.current.start();
    setIsRecording(true);
    setRecordingStartTime(Date.now());
  }, []);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !isRecording) return;

    const recording = await recorderRef.current.stop();
    setIsRecording(false);
    setRecordingStartTime(null);

    // Create a new track
    const trackId = Date.now();
    const audioUrl = URL.createObjectURL(recording);

    const newTrack = {
      id: trackId,
      name: `Track ${tracks.length + 1}`,
      audioUrl,
      blob: recording,
      volume: -6,
      muted: false,
      solo: false,
      duration: 0,
      regions: []
    };

    setTracks(prev => [...prev, newTrack]);
  }, [isRecording, tracks.length]);

  // Create Wavesurfer instance for a track
  const createWavesurfer = useCallback((trackId, container) => {
    if (!container || wavesurfersRef.current[trackId]) return;

    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const ws = WaveSurfer.create({
      container,
      waveColor: '#4CAF50',
      progressColor: '#2E7D32',
      cursorColor: '#FF5722',
      barWidth: 2,
      barGap: 1,
      height: 80,
      normalize: true,
      plugins: [
        RegionsPlugin.create()
      ]
    });

    ws.load(track.audioUrl);

    ws.on('ready', () => {
      const duration = ws.getDuration();
      setTracks(prev => prev.map(t =>
        t.id === trackId ? { ...t, duration } : t
      ));
    });

    // Enable region creation on double-click
    ws.on('dblclick', () => {
      const regions = ws.registerPlugin(RegionsPlugin.create());
      regions.addRegion({
        start: 0,
        end: ws.getDuration(),
        color: 'rgba(76, 175, 80, 0.3)',
        drag: true,
        resize: true
      });
    });

    wavesurfersRef.current[trackId] = ws;
  }, [tracks]);

  // Play all tracks
  const playTracks = useCallback(async () => {
    await Tone.start();

    const soloedTracks = tracks.filter(t => t.solo);
    const tracksToPlay = soloedTracks.length > 0 ? soloedTracks : tracks.filter(t => !t.muted);

    console.log('Playing tracks:', tracksToPlay.length);

    // Stop any existing players
    Object.values(trackPlayersRef.current).forEach(player => {
      if (player) {
        player.stop();
        player.dispose();
      }
    });
    trackPlayersRef.current = {};

    // Create and load players for each track
    const playerPromises = tracksToPlay.map((track) => {
      return new Promise((resolve) => {
        const player = new Tone.Player({
          url: track.audioUrl,
          onload: () => {
            console.log('Player loaded for track:', track.id);
            resolve({ player, track });
          }
        }).toDestination();
        player.volume.value = track.volume;
      });
    });

    // Wait for all players to load
    const loadedPlayers = await Promise.all(playerPromises);
    console.log('All players loaded:', loadedPlayers.length);

    // Store players
    loadedPlayers.forEach(({ player, track }) => {
      trackPlayersRef.current[track.id] = player;
    });

    // Start all players at the same time
    const now = Tone.now() + 0.1; // Small delay to ensure sync
    loadedPlayers.forEach(({ player }) => {
      console.log('Starting player, state:', player.state);
      player.start(now);
    });

    // Sync wavesurfers
    tracksToPlay.forEach(track => {
      const ws = wavesurfersRef.current[track.id];
      if (ws) {
        ws.seekTo(0);
        ws.play();
      }
    });

    setIsPlaying(true);

    // Update current time
    const startTime = Tone.now();
    const updateTime = () => {
      const elapsed = Tone.now() - startTime;
      setCurrentTime(elapsed);

      // Check if all players are done
      const allPlayers = Object.values(trackPlayersRef.current);
      const allDone = allPlayers.every(player => player.state !== 'started');

      if (allDone && allPlayers.length > 0) {
        // Auto-stop when finished
        Object.values(trackPlayersRef.current).forEach(player => {
          if (player) {
            player.stop();
            player.dispose();
          }
        });
        trackPlayersRef.current = {};

        Object.values(wavesurfersRef.current).forEach(ws => {
          if (ws) ws.stop();
        });

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };
    updateTime();
  }, [tracks]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    Object.values(trackPlayersRef.current).forEach(player => {
      if (player) {
        player.stop();
        player.dispose();
      }
    });
    trackPlayersRef.current = {};

    // Stop all wavesurfers
    Object.values(wavesurfersRef.current).forEach(ws => {
      if (ws) ws.stop();
    });

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Delete track
  const deleteTrack = useCallback((trackId) => {
    // Clean up wavesurfer
    const ws = wavesurfersRef.current[trackId];
    if (ws) {
      ws.destroy();
      delete wavesurfersRef.current[trackId];
    }

    // Clean up player
    const player = trackPlayersRef.current[trackId];
    if (player) {
      player.dispose();
      delete trackPlayersRef.current[trackId];
    }

    // Remove track
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  // Update track volume
  const updateVolume = useCallback((trackId, volume) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, volume } : t
    ));

    const player = trackPlayersRef.current[trackId];
    if (player) {
      player.volume.value = volume;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback((trackId) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    ));
  }, []);

  // Toggle solo
  const toggleSolo = useCallback((trackId) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, solo: !t.solo } : t
    ));
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '300px',
      background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
      borderTop: '2px solid #4CAF50',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      fontFamily: 'ByteBounce, sans-serif'
    }}>
      {/* Transport Controls */}
      <div style={{
        padding: '12px 16px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isPlaying}
          style={{
            padding: '8px 16px',
            background: isRecording ? '#f44336' : '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            fontFamily: 'ByteBounce, sans-serif',
            fontSize: '14px',
            opacity: isPlaying ? 0.5 : 1,
            boxShadow: isRecording ? '0 0 20px rgba(244, 67, 54, 0.6)' : 'none'
          }}
        >
          {isRecording ? 'Recording...' : 'Record'}
        </button>

        <button
          onClick={isPlaying ? stopPlayback : playTracks}
          disabled={tracks.length === 0 || isRecording}
          style={{
            padding: '8px 16px',
            background: isPlaying ? '#ff9800' : '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: (tracks.length === 0 || isRecording) ? 'not-allowed' : 'pointer',
            fontFamily: 'ByteBounce, sans-serif',
            fontSize: '14px',
            opacity: (tracks.length === 0 || isRecording) ? 0.5 : 1
          }}
        >
          {isPlaying ? 'Stop' : 'Play All'}
        </button>

        <div style={{
          color: '#aaa',
          fontSize: '14px',
          marginLeft: '16px'
        }}>
          {formatTime(currentTime)}
        </div>

        <div style={{
          marginLeft: 'auto',
          color: '#aaa',
          fontSize: '12px'
        }}>
          {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
        </div>
      </div>

      {/* Track List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {tracks.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            fontSize: '14px'
          }}>
            Click Record to create your first track
          </div>
        ) : (
          tracks.map((track) => (
            <div
              key={track.id}
              style={{
                background: '#2a2a2a',
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #333'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                {/* Track Name */}
                <div style={{
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '80px'
                }}>
                  {track.name}
                </div>

                {/* Mute Button */}
                <button
                  onClick={() => toggleMute(track.id)}
                  style={{
                    padding: '4px 8px',
                    background: track.muted ? '#f44336' : '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontFamily: 'ByteBounce, sans-serif'
                  }}
                >
                  {track.muted ? 'M' : 'M'}
                </button>

                {/* Solo Button */}
                <button
                  onClick={() => toggleSolo(track.id)}
                  style={{
                    padding: '4px 8px',
                    background: track.solo ? '#ff9800' : '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontFamily: 'ByteBounce, sans-serif'
                  }}
                >
                  S
                </button>

                {/* Volume Slider */}
                <input
                  type="range"
                  min="-48"
                  max="6"
                  step="1"
                  value={track.volume}
                  onChange={(e) => updateVolume(track.id, parseFloat(e.target.value))}
                  style={{
                    width: '100px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  color: '#aaa',
                  fontSize: '10px',
                  minWidth: '40px'
                }}>
                  {track.volume > 0 ? '+' : ''}{track.volume} dB
                </span>

                {/* Duration */}
                <span style={{
                  color: '#aaa',
                  fontSize: '10px',
                  marginLeft: 'auto'
                }}>
                  {formatTime(track.duration)}
                </span>

                {/* Delete Button */}
                <button
                  onClick={() => deleteTrack(track.id)}
                  style={{
                    padding: '4px 8px',
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontFamily: 'ByteBounce, sans-serif'
                  }}
                >
                  Delete
                </button>
              </div>

              {/* Waveform */}
              <div
                ref={(el) => {
                  if (el && !wavesurfersRef.current[track.id]) {
                    createWavesurfer(track.id, el);
                  }
                }}
                style={{
                  background: '#1a1a1a',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Studio;
