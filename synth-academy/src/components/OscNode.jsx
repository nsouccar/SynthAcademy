import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position } from 'reactflow';

export function OscNode({ data, id }) {
    const synthRef = useRef(null);
    const canvasRef = useRef(null);
    const nodeRef = useRef(null);

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
        synth.volume.value = -60; // Start muted
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

    // Listen for play sound event from ReactFlow's onNodeClick
    useEffect(() => {
        const playSound = () => {
            console.log('Node clicked!'); // Debug log

            if (!synthRef.current) {
                console.log('No synth ref');
                return;
            }

            console.log('Playing sound');

            // Play the sound
            synthRef.current.volume.rampTo(-10, 0.05);

            // Stop after 500ms
            setTimeout(() => {
                if (synthRef.current) {
                    synthRef.current.volume.rampTo(-60, 0.2);
                }
            }, 500);
        };

        const node = nodeRef.current;
        if (node) {
            node.addEventListener('playSound', playSound);
            return () => {
                node.removeEventListener('playSound', playSound);
            };
        }
    }, []);

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
            {/* Output handle on the right */}
            <Handle type="source" position={Position.Right} />

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
        </div>
    );
}