import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

export default function OscillatorControl({ destination }) {
    const [waveform, setWaveform] = useState("sawtooth");
    const [frequency, setFrequency] = useState(440);
    const [isPlaying, setIsPlaying] = useState(false);
    const oscRef = useRef(null);

    // Create oscillator once
    useEffect(() => {
        oscRef.current = new Tone.Oscillator(frequency, waveform);
        return () => {
            oscRef.current?.dispose(); // ensures cleanup on unmount
        };
    }, []); // only run once

    // Handle frequency/waveform changes
    useEffect(() => {
        if (oscRef.current) {
            oscRef.current.frequency.value = frequency;
            oscRef.current.type = waveform;
        }
    }, [frequency, waveform]);

    const togglePlay = async () => {
        await Tone.start();
        if (isPlaying) {
            oscRef.current.stop();
            oscRef.current.disconnect(); // ensure it's removed from audio graph
            setIsPlaying(false);
        } else {
            oscRef.current.connect(destination || Tone.Destination);
            oscRef.current.start();
            setIsPlaying(true);
        }
    };

    return (
        <div style={{ padding: 16, border: "1px solid #555", borderRadius: 8 }}>
            <h3>Oscillator</h3>

            <label>Waveform:</label>
            <select value={waveform} onChange={(e) => setWaveform(e.target.value)}>
                <option>sine</option>
                <option>sawtooth</option>
                <option>square</option>
                <option>triangle</option>
            </select>

            <br />
            <label>Frequency:</label>
            <input
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(+e.target.value)}
                style={{ width: "70px" }}
            />

            <br />
            <button onClick={togglePlay}>
                {isPlaying ? "Stop" : "Start"}
            </button>
        </div>
    );
}