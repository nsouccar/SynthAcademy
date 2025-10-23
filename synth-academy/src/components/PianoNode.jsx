import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { voiceManager } from '../VoiceManager';

// Base note names (no octave)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Calculate frequency for any note and octave
const getNoteFrequency = (noteName, octave) => {
    const noteIndex = NOTE_NAMES.indexOf(noteName);
    if (noteIndex === -1) return null;

    // A4 = 440Hz, A is index 9
    // Formula: f = 440 * 2^((n-69)/12) where n is MIDI note number
    const midiNote = (octave + 1) * 12 + noteIndex;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// Extended keyboard mapping - two rows of keys for two octaves
const KEY_TO_NOTE = {
    // Lower row (home row) - white keys
    'z': 'C',
    'x': 'D',
    'c': 'E',
    'v': 'F',
    'b': 'G',
    'n': 'A',
    'm': 'B',
    ',': 'C', // Next octave C

    // Lower row black keys
    's': 'C#',
    'd': 'D#',
    'g': 'F#',
    'h': 'G#',
    'j': 'A#',

    // Upper row - white keys (second octave)
    'q': 'C',
    'w': 'D',
    'e': 'E',
    'r': 'F',
    't': 'G',
    'y': 'A',
    'u': 'B',
    'i': 'C', // Next octave C

    // Upper row black keys
    '2': 'C#',
    '3': 'D#',
    '5': 'F#',
    '6': 'G#',
    '7': 'A#',
};

export function PianoNode({ id }) {
    const [activeNotes, setActiveNotes] = useState(new Set());
    const activeNotesRef = useRef(new Set());
    const [octave, setOctave] = useState(4); // Start at octave 4 (middle C = C4)

    // Map to track which voice ID belongs to which note
    const activeVoicesRef = useRef(new Map()); // noteKey -> voiceId

    useEffect(() => {
        // Piano no longer needs to register with audioGraph
        // It directly uses voiceManager

        return () => {
            // Stop all active voices on cleanup
            activeVoicesRef.current.forEach(voiceId => {
                voiceManager.stopVoice(voiceId);
            });
            activeVoicesRef.current.clear();
        };
    }, [id]);

    // Handle octave changes with keyboard
    useEffect(() => {
        const handleOctaveChange = (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setOctave(prev => Math.min(prev + 1, 7)); // Max octave 7
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setOctave(prev => Math.max(prev - 1, 0)); // Min octave 0
            }
        };

        window.addEventListener('keydown', handleOctaveChange);
        return () => window.removeEventListener('keydown', handleOctaveChange);
    }, []);

    // Play a note
    const playNote = useCallback((note, keyboardOctave = null) => {
        // Use keyboard octave for keyboard input, or visual octave for mouse clicks
        const actualOctave = keyboardOctave !== null ? keyboardOctave : octave;
        const frequency = getNoteFrequency(note, actualOctave);
        if (!frequency) return;

        Tone.start(); // Ensure audio context is started

        // Get the voice template to use
        const templateId = audioGraph.getPrimaryVoiceTemplateId();
        if (!templateId) {
            console.warn('No voice template found. Did you create an Output node and connect a chain to it?');
            return;
        }

        // Start a new voice
        const voiceId = voiceManager.startVoice(templateId, frequency, 1.0);

        if (voiceId) {
            const noteKey = `${note}-${actualOctave}`;
            activeVoicesRef.current.set(noteKey, voiceId);
            setActiveNotes(prev => new Set([...prev, noteKey]));
            activeNotesRef.current.add(noteKey);
        }
    }, [octave]);

    // Stop a note
    const stopNote = useCallback((note, keyboardOctave = null) => {
        const actualOctave = keyboardOctave !== null ? keyboardOctave : octave;
        const noteKey = `${note}-${actualOctave}`;

        // Stop the voice for this note
        const voiceId = activeVoicesRef.current.get(noteKey);
        if (voiceId) {
            voiceManager.stopVoice(voiceId);
            activeVoicesRef.current.delete(noteKey);
        }

        setActiveNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(noteKey);
            return newSet;
        });
        activeNotesRef.current.delete(noteKey);
    }, [octave]);

    // Keyboard event handlers
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Skip if arrow keys (used for octave change)
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') return;

            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];

            // Prevent repeated key events when holding down
            if (e.repeat) return;

            if (note) {
                // Determine which octave based on which row of keys
                const lowerRowKeys = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', 's', 'd', 'g', 'h', 'j'];
                const upperRowKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', '2', '3', '5', '6', '7'];

                let keyboardOctave = octave;
                if (upperRowKeys.includes(key)) {
                    keyboardOctave = octave + 1; // Upper row is one octave higher
                }

                const noteKey = `${note}-${keyboardOctave}`;
                if (!activeNotesRef.current.has(noteKey)) {
                    playNote(note, keyboardOctave);
                }
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];

            if (note) {
                // Determine which octave based on which row of keys
                const upperRowKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', '2', '3', '5', '6', '7'];

                let keyboardOctave = octave;
                if (upperRowKeys.includes(key)) {
                    keyboardOctave = octave + 1;
                }

                const noteKey = `${note}-${keyboardOctave}`;
                if (activeNotesRef.current.has(noteKey)) {
                    stopNote(note, keyboardOctave);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [playNote, stopNote, octave]);

    // Render piano keys (two octaves)
    const renderKeys = () => {
        const whiteKeys = NOTE_NAMES.filter(n => !n.includes('#'));
        const blackKeys = NOTE_NAMES.filter(n => n.includes('#'));

        return (
            <div style={{ position: 'relative', display: 'flex', height: 100 }}>
                {/* White keys - first octave */}
                {whiteKeys.map((note, index) => {
                    const noteKey = `${note}-${octave}`;
                    return (
                        <div
                            key={`${note}-${octave}`}
                            onMouseDown={() => playNote(note, octave)}
                            onMouseUp={() => stopNote(note, octave)}
                            onMouseLeave={() => {
                                if (activeNotes.has(noteKey)) stopNote(note, octave);
                            }}
                            style={{
                                width: 30,
                                height: 100,
                                background: activeNotes.has(noteKey) ? '#ccc' : 'white',
                                border: '1px solid #000',
                                borderRadius: '0 0 4px 4px',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background 0.05s',
                                userSelect: 'none',
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                bottom: 5,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.7em',
                                color: '#666',
                                fontWeight: 'bold',
                            }}>
                                {note}
                            </div>
                        </div>
                    );
                })}

                {/* White keys - second octave */}
                {whiteKeys.map((note, index) => {
                    const noteKey = `${note}-${octave + 1}`;
                    return (
                        <div
                            key={`${note}-${octave + 1}`}
                            onMouseDown={() => playNote(note, octave + 1)}
                            onMouseUp={() => stopNote(note, octave + 1)}
                            onMouseLeave={() => {
                                if (activeNotes.has(noteKey)) stopNote(note, octave + 1);
                            }}
                            style={{
                                width: 30,
                                height: 100,
                                background: activeNotes.has(noteKey) ? '#ccc' : 'white',
                                border: '1px solid #000',
                                borderRadius: '0 0 4px 4px',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background 0.05s',
                                userSelect: 'none',
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                bottom: 5,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.7em',
                                color: '#666',
                                fontWeight: 'bold',
                            }}>
                                {note}
                            </div>
                        </div>
                    );
                })}

                {/* Black keys - first octave */}
                {blackKeys.map((note) => {
                    const noteKey = `${note}-${octave}`;
                    // Position black keys between white keys
                    const baseNote = note.replace('#', '');
                    const whiteKeyIndex = whiteKeys.indexOf(baseNote);
                    const leftOffset = (whiteKeyIndex + 0.7) * 30;

                    return (
                        <div
                            key={`${note}-${octave}`}
                            onMouseDown={() => playNote(note, octave)}
                            onMouseUp={() => stopNote(note, octave)}
                            onMouseLeave={() => {
                                if (activeNotes.has(noteKey)) stopNote(note, octave);
                            }}
                            style={{
                                position: 'absolute',
                                left: leftOffset,
                                top: 0,
                                width: 20,
                                height: 60,
                                background: activeNotes.has(noteKey) ? '#555' : '#000',
                                border: '1px solid #000',
                                borderRadius: '0 0 3px 3px',
                                cursor: 'pointer',
                                zIndex: 10,
                                transition: 'background 0.05s',
                                userSelect: 'none',
                            }}
                        />
                    );
                })}

                {/* Black keys - second octave */}
                {blackKeys.map((note) => {
                    const noteKey = `${note}-${octave + 1}`;
                    // Position black keys between white keys
                    const baseNote = note.replace('#', '');
                    const whiteKeyIndex = whiteKeys.indexOf(baseNote);
                    const leftOffset = (whiteKeyIndex + 0.7 + whiteKeys.length) * 30;

                    return (
                        <div
                            key={`${note}-${octave + 1}`}
                            onMouseDown={() => playNote(note, octave + 1)}
                            onMouseUp={() => stopNote(note, octave + 1)}
                            onMouseLeave={() => {
                                if (activeNotes.has(noteKey)) stopNote(note, octave + 1);
                            }}
                            style={{
                                position: 'absolute',
                                left: leftOffset,
                                top: 0,
                                width: 20,
                                height: 60,
                                background: activeNotes.has(noteKey) ? '#555' : '#000',
                                border: '1px solid #000',
                                borderRadius: '0 0 3px 3px',
                                cursor: 'pointer',
                                zIndex: 10,
                                transition: 'background 0.05s',
                                userSelect: 'none',
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div
            style={{
                padding: 10,
                background: '#333',
                color: 'white',
                borderRadius: 6,
                border: '1px solid #0af',
                minWidth: 450,
                textAlign: 'center',
            }}
        >
            {/* No handle - piano finds voice templates automatically */}

            <strong style={{ color: '#0af', display: 'block', marginBottom: 8 }}>PIANO</strong>

            {/* Octave controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
            }}>
                <button
                    onClick={() => setOctave(prev => Math.max(prev - 1, 0))}
                    style={{
                        background: '#444',
                        border: '1px solid #666',
                        borderRadius: 4,
                        color: '#0af',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        fontWeight: 'bold',
                    }}
                >
                    ↓ Oct
                </button>
                <span style={{ color: '#0af', fontWeight: 'bold', fontSize: '0.9em' }}>
                    Octave: {octave}
                </span>
                <button
                    onClick={() => setOctave(prev => Math.min(prev + 1, 7))}
                    style={{
                        background: '#444',
                        border: '1px solid #666',
                        borderRadius: 4,
                        color: '#0af',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        fontWeight: 'bold',
                    }}
                >
                    ↑ Oct
                </button>
            </div>

            <div style={{
                background: '#222',
                padding: 8,
                borderRadius: 4,
                marginBottom: 8,
            }}>
                {renderKeys()}
            </div>

            <div style={{ fontSize: '0.65em', color: '#888', lineHeight: 1.4 }}>
                <div>Lower Row: Z-M (white) • S,D,G,H,J (black)</div>
                <div>Upper Row: Q-I (white) • 2,3,5,6,7 (black)</div>
                <div>Arrow Up/Down: Change octave</div>
            </div>
        </div>
    );
}
