import React, { useRef, useState, useEffect } from "react";
import * as Tone from "tone";

export function WaveformGraph2D() {
    const canvasRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const [isDragging, setDragging] = useState(false);
    const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
    const [isExpanded, setIsExpanded] = useState(false);
    const synthRef = useRef(null);
    const isPlayingRef = useRef(false);
    const rafIdRef = useRef(null);
    const currentWaveformRef = useRef({ real: null, imag: null });

    // Create custom waveform by blending harmonics
    const createBlendedWaveform = (x, y) => {
        // Define harmonic content for each basic waveform
        // Sine: only fundamental (1st harmonic)
        // Triangle: odd harmonics with 1/n^2 amplitude (alternating phase)
        // Sawtooth: all harmonics with 1/n amplitude
        // Square: odd harmonics with 1/n amplitude

        const numHarmonics = 32;
        const real = new Float32Array(numHarmonics);
        const imag = new Float32Array(numHarmonics);

        // X-axis: Round (left) to Sharp (right)
        // Y-axis: Cold (bottom) to Warm (top)

        // Weight factors for blending - use smooth interpolation
        const sharpness = x; // 0 = round, 1 = sharp
        const warmth = y;    // 0 = cold, 1 = warm

        // Calculate corner weights for bilinear interpolation
        const sineWeight = (1 - sharpness) * warmth;           // top-left
        const sawtoothWeight = sharpness * warmth;             // top-right
        const triangleWeight = (1 - sharpness) * (1 - warmth); // bottom-left
        const squareWeight = sharpness * (1 - warmth);         // bottom-right

        for (let n = 1; n < numHarmonics; n++) {
            let amplitude = 0;

            // Sine wave (warm, round) - only fundamental
            if (n === 1) {
                amplitude += sineWeight;
            }

            // Triangle wave (cold, round) - odd harmonics with alternating phase, 1/n^2
            if (n % 2 === 1) {
                const sign = ((n - 1) / 2) % 2 === 0 ? 1 : -1;
                const triangleAmp = sign * (1 / (n * n)) * triangleWeight;
                amplitude += triangleAmp * 8; // Scale up triangle for better volume
            }

            // Sawtooth wave (warm, sharp) - all harmonics, 1/n
            const sawtoothAmp = (1 / n) * sawtoothWeight;
            amplitude += sawtoothAmp * 2; // Scale up sawtooth

            // Square wave (cold, sharp) - odd harmonics, 1/n
            if (n % 2 === 1) {
                const squareAmp = (1 / n) * squareWeight;
                amplitude += squareAmp * 4; // Scale up square
            }

            // Store in imaginary component (sine terms)
            imag[n] = amplitude;
        }

        return { real, imag };
    };

    // Draw waveform on canvas
    const drawWaveform = (real, imag) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Generate waveform points by summing harmonics
        const numPoints = width;
        const waveform = new Float32Array(numPoints);

        for (let i = 0; i < numPoints; i++) {
            const phase = (i / numPoints) * Math.PI * 2; // One complete cycle
            let sample = 0;

            // Sum up all harmonics
            for (let n = 1; n < real.length; n++) {
                sample += imag[n] * Math.sin(n * phase);
            }

            waveform[i] = sample;
        }

        // Normalize waveform
        const max = Math.max(...waveform.map(Math.abs));
        if (max > 0) {
            for (let i = 0; i < waveform.length; i++) {
                waveform[i] /= max;
            }
        }

        // Draw waveform
        ctx.beginPath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;

        for (let i = 0; i < numPoints; i++) {
            const x = i;
            const y = height / 2 - (waveform[i] * height * 0.4);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Draw center line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    };

    // Update audio parameters directly without state
    const updateAudio = (x, y) => {
        if (!synthRef.current || !isPlayingRef.current) return;
        const { osc } = synthRef.current;

        try {
            // Create blended waveform
            const { real, imag } = createBlendedWaveform(x, y);

            // Store current waveform
            currentWaveformRef.current = { real, imag };

            // Create and set custom periodic wave
            const wave = osc.context.createPeriodicWave(real, imag);
            osc._oscillator.setPeriodicWave(wave);

            // Draw waveform visualization
            drawWaveform(real, imag);
        } catch (e) {
            console.warn("Could not update waveform:", e);
        }

        // Keep frequency constant at 440Hz (A4)
        // No pitch changes, only waveform morphing
    };

    // Draw preview waveform in collapsed state
    const drawPreviewWaveform = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !currentWaveformRef.current.real) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        const { real, imag } = currentWaveformRef.current;

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
    };

    // Update preview when waveform changes or component collapses
    useEffect(() => {
        if (!isExpanded && currentWaveformRef.current.real) {
            drawPreviewWaveform();
        }
    }, [isExpanded, pos]);

    // Handle mouse movement with throttling
    const handleMouse = (e) => {
        if (!isDragging) return;

        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height; // flip Y
        const newX = Math.min(Math.max(x, 0), 1);
        const newY = Math.min(Math.max(y, 0), 1);

        // Update audio immediately
        updateAudio(newX, newY);

        // Throttle visual updates
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
            setPos({ x: newX, y: newY });
        });
    };

    // Initialize oscillator and default waveform
    useEffect(() => {
        const osc = new Tone.Oscillator(440, "sine").toDestination();
        osc.volume.value = -60; // Start muted
        synthRef.current = { osc };

        // Initialize with default waveform (center position)
        const { real, imag } = createBlendedWaveform(0.5, 0.5);
        currentWaveformRef.current = { real, imag };

        // Draw preview after a short delay to ensure canvas is mounted
        setTimeout(() => drawPreviewWaveform(), 100);

        return () => {
            osc.stop();
            osc.dispose();
        };
    }, []);

    const startAudio = async (e) => {
        await Tone.start();
        setDragging(true);
        isPlayingRef.current = true;
        if (synthRef.current?.osc.state !== "started") {
            synthRef.current.osc.start();
        }
        // Fade in volume smoothly
        synthRef.current.osc.volume.rampTo(-20, 0.05);

        // Get initial position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;
        const newX = Math.min(Math.max(x, 0), 1);
        const newY = Math.min(Math.max(y, 0), 1);

        setPos({ x: newX, y: newY });
        updateAudio(newX, newY);
    };

    const handleClick = async (e) => {
        // Only handle click if not currently dragging
        if (!isDragging) {
            await Tone.start();
            isPlayingRef.current = true;
            if (synthRef.current?.osc.state !== "started") {
                synthRef.current.osc.start();
            }
            // Fade in volume smoothly
            synthRef.current.osc.volume.rampTo(-20, 0.05);

            // Get click position
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1 - (e.clientY - rect.top) / rect.height;
            const newX = Math.min(Math.max(x, 0), 1);
            const newY = Math.min(Math.max(y, 0), 1);

            setPos({ x: newX, y: newY });
            updateAudio(newX, newY);

            // Play for a short duration, then fade out
            setTimeout(() => {
                if (synthRef.current?.osc) {
                    synthRef.current.osc.volume.rampTo(-60, 0.2);
                }
            }, 500); // Play for 500ms
        }
    };

    const stopAudio = () => {
        setDragging(false);
        isPlayingRef.current = false;
        // Cancel any pending animation frames
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        // Keep oscillator running but mute it smoothly
        if (synthRef.current?.osc) {
            synthRef.current.osc.volume.rampTo(-60, 0.1);
        }
        // Don't collapse - just stop the audio
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: 20 }}>
            {!isExpanded ? (
                // Collapsed state - show button with preview
                <button
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('waveform', 'custom');
                        e.dataTransfer.setData('waveformData', JSON.stringify({
                            x: pos.x,
                            y: pos.y,
                            real: Array.from(currentWaveformRef.current.real || []),
                            imag: Array.from(currentWaveformRef.current.imag || [])
                        }));
                    }}
                    onClick={(e) => {
                        // Prevent expanding when starting to drag
                        if (!e.defaultPrevented) {
                            setIsExpanded(true);
                        }
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        background: "#2a2a2a",
                        border: "2px solid #444",
                        borderRadius: 8,
                        color: "#ccc",
                        fontSize: 14,
                        fontWeight: "bold",
                        cursor: "grab",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#333";
                        e.currentTarget.style.borderColor = "#666";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#2a2a2a";
                        e.currentTarget.style.borderColor = "#444";
                    }}
                >
                    <span>Audio Graph</span>
                    <div style={{
                        width: 80,
                        height: 30,
                        background: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: 4,
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}>
                        <canvas ref={previewCanvasRef} width={80} height={30} style={{ display: "block" }} />
                    </div>
                </button>
            ) : (
                // Expanded state - show waveform display and 2D pad
                <>
                    {/* Header with close button */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                    }}>
                        <div style={{ color: "#ccc", fontWeight: "bold" }}>Audio Graph</div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            style={{
                                background: "#2a2a2a",
                                border: "1px solid #444",
                                borderRadius: 4,
                                color: "#ccc",
                                padding: "4px 12px",
                                cursor: "pointer",
                                fontSize: 12,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#333"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#2a2a2a"}
                        >
                            Close
                        </button>
                    </div>

                    {/* Waveform Display */}
                    <div style={{
                        width: 300,
                        height: 100,
                        background: "#1a1a1a",
                        border: "2px solid #333",
                        borderRadius: 10,
                        overflow: "hidden",
                    }}>
                        <canvas ref={canvasRef} width={300} height={100} style={{ display: "block" }} />
                    </div>

                    {/* 2D Pad */}
                    <div
                        style={{
                            width: 300,
                            height: 300,
                            background: "radial-gradient(circle at 50% 50%, #333, #0a0a0a)",
                            border: "2px solid #333",
                            borderRadius: 10,
                            position: "relative",
                            cursor: "crosshair",
                        }}
                        onClick={handleClick}
                        onMouseDown={startAudio}
                        onMouseUp={stopAudio}
                        onMouseLeave={stopAudio}
                        onMouseMove={handleMouse}
                    >

                        {/* Quadrant Labels */}
                        <div style={{
                            position: "absolute",
                            top: 10,
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "#888",
                            fontSize: 14,
                            fontWeight: "bold",
                            letterSpacing: 2,
                            pointerEvents: "none",
                        }}>
                            WARM
                        </div>
                        <div style={{
                            position: "absolute",
                            bottom: 10,
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "#888",
                            fontSize: 14,
                            fontWeight: "bold",
                            letterSpacing: 2,
                            pointerEvents: "none",
                        }}>
                            COLD
                        </div>
                        <div style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#888",
                            fontSize: 14,
                            fontWeight: "bold",
                            letterSpacing: 2,
                            pointerEvents: "none",
                        }}>
                            ROUND
                        </div>
                        <div style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#888",
                            fontSize: 14,
                            fontWeight: "bold",
                            letterSpacing: 2,
                            pointerEvents: "none",
                        }}>
                            SHARP
                        </div>

                        {/* Center crosshair */}
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
                            height: 1,
                            background: "rgba(255,255,255,0.1)",
                            pointerEvents: "none",
                        }} />
                        <div style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            bottom: 0,
                            width: 1,
                            background: "rgba(255,255,255,0.1)",
                            pointerEvents: "none",
                        }} />

                        {/* Waveform type indicators */}
                        {/* SINE - top left (warm, round) */}
                        <div style={{
                            position: "absolute",
                            left: "15%",
                            top: "15%",
                            transform: "translate(-50%, -50%)",
                            color: "#ff9999",
                            fontSize: 10,
                            opacity: 0.6,
                            pointerEvents: "none",
                        }}>SINE</div>

                        {/* SAWTOOTH - top right (warm, sharp) */}
                        <div style={{
                            position: "absolute",
                            right: "10%",
                            top: "15%",
                            transform: "translateY(-50%)",
                            color: "#ffff99",
                            fontSize: 10,
                            opacity: 0.6,
                            pointerEvents: "none",
                        }}>SAW</div>

                        {/* TRIANGLE - left (round) */}
                        <div style={{
                            position: "absolute",
                            left: "10%",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#ffff99",
                            fontSize: 10,
                            opacity: 0.6,
                            pointerEvents: "none",
                        }}>TRI</div>

                        {/* SQUARE - bottom center (cold) */}
                        <div style={{
                            position: "absolute",
                            left: "50%",
                            bottom: "20%",
                            transform: "translateX(-50%)",
                            color: "#99ffcc",
                            fontSize: 10,
                            opacity: 0.6,
                            pointerEvents: "none",
                        }}>SQR</div>

                        {/* Additional SQUARE indicator - right (sharp) */}
                        <div style={{
                            position: "absolute",
                            right: "15%",
                            top: "60%",
                            color: "#99ccff",
                            fontSize: 10,
                            opacity: 0.6,
                            pointerEvents: "none",
                        }}>SQR</div>

                        {/* Cursor */}
                        <div
                            style={{
                                position: "absolute",
                                left: `${pos.x * 100}%`,
                                top: `${(1 - pos.y) * 100}%`,
                                transform: "translate(-50%, -50%)",
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: isDragging ? "#0f0" : "#555",
                                border: "2px solid " + (isDragging ? "#fff" : "#888"),
                                pointerEvents: "none",
                                willChange: "transform, left, top",
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
