import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Handle, Position } from 'reactflow';
import { audioGraph } from '../AudioGraph';

export function TVNode({ id }) {
    const canvasRef = useRef(null);
    const analyserRef = useRef(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Create analyser for monitoring audio
        // 'waveform' mode captures time-domain data (the wave shape)
        // 1024 samples provides good detail without too much overhead
        const analyser = new Tone.Analyser('waveform', 1024);
        analyserRef.current = analyser;

        // Register with audio graph as a monitor node
        audioGraph.registerNode(id, analyser, { isMonitor: true });

        return () => {
            // Cleanup when node is removed
            audioGraph.unregisterNode(id);
            analyserRef.current = null;
        };
    }, [id]);

    // Animation loop for real-time waveform display
    useEffect(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        let animationId;

        function draw() {
            // Get current waveform data from analyser
            // Returns Float32Array with values from -1 to 1
            const values = analyser.getValue();

            // Clear canvas with dark background
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw center line (0V reference)
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            // Draw waveform
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let i = 0; i < values.length; i++) {
                // Map array index to canvas x coordinate
                const x = (i / values.length) * canvas.width;

                // Map waveform value (-1 to 1) to canvas y coordinate
                // -1 (bottom) → canvas.height
                //  0 (center) → canvas.height / 2
                //  1 (top) → 0
                const y = ((1 - values[i]) / 2) * canvas.height;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();

            // Check if there's an actual signal (not just silence)
            const hasSignal = values.some(v => Math.abs(v) > 0.01);
            setIsActive(hasSignal);

            // Continue animation loop
            animationId = requestAnimationFrame(draw);
        }

        draw();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, []);

    return (
        <div
            style={{
                padding: 10,
                background: '#222',
                color: 'white',
                borderRadius: 6,
                border: `2px solid ${isActive ? '#0f0' : '#333'}`,
                width: 200,
                textAlign: 'center',
            }}
        >
            {/* Monitor input handle (top) - connects to audio source */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: '#0f0' }}
            />

            <strong style={{ color: '#0f0' }}>📺 TV / SCOPE</strong>

            {/* Waveform display canvas */}
            <div
                style={{
                    marginTop: 8,
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: 4,
                    overflow: 'hidden',
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={180}
                    height={100}
                    style={{ display: 'block' }}
                />
            </div>

            {/* Signal indicator */}
            <div
                style={{
                    fontSize: '0.7em',
                    color: isActive ? '#0f0' : '#666',
                    marginTop: 4,
                    fontWeight: 'bold',
                }}
            >
                {isActive ? '● SIGNAL DETECTED' : '○ NO SIGNAL'}
            </div>
        </div>
    );
}
