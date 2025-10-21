import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position } from 'reactflow';

// Piano key to frequency mapping (C4 to C5)
const NOTE_FREQUENCIES = {
    'C': 261.63,  // C4
    'C#': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'B': 493.88,
    'C5': 523.25, // C5
};

// Keyboard mapping (physical keyboard keys to piano notes)
const KEY_TO_NOTE = {
    'a': 'C',
    'w': 'C#',
    's': 'D',
    'e': 'D#',
    'd': 'E',
    'f': 'F',
    't': 'F#',
    'g': 'G',
    'y': 'G#',
    'h': 'A',
    'u': 'A#',
    'j': 'B',
    'k': 'C5',
};

export function PianoNode({ id }) {
    const [activeNotes, setActiveNotes] = useState(new Set());
    const activeNotesRef = useRef(new Set());

    useEffect(() => {
        // Register as a controller (not an audio source)
        // We pass null for audioNode since this is just a controller
        audioGraph.registerNode(id, null, { isController: true, type: 'piano' });

        return () => {
            // Release all active notes before cleanup
            activeNotesRef.current.forEach(() => {
                audioGraph.releaseControlledNodes(id);
            });
            audioGraph.unregisterNode(id);
        };
    }, [id]);

    // Play a note
    const playNote = useCallback((note) => {
        const frequency = NOTE_FREQUENCIES[note];
        if (!frequency) return;

        Tone.start(); // Ensure audio context is started

        // Trigger controlled oscillators
        audioGraph.triggerControlledNodes(id, frequency);

        setActiveNotes(prev => new Set([...prev, note]));
        activeNotesRef.current.add(note);
    }, [id]);

    // Stop a note
    const stopNote = useCallback((note) => {
        const frequency = NOTE_FREQUENCIES[note];
        if (!frequency) return;

        // Release controlled oscillators
        audioGraph.releaseControlledNodes(id);

        setActiveNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(note);
            return newSet;
        });
        activeNotesRef.current.delete(note);
    }, [id]);

    // Keyboard event handlers
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];

            // Prevent repeated key events when holding down
            if (e.repeat) return;

            if (note && !activeNotesRef.current.has(note)) {
                playNote(note);
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            const note = KEY_TO_NOTE[key];

            if (note && activeNotesRef.current.has(note)) {
                stopNote(note);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [playNote, stopNote]);

    // Determine if a key is black or white
    const isBlackKey = (note) => note.includes('#');

    // Render piano keys
    const renderKeys = () => {
        const keys = Object.keys(NOTE_FREQUENCIES);
        const whiteKeys = keys.filter(k => !isBlackKey(k));
        const blackKeys = keys.filter(k => isBlackKey(k));

        return (
            <div style={{ position: 'relative', display: 'flex', height: 100 }}>
                {/* White keys */}
                {whiteKeys.map((note) => (
                    <div
                        key={note}
                        onMouseDown={() => playNote(note)}
                        onMouseUp={() => stopNote(note)}
                        onMouseLeave={() => {
                            if (activeNotes.has(note)) stopNote(note);
                        }}
                        style={{
                            width: 30,
                            height: 100,
                            background: activeNotes.has(note) ? '#ccc' : 'white',
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
                            {note === 'C5' ? 'C' : note}
                        </div>
                    </div>
                ))}

                {/* Black keys */}
                {blackKeys.map((note) => {
                    // Position black keys between white keys
                    const baseNote = note.replace('#', '');
                    const whiteKeyIndex = whiteKeys.indexOf(baseNote);
                    const leftOffset = (whiteKeyIndex + 0.7) * 30;

                    return (
                        <div
                            key={note}
                            onMouseDown={() => playNote(note)}
                            onMouseUp={() => stopNote(note)}
                            onMouseLeave={() => {
                                if (activeNotes.has(note)) stopNote(note);
                            }}
                            style={{
                                position: 'absolute',
                                left: leftOffset,
                                top: 0,
                                width: 20,
                                height: 60,
                                background: activeNotes.has(note) ? '#555' : '#000',
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
                minWidth: 280,
                textAlign: 'center',
            }}
        >
            {/* Control output handle on the right - connects to oscillators */}
            <Handle type="source" position={Position.Right} style={{ background: '#0af' }} />

            <strong style={{ color: '#0af', display: 'block', marginBottom: 8 }}>PIANO CONTROLLER</strong>

            <div style={{
                background: '#222',
                padding: 8,
                borderRadius: 4,
                marginBottom: 8,
            }}>
                {renderKeys()}
            </div>

            <div style={{ fontSize: '0.7em', color: '#888' }}>
                Keys: A-K (white) • W,E,T,Y,U (black)
            </div>
        </div>
    );
}
