import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { audioGraph } from '../AudioGraph';
import { voiceManager } from '../VoiceManager';
import { useReactFlow } from 'reactflow';

// MIDI note names for reference
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Convert MIDI note number to frequency
const midiNoteToFrequency = (midiNote) => {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// Convert MIDI note to display name (e.g., 60 -> "C4")
const midiNoteToName = (midiNote) => {
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = NOTE_NAMES[midiNote % 12];
    return `${noteName}${octave}`;
};

export function PianoRollNode({ id, data }) {
    const { setNodes } = useReactFlow();
    const canvasRef = useRef(null);
    const pianoCanvasRef = useRef(null);

    // Sequencer state
    const [isPlaying, setIsPlaying] = useState(data?.isPlaying || false);
    const [isRecording, setIsRecording] = useState(data?.isRecording || false);
    const [tempo, setTempo] = useState(data?.tempo || 120);
    const [notes, setNotes] = useState(data?.notes || []); // [{time, pitch, duration, velocity}, ...]
    const [loopLength, setLoopLength] = useState(data?.loopLength || 4); // in beats
    const [currentTime, setCurrentTime] = useState(0); // in beats
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [snapDivision, setSnapDivision] = useState(16); // 16th notes
    const [metronomeEnabled, setMetronomeEnabled] = useState(false);

    // UI state
    const [mouseDown, setMouseDown] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState(new Set());
    const [hoveredNote, setHoveredNote] = useState(null);
    const [draggingNote, setDraggingNote] = useState(null); // {noteIndex, offsetX, offsetY}
    const [resizingNote, setResizingNote] = useState(null); // {noteIndex, edge: 'left'|'right'}
    const [scrollX, setScrollX] = useState(0);
    const [scrollY, setScrollY] = useState(0);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isFocused, setIsFocused] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null); // {startX, startY, endX, endY}
    const scrollContainerRef = useRef(null);

    // Resizing state - vertical and horizontal
    const [canvasHeight, setCanvasHeight] = useState(data?.canvasHeight || 600);
    const [canvasWidth, setCanvasWidth] = useState(data?.canvasWidth || 1800);
    const [isResizingVertical, setIsResizingVertical] = useState(false);
    const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
    const [resizeStartY, setResizeStartY] = useState({ y: 0, height: 0 });
    const [resizeStartX, setResizeStartX] = useState({ x: 0, width: 0 });

    // Recording state
    const recordingStartTime = useRef(null);
    const activeRecordingNotes = useRef(new Map()); // pitch -> {startTime, voiceId}

    // Playback state
    const scheduledNotes = useRef(new Map()); // noteId -> voiceId
    const playbackInterval = useRef(null);
    const tonePartRef = useRef(null);
    const metronomeRef = useRef(null);
    const metronomeSynthRef = useRef(null);

    // Reference synth playback (for tutorial compact mode)
    const [isPlayingReference, setIsPlayingReference] = useState(false);
    const referencePartRef = useRef(null);
    const referenceSynthRef = useRef(null);

    // Canvas dimensions - dynamic canvas that grows with content
    const PIANO_WIDTH = 80;
    const MIN_MIDI_NOTE = 21; // A0 (full piano range)
    const MAX_MIDI_NOTE = 108; // C8 (full piano range)
    const NUM_KEYS = MAX_MIDI_NOTE - MIN_MIDI_NOTE;
    const PIXELS_PER_BEAT = 150; // Bigger blocks

    // Calculate required canvas width based on notes and loop length
    const maxNoteTime = notes.length > 0
        ? Math.max(...notes.map(n => n.time + n.duration))
        : 0;
    const minCanvasBeats = Math.max(loopLength, maxNoteTime + 4, 16); // At least loop length, notes + 4 bars buffer, or 16 beats minimum
    const CANVAS_WIDTH = minCanvasBeats * PIXELS_PER_BEAT + PIANO_WIDTH; // Dynamic width
    const CANVAS_HEIGHT = 2160; // Large canvas (all octaves)
    const VISIBLE_WIDTH = canvasWidth; // Resizable viewport width
    const VISIBLE_HEIGHT = canvasHeight; // Resizable viewport height
    const GRID_WIDTH = CANVAS_WIDTH - PIANO_WIDTH;
    const KEY_HEIGHT = CANVAS_HEIGHT / NUM_KEYS; // ~25px per key

    // Update node data whenever state changes (for persistence)
    useEffect(() => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        isPlaying,
                        isRecording,
                        tempo,
                        notes,
                        loopLength,
                        canvasHeight,
                        canvasWidth
                    }
                };
            }
            return node;
        }));
    }, [isPlaying, isRecording, tempo, notes, loopLength, canvasHeight, canvasWidth, id, setNodes]);

    // Handle vertical resize dragging
    const handleVerticalResizeMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizingVertical(true);
        setResizeStartY({
            y: e.clientY,
            height: canvasHeight
        });
    };

    useEffect(() => {
        if (!isResizingVertical) return;

        const handleMouseMove = (e) => {
            const deltaY = e.clientY - resizeStartY.y;
            setCanvasHeight(Math.max(300, resizeStartY.height + deltaY));
        };

        const handleMouseUp = () => {
            setIsResizingVertical(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingVertical, resizeStartY]);

    // Handle horizontal resize dragging
    const handleHorizontalResizeMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizingHorizontal(true);
        setResizeStartX({
            x: e.clientX,
            width: canvasWidth
        });
    };

    useEffect(() => {
        if (!isResizingHorizontal) return;

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - resizeStartX.x;
            setCanvasWidth(Math.max(800, resizeStartX.width + deltaX));
        };

        const handleMouseUp = () => {
            setIsResizingHorizontal(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingHorizontal, resizeStartX]);

    // Snap time to grid
    const snapToGrid = useCallback((time) => {
        if (!snapEnabled) return time;
        const beatDivision = 4 / snapDivision; // e.g., 16th note = 0.25 beats
        return Math.round(time / beatDivision) * beatDivision;
    }, [snapEnabled, snapDivision]);

    // Draw piano keys on left canvas
    const drawPianoKeys = useCallback(() => {
        const canvas = pianoCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, PIANO_WIDTH, CANVAS_HEIGHT);

        for (let i = 0; i < NUM_KEYS; i++) {
            const midiNote = MAX_MIDI_NOTE - i;
            const y = i * KEY_HEIGHT;
            const noteName = NOTE_NAMES[midiNote % 12];
            const isBlackKey = noteName.includes('#');
            const isC = noteName === 'C';

            // Draw key background
            ctx.fillStyle = isBlackKey ? '#222' : '#fff';
            ctx.fillRect(0, y, PIANO_WIDTH, KEY_HEIGHT);

            // Draw border
            ctx.strokeStyle = isC ? '#0af' : '#444';
            ctx.lineWidth = isC ? 2 : 1;
            ctx.strokeRect(0, y, PIANO_WIDTH, KEY_HEIGHT);

            // Draw note name for C notes
            if (isC && KEY_HEIGHT > 10) {
                ctx.fillStyle = '#666';
                ctx.font = '10px monospace';
                ctx.fillText(midiNoteToName(midiNote), 5, y + KEY_HEIGHT / 2 + 3);
            }
        }
    }, []);

    // Draw grid and notes on main canvas
    const drawGrid = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, GRID_WIDTH, CANVAS_HEIGHT);

        // Draw background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, GRID_WIDTH, CANVAS_HEIGHT);

        // Draw vertical grid lines (beats)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let beat = 0; beat <= loopLength; beat++) {
            const x = beat * PIXELS_PER_BEAT;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();

            // Draw beat numbers
            if (beat < loopLength) {
                ctx.fillStyle = '#666';
                ctx.font = '10px monospace';
                ctx.fillText((beat + 1).toString(), x + 5, 12);
            }
        }

        // Draw subdivision lines
        ctx.strokeStyle = '#282828';
        const subdivisions = snapDivision / 4; // beats per subdivision
        for (let i = 0; i <= loopLength * subdivisions; i++) {
            const x = (i / subdivisions) * PIXELS_PER_BEAT;
            if (i % subdivisions !== 0) { // Skip main beat lines
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, CANVAS_HEIGHT);
                ctx.stroke();
            }
        }

        // Draw horizontal grid lines (notes)
        for (let i = 0; i <= NUM_KEYS; i++) {
            const y = i * KEY_HEIGHT;
            const midiNote = MAX_MIDI_NOTE - i;
            const noteName = NOTE_NAMES[midiNote % 12];
            const isC = noteName === 'C';

            ctx.strokeStyle = isC ? '#444' : '#2a2a2a';
            ctx.lineWidth = isC ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GRID_WIDTH, y);
            ctx.stroke();
        }

        // Draw notes
        notes.forEach((note, index) => {
            const x = note.time * PIXELS_PER_BEAT;
            const y = (MAX_MIDI_NOTE - note.pitch) * KEY_HEIGHT;
            const width = note.duration * PIXELS_PER_BEAT;
            const height = KEY_HEIGHT;

            const isSelected = selectedNotes.has(index);
            const isHovered = hoveredNote === index;

            // Note body - brighter when hovered
            ctx.fillStyle = isSelected ? '#4CAF50' : isHovered ? '#00ccff' : '#0088ff';
            ctx.fillRect(x, y, Math.max(width, 2), height);

            // Note border - thicker when hovered
            ctx.strokeStyle = isHovered ? '#fff' : '#005599';
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.strokeRect(x, y, Math.max(width, 2), height);
        });

        // Draw playhead
        if (isPlaying) {
            const playheadX = currentTime * PIXELS_PER_BEAT;
            ctx.strokeStyle = '#f0f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(playheadX, 0);
            ctx.lineTo(playheadX, CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Draw selection box
        if (selectionBox) {
            const minX = Math.min(selectionBox.startX, selectionBox.endX);
            const minY = Math.min(selectionBox.startY, selectionBox.endY);
            const width = Math.abs(selectionBox.endX - selectionBox.startX);
            const height = Math.abs(selectionBox.endY - selectionBox.startY);

            ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
            ctx.fillRect(minX, minY, width, height);
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(minX, minY, width, height);
            ctx.setLineDash([]);
        }
    }, [notes, selectedNotes, hoveredNote, currentTime, isPlaying, loopLength, snapDivision, selectionBox]);

    // Redraw canvases when state changes
    useEffect(() => {
        drawPianoKeys();
        drawGrid();
    }, [drawPianoKeys, drawGrid]);

    // Handle mouse events on canvas with dragging and resizing
    const handleCanvasMouseDown = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Prevent ReactFlow from selecting the node when clicking on the canvas
        e.stopPropagation();

        // Set focus when clicking on the canvas
        setIsFocused(true);
        console.log('Piano roll focused via canvas click');

        // Check if spacebar is held for panning
        if (e.button === 1 || e.shiftKey) { // Middle click or Shift+click for panning
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            e.preventDefault();
            return;
        }

        // Use offsetX/offsetY for accurate position relative to canvas
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        // Check if clicking on existing note
        let clickedNoteIndex = -1;
        let clickedEdge = null;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            const noteX = note.time * PIXELS_PER_BEAT;
            const noteY = (MAX_MIDI_NOTE - note.pitch) * KEY_HEIGHT;
            const noteWidth = note.duration * PIXELS_PER_BEAT;
            const noteHeight = KEY_HEIGHT;

            if (x >= noteX && x <= noteX + noteWidth &&
                y >= noteY && y <= noteY + noteHeight) {
                clickedNoteIndex = i;

                // Check if clicking near edges (within 10% of note width)
                const edgeThreshold = noteWidth * 0.1;
                if (x >= noteX && x <= noteX + edgeThreshold) {
                    clickedEdge = 'left';
                } else if (x >= noteX + noteWidth - edgeThreshold && x <= noteX + noteWidth) {
                    clickedEdge = 'right';
                }
                break;
            }
        }

        if (clickedNoteIndex >= 0) {
            if (clickedEdge) {
                // Start resizing
                setResizingNote({ noteIndex: clickedNoteIndex, edge: clickedEdge });
            } else {
                // Start dragging
                const note = notes[clickedNoteIndex];
                const noteX = note.time * PIXELS_PER_BEAT;
                const noteY = (MAX_MIDI_NOTE - note.pitch) * KEY_HEIGHT;
                setDraggingNote({
                    noteIndex: clickedNoteIndex,
                    offsetX: x - noteX,
                    offsetY: y - noteY
                });

                // Handle selection
                if (e.metaKey || e.ctrlKey) {
                    // Cmd/Ctrl held: toggle this note in selection
                    setSelectedNotes(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(clickedNoteIndex)) {
                            newSet.delete(clickedNoteIndex);
                        } else {
                            newSet.add(clickedNoteIndex);
                        }
                        return newSet;
                    });
                } else {
                    // No modifier key: check if note is already selected
                    setSelectedNotes(prev => {
                        // If the clicked note is already in the selection, keep the selection
                        if (prev.has(clickedNoteIndex)) {
                            return prev; // Keep existing selection for group drag
                        } else {
                            // Otherwise, select only this note
                            return new Set([clickedNoteIndex]);
                        }
                    });
                }
            }
        } else {
            // Start selection box (hold Alt key) or add new note (default)
            if (e.altKey) {
                setIsSelecting(true);
                setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
                setSelectedNotes(new Set());
            } else {
                // Add new note
                const time = snapToGrid(x / PIXELS_PER_BEAT);
                const pitch = Math.floor(MAX_MIDI_NOTE - (y / KEY_HEIGHT));
                const defaultDuration = snapToGrid(1); // 1 beat default
                const newNote = {
                    time: Math.max(0, time),
                    pitch: Math.max(MIN_MIDI_NOTE, Math.min(pitch, MAX_MIDI_NOTE)),
                    duration: defaultDuration,
                    velocity: 0.8
                };

                setNotes(prev => [...prev, newNote]);
                setSelectedNotes(new Set());
            }
        }

        setMouseDown(true);
    };

    const handleCanvasMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Handle panning
        if (isPanning && scrollContainerRef.current) {
            const dx = panStart.x - e.clientX;
            const dy = panStart.y - e.clientY;
            scrollContainerRef.current.scrollLeft += dx;
            scrollContainerRef.current.scrollTop += dy;
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        // Use offsetX/offsetY which gives position relative to the canvas element directly
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        // Handle selection box
        if (isSelecting && selectionBox) {
            setSelectionBox(prev => ({
                ...prev,
                endX: x,
                endY: y
            }));

            // Select all notes within the selection box
            const minX = Math.min(selectionBox.startX, x);
            const maxX = Math.max(selectionBox.startX, x);
            const minY = Math.min(selectionBox.startY, y);
            const maxY = Math.max(selectionBox.startY, y);

            const selectedIndices = new Set();
            notes.forEach((note, index) => {
                const noteX = note.time * PIXELS_PER_BEAT;
                const noteY = (MAX_MIDI_NOTE - note.pitch) * KEY_HEIGHT;
                const noteWidth = note.duration * PIXELS_PER_BEAT;
                const noteHeight = KEY_HEIGHT;

                // Check if note intersects with selection box
                if (noteX + noteWidth >= minX && noteX <= maxX &&
                    noteY + noteHeight >= minY && noteY <= maxY) {
                    selectedIndices.add(index);
                }
            });

            setSelectedNotes(selectedIndices);
            return;
        }

        // Convert mouse position to grid coordinates
        const mouseGridTime = x / PIXELS_PER_BEAT;
        const mouseGridPitch = Math.floor(MAX_MIDI_NOTE - (y / KEY_HEIGHT));

        // Handle dragging
        if (draggingNote) {
            const draggedNote = notes[draggingNote.noteIndex];
            const newTime = snapToGrid(mouseGridTime);
            const newPitch = mouseGridPitch;

            // Calculate the delta from the original note position
            const timeDelta = newTime - draggedNote.time;
            const pitchDelta = newPitch - draggedNote.pitch;

            setNotes(prev => prev.map((note, i) => {
                // If this note is selected, move it by the same delta
                if (selectedNotes.has(i)) {
                    return {
                        ...note,
                        time: Math.max(0, note.time + timeDelta),
                        pitch: Math.max(MIN_MIDI_NOTE, Math.min(note.pitch + pitchDelta, MAX_MIDI_NOTE))
                    };
                }
                return note;
            }));
            return;
        }

        // Handle resizing
        if (resizingNote) {
            const note = notes[resizingNote.noteIndex];

            if (resizingNote.edge === 'right') {
                // Resize from right edge
                const newEndTime = snapToGrid(mouseGridTime);
                const newDuration = Math.max(snapToGrid(0.25), newEndTime - note.time);

                setNotes(prev => prev.map((n, i) => {
                    if (i === resizingNote.noteIndex) {
                        return { ...n, duration: newDuration };
                    }
                    return n;
                }));
            } else if (resizingNote.edge === 'left') {
                // Resize from left edge
                const newStartTime = snapToGrid(mouseGridTime);
                const originalEndTime = note.time + note.duration;
                const newDuration = Math.max(snapToGrid(0.25), originalEndTime - newStartTime);

                setNotes(prev => prev.map((n, i) => {
                    if (i === resizingNote.noteIndex) {
                        return {
                            ...n,
                            time: Math.max(0, newStartTime),
                            duration: newDuration
                        };
                    }
                    return n;
                }));
            }
            return;
        }

        // Find hovered note - check if mouse is in the same grid cell as any note
        let hoveredIndex = -1;
        let cursorType = 'crosshair';


        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];

            // Calculate note's visual bounds
            const noteStartBeat = note.time;
            const noteEndBeat = note.time + note.duration;
            const noteY = (MAX_MIDI_NOTE - note.pitch) * KEY_HEIGHT;
            const noteYEnd = noteY + KEY_HEIGHT;

            // Check if mouse is within the note's bounds
            const timeMatches = mouseGridTime >= noteStartBeat && mouseGridTime <= noteEndBeat;
            const pitchMatches = y >= noteY && y <= noteYEnd; // Check Y pixel position instead of grid pitch

            if (timeMatches && pitchMatches) {
                hoveredIndex = i;

                // Determine cursor based on position within the note
                const relativePosition = (mouseGridTime - noteStartBeat) / note.duration;
                if (relativePosition < 0.1) {
                    cursorType = 'ew-resize'; // Near left edge
                } else if (relativePosition > 0.9) {
                    cursorType = 'ew-resize'; // Near right edge
                } else {
                    cursorType = 'move'; // Middle of note
                }
                break;
            }
        }

        setHoveredNote(hoveredIndex);
        if (canvas) {
            canvas.style.cursor = cursorType;
        }
    };

    const handleCanvasMouseUp = () => {
        setMouseDown(false);
        setDraggingNote(null);
        setResizingNote(null);
        setIsPanning(false);
        setIsSelecting(false);
        setSelectionBox(null);
    };

    // Delete selected notes
    const deleteSelectedNotes = useCallback(() => {
        if (selectedNotes.size === 0) {
            console.log('No notes selected to delete');
            return;
        }

        console.log(`Deleting ${selectedNotes.size} notes`);
        setNotes(prev => prev.filter((_, index) => !selectedNotes.has(index)));
        setSelectedNotes(new Set());
    }, [selectedNotes]);

    // Keyboard shortcuts - only when piano roll is focused and has selected notes
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Only delete notes if the piano roll is focused AND has selected notes
                if (!isFocused || selectedNotes.size === 0) {
                    console.log('Piano roll not focused or no notes selected, allowing default delete behavior');
                    return;
                }

                console.log(`Piano roll IS focused with ${selectedNotes.size} notes selected, deleting and preventing default`);
                // Prevent default behavior
                e.preventDefault();
                // Stop propagation to prevent ReactFlow from catching it
                e.stopPropagation();
                e.stopImmediatePropagation();
                deleteSelectedNotes();
            }
        };

        // Use capture phase to intercept before ReactFlow
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [deleteSelectedNotes, isFocused, selectedNotes]);

    // Setup metronome
    useEffect(() => {
        // Create a simple synth for metronome clicks
        const clickSynth = new Tone.MembraneSynth({
            pitchDecay: 0.008,
            octaves: 2,
            volume: -10
        }).toDestination();

        metronomeSynthRef.current = clickSynth;

        return () => {
            clickSynth.dispose();
        };
    }, []);

    // Setup reference synth for tutorial mode (dynamic oscillator and multiple effects)
    // This creates a custom synth that supports unison voices with spread detune
    useEffect(() => {
        if (!data?.compactMode || !data?.referenceParams) return;

        const oscType = data.referenceParams.oscillator?.type || 'sawtooth';
        const oscParams = data.referenceParams.oscillator || {};

        // Unison parameters
        const unisonVoices = oscParams.unisonVoices || 1;
        const unisonSpread = oscParams.unisonSpread || 0;
        const baseDetune = oscParams.detune || 0;
        const octaveOffset = oscParams.octaveOffset || 0;

        // Support both single effect (effectType) and multiple effects (effects array)
        let effectsConfig = [];
        if (data.referenceParams.effects && data.referenceParams.effects.length > 0) {
            effectsConfig = data.referenceParams.effects;
        } else {
            // Fallback to single effect for backward compatibility
            const effectType = data.referenceParams.effectType || 'reverb';
            const effectParams = data.referenceParams[effectType] || {};
            effectsConfig = [{ type: effectType, ...effectParams }];
        }

        // Helper function to create a single effect
        const createEffect = (config) => {
            const { type, ...params } = config;
            switch (type) {
                case 'chorus':
                    const chorus = new Tone.Chorus({
                        frequency: params.frequency || 1.5,
                        delayTime: params.delayTime || 3.5,
                        depth: params.depth || 0.4,
                        wet: params.wet || 0.3
                    });
                    chorus.start();
                    return chorus;
                case 'delay':
                    return new Tone.FeedbackDelay({
                        delayTime: params.delayTime || 0.25,
                        feedback: params.feedback || 0.3,
                        wet: params.wet || 0.3
                    });
                case 'distortion':
                    return new Tone.Distortion({
                        distortion: params.distortion || 0.4,
                        wet: params.wet || 0.5
                    });
                case 'filter':
                    // Convert normalized frequency (0-1) to Hz if needed
                    let freq = params.frequency || 1000;
                    if (freq <= 1) {
                        // Normalize: 0 = 20Hz, 1 = 20kHz (log scale)
                        freq = 20 * Math.pow(1000, freq);
                    }
                    return new Tone.Filter({
                        frequency: freq,
                        type: params.type || 'lowpass',
                        Q: (params.resonance || 0.5) * 20 // Scale resonance to Q
                    });
                case 'reverb':
                default:
                    const reverb = new Tone.Reverb({
                        decay: params.decay || 3.0,
                        preDelay: params.preDelay || 0.01,
                        wet: params.wet || 0.2
                    });
                    reverb.generate();
                    return reverb;
            }
        };

        // Create all effects
        const effects = effectsConfig.map(config => createEffect(config));

        // Chain effects: effect1 -> effect2 -> ... -> destination
        if (effects.length > 0) {
            // Connect last effect to destination
            effects[effects.length - 1].toDestination();

            // Chain effects in reverse order (so first effect is first in chain)
            for (let i = effects.length - 2; i >= 0; i--) {
                effects[i].connect(effects[i + 1]);
            }
        }

        // Map oscillator type to Tone.js type
        let toneOscType = oscType;
        if (oscType === 'pulse') {
            toneOscType = 'pulse';
        }

        // Create a custom PolySynth factory that supports unison
        // We create multiple synths per voice and mix them together
        const envelopeParams = {
            attack: data.referenceParams.envelope?.attack || 0.01,
            decay: data.referenceParams.envelope?.decay || 0.1,
            sustain: data.referenceParams.envelope?.sustain ?? 1.0,
            release: data.referenceParams.envelope?.release || 0.02
        };

        // Calculate volume compensation for unison (more voices = lower volume per voice)
        const volumeCompensation = unisonVoices > 1 ? -3 * Math.log2(unisonVoices) : 0;
        const baseVolume = -6 + volumeCompensation;

        // Create a custom synth class that handles unison internally
        // Architecture: oscillators -> merger -> envelope -> effects
        // (All oscillators share ONE envelope, matching VoiceManager)
        class UnisonSynth {
            constructor() {
                this.activeNotes = new Map();
            }

            triggerAttackRelease(note, duration, time, velocity = 1) {
                const freq = Tone.Frequency(note).toFrequency();
                // Apply octave offset
                const adjustedFreq = freq * Math.pow(2, octaveOffset);

                // Create merger to combine all unison voices
                const merger = new Tone.Gain(1);

                // Create ONE envelope for all voices (this is the key difference!)
                const envelope = new Tone.AmplitudeEnvelope(envelopeParams);

                // Connect: merger -> envelope -> effects/destination
                merger.connect(envelope);
                if (effects.length > 0) {
                    envelope.connect(effects[0]);
                } else {
                    envelope.toDestination();
                }

                // Create oscillators for each unison voice
                const oscillators = [];

                for (let i = 0; i < unisonVoices; i++) {
                    // Create oscillator
                    let osc;
                    if (oscType === 'pulse') {
                        osc = new Tone.PulseOscillator(adjustedFreq, oscParams.pulseWidth || 0.5);
                    } else {
                        osc = new Tone.Oscillator(adjustedFreq, toneOscType);
                    }

                    // Apply base detune
                    osc.detune.value = baseDetune;

                    // Apply spread detune for unison
                    if (unisonVoices > 1) {
                        const spreadOffset = ((i / (unisonVoices - 1)) - 0.5) * 2 * unisonSpread;
                        osc.detune.value += spreadOffset;
                    }

                    // Set volume with velocity
                    osc.volume.value = baseVolume + (velocity - 1) * 10;

                    // Connect oscillator -> merger
                    osc.connect(merger);
                    osc.start(time);

                    oscillators.push(osc);
                }

                // Trigger the single envelope
                envelope.triggerAttack(time);

                // Schedule release
                const releaseTime = time + Tone.Time(duration).toSeconds();
                envelope.triggerRelease(releaseTime);

                // Schedule cleanup after release completes
                const cleanupTime = releaseTime + envelopeParams.release + 0.1;
                Tone.Transport.scheduleOnce(() => {
                    oscillators.forEach(osc => {
                        try {
                            osc.stop();
                            osc.disconnect();
                            osc.dispose();
                        } catch (e) {}
                    });
                    try {
                        envelope.disconnect();
                        envelope.dispose();
                    } catch (e) {}
                    try {
                        merger.disconnect();
                        merger.dispose();
                    } catch (e) {}
                }, cleanupTime);
            }

            dispose() {
                // Cleanup any remaining resources
                this.activeNotes.forEach(({ oscillators, envelope, merger }) => {
                    oscillators.forEach(osc => {
                        try { osc.stop(); osc.dispose(); } catch (e) {}
                    });
                    try { envelope.dispose(); } catch (e) {}
                    try { merger.dispose(); } catch (e) {}
                });
                this.activeNotes.clear();
            }
        }

        const synth = new UnisonSynth();

        referenceSynthRef.current = synth;
        // Store effect refs for cleanup
        referenceSynthRef.current._effectRefs = effects;

        console.log('Reference synth created with unison:', {
            oscType,
            unisonVoices,
            unisonSpread,
            baseDetune,
            octaveOffset,
            envelope: envelopeParams
        });

        return () => {
            synth.dispose();
            effects.forEach(effect => effect.dispose());
        };
    }, [data?.compactMode, data?.referenceParams]);

    // Playback system using Tone.js Transport
    const startPlayback = useCallback(() => {
        Tone.start(); // Ensure audio context is started

        const templateId = audioGraph.getPrimaryVoiceTemplateId();
        if (!templateId) {
            console.warn('No voice template found. Create an Output node and connect a synth chain.');
            return;
        }

        // Clear any scheduled events from previous playback
        Tone.Transport.cancel();

        // Set Tone.js Transport tempo
        Tone.Transport.bpm.value = tempo;

        // Setup metronome if enabled
        if (metronomeEnabled && metronomeSynthRef.current) {
            // Create metronome loop - play on every beat
            const metronome = new Tone.Loop((time) => {
                // Get current beat position
                const position = Tone.Transport.position.split(':');
                const beat = parseInt(position[1]);

                // Higher pitch on beat 1, lower on other beats
                const isDownbeat = beat === 0;
                const note = isDownbeat ? 'C5' : 'C4';

                metronomeSynthRef.current.triggerAttackRelease(note, '16n', time);
            }, '4n'); // Loop every quarter note (1 beat)

            metronome.start(0);
            metronomeRef.current = metronome;
        }

        // Create a Tone.Part for scheduling notes
        // Use beats as the time unit instead of ticks
        const part = new Tone.Part((time, note) => {
            const frequency = midiNoteToFrequency(note.pitch);
            const voiceId = voiceManager.startVoice(templateId, frequency, note.velocity);

            // Schedule note off using the note duration in beats
            // Convert beats to seconds: duration (beats) * (60 seconds / tempo BPM) = seconds
            const durationInSeconds = note.duration * (60 / tempo);
            Tone.Draw.schedule(() => {
                voiceManager.stopVoice(voiceId);
            }, time + durationInSeconds);

        }, notes.map(note => ({
            time: `0:${note.time}`, // Time in bars:beats notation (0 bars + beats)
            pitch: note.pitch,
            duration: note.duration, // Duration in beats
            velocity: note.velocity
        })));

        part.loop = true;
        part.loopEnd = `0:${loopLength}`; // Loop end in bars:beats notation

        tonePartRef.current = part;

        // Start transport and part
        Tone.Transport.start();
        part.start(0);

        // Update visual playhead
        const updatePlayhead = () => {
            if (!isPlaying) return;

            // Get position in beats using Transport's position
            const positionBeats = Tone.Transport.position.split(':');
            const bars = parseInt(positionBeats[0]);
            const beats = parseInt(positionBeats[1]);
            const sixteenths = parseFloat(positionBeats[2]);

            const totalBeats = (bars * 4) + beats + (sixteenths / 4);
            setCurrentTime(totalBeats % loopLength);

            requestAnimationFrame(updatePlayhead);
        };

        updatePlayhead();

    }, [notes, tempo, loopLength, isPlaying, metronomeEnabled]);

    const stopPlayback = useCallback(() => {
        // Stop metronome
        if (metronomeRef.current) {
            metronomeRef.current.stop();
            metronomeRef.current.dispose();
            metronomeRef.current = null;
        }

        // Stop the part first
        if (tonePartRef.current) {
            tonePartRef.current.stop();
            tonePartRef.current.dispose();
            tonePartRef.current = null;
        }

        // Cancel all scheduled events
        Tone.Transport.cancel();

        // Stop transport
        Tone.Transport.stop();
        Tone.Transport.position = 0;

        // Stop all active voices
        voiceManager.stopAllVoices();

        scheduledNotes.current.clear();

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
    }, [isPlaying, tempo, notes, loopLength]); // Restart playback when these change

    // Reference synth playback (for tutorial mode)
    const startReferencePlayback = useCallback(() => {
        if (!referenceSynthRef.current) {
            console.warn('Reference synth not initialized');
            return;
        }

        Tone.start();

        // Clear any existing scheduled events
        Tone.Transport.cancel();

        // Set tempo
        Tone.Transport.bpm.value = tempo;

        // Create a Tone.Part for the reference synth
        const part = new Tone.Part((time, note) => {
            const noteName = Tone.Frequency(note.pitch, 'midi').toNote();
            const durationInSeconds = note.duration * (60 / tempo);
            referenceSynthRef.current.triggerAttackRelease(noteName, durationInSeconds, time, note.velocity);
        }, notes.map(note => ({
            time: `0:${note.time}`,
            pitch: note.pitch,
            duration: note.duration,
            velocity: note.velocity
        })));

        part.loop = true;
        part.loopEnd = `0:${loopLength}`;
        referencePartRef.current = part;

        // Start transport
        Tone.Transport.start();
        part.start(0);

        console.log('Reference playback started');
    }, [notes, tempo, loopLength]);

    const stopReferencePlayback = useCallback(() => {
        if (referencePartRef.current) {
            referencePartRef.current.stop();
            referencePartRef.current.dispose();
            referencePartRef.current = null;
        }

        Tone.Transport.cancel();
        Tone.Transport.stop();
        Tone.Transport.position = 0;

        console.log('Reference playback stopped');
    }, []);

    // Handle reference playback state
    useEffect(() => {
        if (isPlayingReference) {
            startReferencePlayback();
        } else {
            stopReferencePlayback();
        }

        return () => {
            stopReferencePlayback();
        };
    }, [isPlayingReference, startReferencePlayback, stopReferencePlayback]);

    // Recording system
    const startRecording = useCallback(() => {
        Tone.start();
        recordingStartTime.current = Tone.now();
        activeRecordingNotes.current.clear();
        setIsRecording(true);
    }, []);

    const stopRecording = useCallback(() => {
        // Finalize any active notes
        activeRecordingNotes.current.forEach((noteData, pitch) => {
            const duration = Tone.now() - recordingStartTime.current - noteData.startTime;
            const durationInBeats = (duration / 60) * tempo;

            setNotes(prev => [...prev, {
                time: snapToGrid(noteData.startTime * tempo / 60),
                pitch,
                duration: snapToGrid(durationInBeats),
                velocity: 0.8
            }]);

            voiceManager.stopVoice(noteData.voiceId);
        });

        activeRecordingNotes.current.clear();
        setIsRecording(false);
    }, [tempo, snapToGrid]);

    // Listen for piano input when recording
    useEffect(() => {
        if (!isRecording) return;

        const handleMidiInput = (e) => {
            // This would hook into MIDI or keyboard events
            // For now, we'll implement this through a global event system
        };

        // TODO: Implement MIDI input listener

        return () => {
            // Cleanup
        };
    }, [isRecording]);

    // Auto-load MIDI file if midiFilePath is provided in data
    useEffect(() => {
        const loadMidiFromPath = async () => {
            if (!data?.midiFilePath) return;
            if (notes.length > 0) return; // Already loaded

            try {
                console.log('PianoRollNode - Auto-loading MIDI file from:', data.midiFilePath);
                const response = await fetch(data.midiFilePath);

                if (!response.ok) {
                    throw new Error(`Failed to fetch MIDI file: ${response.status} ${response.statusText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const midi = new Midi(arrayBuffer);

                // Extract notes from all tracks
                const importedNotes = [];
                let maxTime = 0;

                midi.tracks.forEach(track => {
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

                // Set the notes
                setNotes(importedNotes);

                // Auto-adjust loop length to fit the MIDI
                const newLoopLength = Math.ceil(maxTime / 4) * 4; // Round up to nearest 4 beats (1 bar)
                setLoopLength(newLoopLength);

                // Set tempo from MIDI if available
                if (midi.header.tempos.length > 0) {
                    setTempo(midi.header.tempos[0].bpm);
                }

                console.log(`PianoRollNode - Auto-loaded ${importedNotes.length} notes from MIDI file`);
            } catch (error) {
                console.error('PianoRollNode - Error auto-loading MIDI file:', error);
            }
        };

        loadMidiFromPath();
    }, [data?.midiFilePath]); // Only run when midiFilePath changes

    // Import MIDI file
    const handleMidiFileImport = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const midi = new Midi(arrayBuffer);

            // Extract notes from all tracks
            const importedNotes = [];
            let maxTime = 0;

            midi.tracks.forEach(track => {
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

            // Set the notes
            setNotes(importedNotes);

            // Auto-adjust loop length to fit the MIDI
            const newLoopLength = Math.ceil(maxTime / 4) * 4; // Round up to nearest 4 beats (1 bar)
            setLoopLength(newLoopLength);

            // Set tempo from MIDI if available
            if (midi.header.tempos.length > 0) {
                setTempo(midi.header.tempos[0].bpm);
            }

            console.log(`Imported ${importedNotes.length} notes from MIDI file`);
        } catch (error) {
            console.error('Error importing MIDI file:', error);
            alert('Failed to import MIDI file. Please make sure it\'s a valid MIDI file.');
        }

        // Reset the input so the same file can be imported again
        event.target.value = '';
    }, [tempo]);

    // Export MIDI file
    const handleMidiFileExport = useCallback(() => {
        try {
            // Create a new MIDI file
            const midi = new Midi();

            // Add a track
            const track = midi.addTrack();

            // Set tempo
            midi.header.setTempo(tempo);

            // Add all notes to the track
            notes.forEach(note => {
                // Convert beats to seconds for MIDI format
                const timeInSeconds = note.time * (60 / tempo);
                const durationInSeconds = note.duration * (60 / tempo);

                track.addNote({
                    midi: note.pitch,
                    time: timeInSeconds,
                    duration: durationInSeconds,
                    velocity: note.velocity
                });
            });

            // Convert to array buffer and download
            const arrayBuffer = midi.toArray();
            const blob = new Blob([arrayBuffer], { type: 'audio/midi' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sequence-${Date.now()}.mid`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`Exported ${notes.length} notes to MIDI file`);
        } catch (error) {
            console.error('Error exporting MIDI file:', error);
            alert('Failed to export MIDI file.');
        }
    }, [notes, tempo]);

    // Compact mode for tutorials - just show play buttons
    if (data?.compactMode) {
        return (
            <div
                className="nodrag nopan"
                style={{
                    background: '#1a1a1a',
                    border: '2px solid #4169E1',
                    borderRadius: 6,
                    padding: 12,
                    minWidth: 180,
                    color: '#fff',
                    fontSize: '0.85em',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 0 10px rgba(65, 105, 225, 0.3)'
                }}
            >
                {/* Title */}
                <div style={{
                    fontWeight: 'bold',
                    marginBottom: 8,
                    textAlign: 'center',
                    fontSize: '0.9em',
                    color: '#4169E1'
                }}>
                    MELODY
                </div>

                {/* Your synth button */}
                <button
                    onClick={() => {
                        if (isPlayingReference) setIsPlayingReference(false);
                        setIsPlaying(!isPlaying);
                    }}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: isPlaying ? '#f44336' : '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85em',
                        marginBottom: 6,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        if (!isPlaying) e.target.style.background = '#444';
                    }}
                    onMouseOut={(e) => {
                        if (!isPlaying) e.target.style.background = '#333';
                    }}
                >
                    {isPlaying ? '■ Stop' : '▶ Play Your Synth'}
                </button>

                {/* Reference synth button (only show if referenceParams provided) */}
                {data?.referenceParams && (
                    <button
                        onClick={() => {
                            if (isPlaying) setIsPlaying(false);
                            setIsPlayingReference(!isPlayingReference);
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: isPlayingReference ? '#f44336' : '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85em',
                            marginBottom: 6,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (!isPlayingReference) e.target.style.background = '#444';
                        }}
                        onMouseOut={(e) => {
                            if (!isPlayingReference) e.target.style.background = '#333';
                        }}
                    >
                        {isPlayingReference ? '■ Stop' : '▶ Play Reference'}
                    </button>
                )}

                <div style={{
                    fontSize: '0.65em',
                    textAlign: 'center',
                    color: '#999',
                    marginTop: 4
                }}>
                    {notes.length} notes • {tempo} BPM
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={(e) => {
                setIsFocused(true);
            }}
            onMouseLeave={() => {
                // Unfocus when mouse leaves the piano roll
                setIsFocused(false);
            }}
            tabIndex={0}
            style={{
                background: '#222',
                borderRadius: 8,
                border: isFocused ? '3px solid #0af' : '2px solid #555',
                padding: 12,
                color: '#fff',
                minWidth: VISIBLE_WIDTH + PIANO_WIDTH + 24,
                position: 'relative',
                outline: 'none'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px solid #444'
            }}>
                {/* Draggable title area - this is the handle to move the node */}
                <strong
                    style={{
                        color: '#0af',
                        fontSize: '14px',
                        cursor: 'move',
                        userSelect: 'none',
                        padding: '4px 8px',
                        marginLeft: -8
                    }}
                    title="Drag to move sequencer"
                >
                    SEQUENCER v2
                </strong>

                <div className="nodrag nopan" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: '#888' }}>
                        BPM:
                        <input
                            type="number"
                            value={tempo}
                            onChange={(e) => setTempo(Number(e.target.value))}
                            min={40}
                            max={240}
                            style={{
                                width: 50,
                                marginLeft: 4,
                                padding: 2,
                                background: '#333',
                                border: '1px solid #555',
                                color: '#fff',
                                borderRadius: 3
                            }}
                        />
                    </label>

                    <label style={{ fontSize: '11px', color: '#888' }}>
                        Bars:
                        <input
                            type="number"
                            value={loopLength / 4}
                            onChange={(e) => setLoopLength(Number(e.target.value) * 4)}
                            min={1}
                            max={16}
                            style={{
                                width: 40,
                                marginLeft: 4,
                                padding: 2,
                                background: '#333',
                                border: '1px solid #555',
                                color: '#fff',
                                borderRadius: 3
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* Canvas container with scrolling */}
            <div
                className="nodrag nopan"
                style={{
                    display: 'flex',
                    background: '#1a1a1a',
                    borderRadius: 4,
                    border: '1px solid #444',
                    position: 'relative',
                    width: VISIBLE_WIDTH + PIANO_WIDTH,
                    height: VISIBLE_HEIGHT
                }}
            >
                {/* Piano keys - fixed, scrolls vertically */}
                <div style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    overflow: 'hidden',
                    height: VISIBLE_HEIGHT
                }}>
                    <div style={{
                        transform: `translateY(-${scrollY}px)`,
                    }}>
                        <canvas
                            ref={pianoCanvasRef}
                            width={PIANO_WIDTH}
                            height={CANVAS_HEIGHT}
                            style={{
                                display: 'block',
                                cursor: 'pointer',
                                width: `${PIANO_WIDTH}px`,
                                height: `${CANVAS_HEIGHT}px`
                            }}
                        />
                    </div>
                </div>

                {/* Grid and notes - scrollable viewport */}
                <div
                    ref={scrollContainerRef}
                    style={{
                        width: VISIBLE_WIDTH,
                        height: VISIBLE_HEIGHT,
                        overflow: 'auto',
                        position: 'relative',
                        backgroundColor: '#0a0a0a',
                        cursor: isPanning ? 'grabbing' : 'default'
                    }}
                    onScroll={(e) => {
                        setScrollX(e.target.scrollLeft);
                        setScrollY(e.target.scrollTop);
                    }}
                >
                    <div style={{
                        width: `${GRID_WIDTH}px`,
                        height: `${CANVAS_HEIGHT}px`,
                        position: 'relative'
                    }}>
                        <canvas
                            ref={canvasRef}
                            width={GRID_WIDTH}
                            height={CANVAS_HEIGHT}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            style={{
                                display: 'block',
                                cursor: 'crosshair',
                                width: `${GRID_WIDTH}px`,
                                height: `${CANVAS_HEIGHT}px`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Transport controls */}
            <div
                className="nodrag nopan"
                style={{
                display: 'flex',
                gap: 8,
                marginTop: 12,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                        padding: '8px 16px',
                        background: isPlaying ? '#f5576c' : '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                    }}
                >
                    {isPlaying ? 'Stop' : 'Play'}
                </button>

                <button
                    onClick={() => isRecording ? stopRecording() : startRecording()}
                    style={{
                        padding: '8px 16px',
                        background: isRecording ? '#f5576c' : '#ff4444',
                        color: '#fff',
                        border: isRecording ? '2px solid #fff' : 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                    }}
                >
                    {isRecording ? 'Recording...' : 'Record'}
                </button>

                <button
                    onClick={() => {
                        setNotes([]);
                        setSelectedNotes(new Set());
                    }}
                    style={{
                        padding: '8px 16px',
                        background: '#666',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    Clear
                </button>

                <label
                    style={{
                        padding: '8px 16px',
                        background: '#4a9eff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    Import MIDI
                    <input
                        type="file"
                        accept=".mid,.midi"
                        onChange={handleMidiFileImport}
                        style={{ display: 'none' }}
                    />
                </label>

                <button
                    onClick={handleMidiFileExport}
                    style={{
                        padding: '8px 16px',
                        background: '#FF9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    Export MIDI
                </button>

                <button
                    onClick={() => setMetronomeEnabled(!metronomeEnabled)}
                    style={{
                        padding: '8px 16px',
                        background: metronomeEnabled ? '#4CAF50' : '#555',
                        color: '#fff',
                        border: metronomeEnabled ? '2px solid #fff' : 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    {metronomeEnabled ? 'Click: ON' : 'Click: OFF'}
                </button>

                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '11px',
                    color: '#888',
                    marginLeft: 8
                }}>
                    <input
                        type="checkbox"
                        checked={snapEnabled}
                        onChange={(e) => setSnapEnabled(e.target.checked)}
                    />
                    Snap to Grid
                </label>

                <select
                    value={snapDivision}
                    onChange={(e) => setSnapDivision(Number(e.target.value))}
                    disabled={!snapEnabled}
                    style={{
                        padding: '4px 8px',
                        background: '#333',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: 3,
                        fontSize: '11px'
                    }}
                >
                    <option value={4}>1/4</option>
                    <option value={8}>1/8</option>
                    <option value={16}>1/16</option>
                    <option value={32}>1/32</option>
                </select>
            </div>

            {/* Info text */}
            <div
                className="nodrag nopan"
                style={{
                marginTop: 8,
                fontSize: '10px',
                color: isFocused ? '#0af' : '#666',
                textAlign: 'center'
            }}>
                {isFocused ? 'FOCUSED: ' : ''}Click to add • Drag to move • Alt+Drag to select • Cmd/Ctrl+Click for multi-select • Drag edges to resize • Shift+Drag to pan • Delete to remove • {notes.length} notes ({selectedNotes.size} selected)
            </div>

            {/* Vertical resize handle */}
            <div
                className="nodrag nopan"
                onMouseDown={handleVerticalResizeMouseDown}
                style={{
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: 8,
                    cursor: 'ns-resize',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}
                title="Drag to resize vertically"
            >
                <div style={{
                    width: 60,
                    height: 6,
                    background: '#0af',
                    borderRadius: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }} />
            </div>

            {/* Horizontal resize handle */}
            <div
                className="nodrag nopan"
                onMouseDown={handleHorizontalResizeMouseDown}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: -4,
                    bottom: 0,
                    width: 8,
                    cursor: 'ew-resize',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}
                title="Drag to resize horizontally"
            >
                <div style={{
                    width: 6,
                    height: 60,
                    background: '#0af',
                    borderRadius: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }} />
            </div>
        </div>
    );
}
