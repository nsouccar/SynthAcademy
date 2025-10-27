import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { voiceManager } from '../VoiceManager';
import { audioGraph } from '../AudioGraph';

// Convert MIDI note number to frequency
const midiNoteToFrequency = (midiNote) => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * Dual Sequencer for Interactive Tutorial Mode
 * Shows two sequencers side-by-side:
 * - Left: Reference synth with correct parameters
 * - Right: User's synth (from tutorial)
 * Both play the same MIDI sequence from Samplab_YAYAYA.mid
 */
export function TutorialDualSequencer({ midiFilePath, referenceChain, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [notes, setNotes] = useState([]);
  const [loopLength, setLoopLength] = useState(16); // in beats
  const [currentTime, setCurrentTime] = useState(0);

  // Playback refs
  const userPartRef = useRef(null);
  const referencePartRef = useRef(null);
  const referenceVoiceTemplateIdRef = useRef(null);

  // Load MIDI file on mount
  useEffect(() => {
    const loadMidiFile = async () => {
      try {
        console.log('Tutorial Sequencer - Loading MIDI file from:', midiFilePath);
        const response = await fetch(midiFilePath);

        if (!response.ok) {
          throw new Error(`Failed to fetch MIDI file: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log('Tutorial Sequencer - MIDI file loaded, size:', arrayBuffer.byteLength, 'bytes');

        const midi = new Midi(arrayBuffer);
        console.log('Tutorial Sequencer - MIDI parsed, tracks:', midi.tracks.length);

        // Extract notes from all tracks
        const importedNotes = [];
        let maxTime = 0;

        midi.tracks.forEach((track, trackIndex) => {
          console.log(`Tutorial Sequencer - Track ${trackIndex}: ${track.notes.length} notes`);
          track.notes.forEach(note => {
            // Convert MIDI time (seconds) to beats
            const timeInBeats = note.time * (tempo / 60);
            const durationInBeats = note.duration * (tempo / 60);

            importedNotes.push({
              time: timeInBeats,
              pitch: note.midi,
              duration: durationInBeats,
              velocity: note.velocity
            });

            maxTime = Math.max(maxTime, timeInBeats + durationInBeats);
          });
        });

        setNotes(importedNotes);

        // Auto-adjust loop length to fit the MIDI
        const newLoopLength = Math.ceil(maxTime / 4) * 4; // Round up to nearest 4 beats (1 bar)
        setLoopLength(newLoopLength);

        // Set tempo from MIDI if available
        if (midi.header.tempos.length > 0) {
          setTempo(midi.header.tempos[0].bpm);
        }

        console.log(`Tutorial Sequencer - Loaded ${importedNotes.length} notes, loop length: ${newLoopLength} beats, tempo: ${midi.header.tempos.length > 0 ? midi.header.tempos[0].bpm : tempo} BPM`);
      } catch (error) {
        console.error('Tutorial Sequencer - Error loading MIDI file:', error);
        alert(`Failed to load MIDI file: ${error.message}`);
      }
    };

    loadMidiFile();
  }, [midiFilePath]);

  // Create reference synth chain
  useEffect(() => {
    if (!referenceChain) return;

    // Create a voice template from the reference chain
    // The reference chain should be: Oscillator -> Envelope -> Effect -> Output
    // We'll register this as a template in the voice manager

    // For now, we'll store the template ID
    // This will be used to trigger notes on the reference synth
    referenceVoiceTemplateIdRef.current = 'tutorial-reference-template';

    // TODO: Actually create and register the reference voice template
    // This requires integrating with the audioGraph system

  }, [referenceChain]);

  // Playback control
  const startPlayback = useCallback(() => {
    // Check if notes are loaded
    if (notes.length === 0) {
      console.warn('Tutorial Sequencer - No notes loaded yet');
      alert('MIDI file is still loading, please wait a moment...');
      setIsPlaying(false);
      return;
    }

    Tone.start();

    // Get the primary voice template from the audio graph
    const templateId = audioGraph.getPrimaryVoiceTemplateId();
    if (!templateId) {
      console.warn('No voice template found. Create an Output node and connect a synth chain.');
      alert('No synth chain detected! Please make sure you have an Output node connected to your synth.');
      setIsPlaying(false);
      return;
    }

    console.log('Tutorial Sequencer - Using template ID:', templateId);
    console.log('Tutorial Sequencer - Playing', notes.length, 'notes');
    console.log('Tutorial Sequencer - Tempo:', tempo, 'BPM, Loop length:', loopLength, 'beats');

    // Clear any existing scheduled events
    Tone.Transport.cancel();

    // Set Tone.js Transport tempo
    Tone.Transport.bpm.value = tempo;

    // Create user synth part
    const userPart = new Tone.Part((time, note) => {
      const frequency = midiNoteToFrequency(note.pitch);
      const voiceId = voiceManager.startVoice(templateId, frequency, note.velocity);

      const durationInSeconds = note.duration * (60 / tempo);
      Tone.Draw.schedule(() => {
        voiceManager.stopVoice(voiceId);
      }, time + durationInSeconds);

    }, notes.map(note => ({
      time: `0:${note.time}`,
      pitch: note.pitch,
      duration: note.duration,
      velocity: note.velocity
    })));

    userPart.loop = true;
    userPart.loopEnd = `0:${loopLength}`;
    userPartRef.current = userPart;

    // Create reference synth part (if reference template exists)
    if (referenceVoiceTemplateIdRef.current) {
      const referencePart = new Tone.Part((time, note) => {
        const frequency = midiNoteToFrequency(note.pitch);
        const voiceId = voiceManager.startVoice(referenceVoiceTemplateIdRef.current, frequency, note.velocity);

        const durationInSeconds = note.duration * (60 / tempo);
        Tone.Draw.schedule(() => {
          voiceManager.stopVoice(voiceId);
        }, time + durationInSeconds);

      }, notes.map(note => ({
        time: `0:${note.time}`,
        pitch: note.pitch,
        duration: note.duration,
        velocity: note.velocity
      })));

      referencePart.loop = true;
      referencePart.loopEnd = `0:${loopLength}`;
      referencePartRef.current = referencePart;
      referencePart.start(0);
    }

    // Start transport
    Tone.Transport.start();
    userPart.start(0);

    // Update visual playhead
    const updatePlayhead = () => {
      if (!isPlaying) return;

      const positionBeats = Tone.Transport.position.split(':');
      const bars = parseInt(positionBeats[0]);
      const beats = parseInt(positionBeats[1]);
      const sixteenths = parseFloat(positionBeats[2]);

      const totalBeats = (bars * 4) + beats + (sixteenths / 4);
      setCurrentTime(totalBeats % loopLength);

      requestAnimationFrame(updatePlayhead);
    };

    updatePlayhead();
  }, [notes, tempo, loopLength, isPlaying]);

  const stopPlayback = useCallback(() => {
    // Stop user part
    if (userPartRef.current) {
      userPartRef.current.stop();
      userPartRef.current.dispose();
      userPartRef.current = null;
    }

    // Stop reference part
    if (referencePartRef.current) {
      referencePartRef.current.stop();
      referencePartRef.current.dispose();
      referencePartRef.current = null;
    }

    // Cancel all scheduled events
    Tone.Transport.cancel();
    Tone.Transport.stop();
    Tone.Transport.position = 0;

    // Stop all active voices
    voiceManager.stopAllVoices();

    setCurrentTime(0);
  }, []);

  // Handle play/stop
  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }

    return () => {
      stopPlayback();
    };
  }, [isPlaying, startPlayback, stopPlayback]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: '2px solid #4CAF50',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
      minWidth: 400,
      maxWidth: 600
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '2px solid #4CAF50'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            color: '#4CAF50',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            Tutorial Sequencer
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            color: '#aaa',
            fontSize: '12px'
          }}>
            Playing your synth vs. reference synth
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Info */}
      <div style={{
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid rgba(76, 175, 80, 0.3)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        color: '#bbb',
        fontSize: '13px'
      }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#4CAF50' }}>Your Synth:</strong> Playing through your current synth chain
        </div>
        <div>
          <strong style={{ color: '#4CAF50' }}>Reference Synth:</strong> The correct "Better Off Alone" sound
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{
          background: '#2a2a2a',
          borderRadius: 8,
          padding: 12,
          textAlign: 'center'
        }}>
          <div style={{ color: '#888', fontSize: '11px', marginBottom: 4 }}>TEMPO</div>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>{tempo} BPM</div>
        </div>
        <div style={{
          background: '#2a2a2a',
          borderRadius: 8,
          padding: 12,
          textAlign: 'center'
        }}>
          <div style={{ color: '#888', fontSize: '11px', marginBottom: 4 }}>NOTES</div>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>{notes.length}</div>
        </div>
        <div style={{
          background: '#2a2a2a',
          borderRadius: 8,
          padding: 12,
          textAlign: 'center'
        }}>
          <div style={{ color: '#888', fontSize: '11px', marginBottom: 4 }}>LENGTH</div>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>{loopLength / 4} bars</div>
        </div>
      </div>

      {/* Transport Controls */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            padding: '12px 32px',
            background: isPlaying ? '#f44336' : '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s'
          }}
        >
          {isPlaying ? 'Stop' : 'Play Both Synths'}
        </button>
      </div>

      {/* Progress bar */}
      {isPlaying && (
        <div style={{
          marginTop: 16,
          background: '#2a2a2a',
          borderRadius: 4,
          height: 8,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${(currentTime / loopLength) * 100}%`,
            background: 'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      )}
    </div>
  );
}
