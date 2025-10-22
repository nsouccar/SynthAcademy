import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position, useReactFlow } from 'reactflow';

export function OscNode({ data, id }) {
    const synthRef = useRef(null);
    const canvasRef = useRef(null);
    const nodeRef = useRef(null);
    const { setNodes } = useReactFlow();

    // Detune amount in cents (±50 cents range)
    const [detune, setDetune] = useState(data?.detune || 0);

    // Octave offset (-2 to +2 octaves)
    const [octaveOffset, setOctaveOffset] = useState(data?.octaveOffset || 0);

    // Draw waveform visualization
    useEffect(() => {
        if (!canvasRef.current || !data.waveformData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);

        const { real, imag } = data.waveformData;

        // Generate waveform points
        const numPoints = width;
        const waveform = new Float32Array(numPoints);

        for (let i = 0; i < numPoints; i++) {
            const phase = (i / numPoints) * Math.PI * 2;
            let sample = 0;

            for (let n = 1; n < real.length; n++) {
                sample += imag[n] * Math.sin(n * phase);
            }

            waveform[i] = sample;
        }

        // Normalize
        const max = Math.max(...waveform.map(Math.abs));
        if (max > 0) {
            for (let i = 0; i < waveform.length; i++) {
                waveform[i] /= max;
            }
        }

        // Draw waveform
        ctx.beginPath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1.5;

        for (let i = 0; i < numPoints; i++) {
            const x = i;
            const y = height / 2 - (waveform[i] * height * 0.35);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }, [data.waveformData]);

    useEffect(() => {
        // Create oscillator but don't connect to destination yet
        const synth = new Tone.Oscillator(440, data.waveform || 'sine');
        synth.volume.value = -Infinity; // Start completely silent
        synthRef.current = synth;

        // Start the oscillator first
        synth.start();

        // Connect to destination by default (will be disconnected if edges are added)
        synth.toDestination();

        // Register with audio graph
        audioGraph.registerNode(id, synth);

        // If custom waveform data is provided, set it after starting
        if (data.waveformData && data.waveformData.real && data.waveformData.imag) {
            // Wait a tick to ensure oscillator is fully initialized
            setTimeout(() => {
                try {
                    const real = new Float32Array(data.waveformData.real);
                    const imag = new Float32Array(data.waveformData.imag);
                    const wave = synth.context.createPeriodicWave(real, imag);

                    // Check if oscillator exists before setting wave
                    if (synth._oscillator) {
                        synth._oscillator.setPeriodicWave(wave);
                    }
                } catch (e) {
                    console.warn('Failed to set custom waveform:', e);
                }
            }, 50);
        }

        return () => {
            // Unregister from audio graph (handles cleanup)
            audioGraph.unregisterNode(id);
            synthRef.current = null;
        };
    }, [id, data.waveform, data.waveformData]);

    // Update node data when detune changes
    useEffect(() => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            detune: detune,
                        },
                    };
                }
                return node;
            })
        );
    }, [detune, id, setNodes]);

    // Update node data when octave offset changes
    useEffect(() => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            octaveOffset: octaveOffset,
                        },
                    };
                }
                return node;
            })
        );
    }, [octaveOffset, id, setNodes]);

    // Determine label based on waveform type
    const getLabel = () => {
        if (data.waveform === 'custom') {
            return null; // Don't show text label for custom waveforms
        }
        return data.waveform?.toUpperCase() || 'SINE';
    };

    const label = getLabel();

    return (
        <div
            ref={nodeRef}
            style={{
                padding: 10,
                background: '#333',
                color: 'white',
                borderRadius: 6,
                border: '1px solid #0f0',
                width: 120,
                textAlign: 'center',
                cursor: 'pointer',
            }}
        >
            {/* Input handle on the left for control signals (e.g., from piano) */}
            <Handle type="target" position={Position.Left} style={{ background: '#0af' }} />

            {/* Output handle on the right for audio */}
            <Handle type="source" position={Position.Right} style={{ background: '#0f0' }} />

            {label ? (
                <>
                    <strong>{label}</strong>
                    <p style={{ fontSize: '0.8em' }}>Oscillator</p>
                </>
            ) : (
                <>
                    <div style={{
                        width: 100,
                        height: 40,
                        background: '#222',
                        border: '1px solid #444',
                        borderRadius: 4,
                        overflow: 'hidden',
                        margin: '0 auto 8px',
                    }}>
                        <canvas ref={canvasRef} width={100} height={40} style={{ display: 'block' }} />
                    </div>
                    <p style={{ fontSize: '0.8em' }}>Oscillator</p>
                </>
            )}

            {/* Detune slider */}
            <div style={{ marginTop: 8, fontSize: '0.75em' }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Detune: {detune > 0 ? '+' : ''}{detune}¢
                </label>
                <input
                    type="range"
                    min="-50"
                    max="50"
                    value={detune}
                    onChange={(e) => setDetune(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Octave offset slider */}
            <div style={{ marginTop: 8, fontSize: '0.75em' }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Octave: {octaveOffset > 0 ? '+' : ''}{octaveOffset}
                </label>
                <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={octaveOffset}
                    onChange={(e) => setOctaveOffset(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
}