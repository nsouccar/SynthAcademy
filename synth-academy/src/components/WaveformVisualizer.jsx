import React, { useEffect, useRef } from "react";
import * as Tone from "tone";

export default function WaveformVisualizer() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const analyser = new Tone.Analyser("waveform", 256);
        const osc = new Tone.Oscillator(440, "sine").connect(analyser).toDestination();
        osc.start();

        const ctx = canvasRef.current.getContext("2d");

        function draw() {
            requestAnimationFrame(draw);
            const values = analyser.getValue();
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.beginPath();
            values.forEach((v, i) => {
                const x = (i / values.length) * canvasRef.current.width;
                const y = (1 - (v + 1) / 2) * canvasRef.current.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = "#0f0";
            ctx.stroke();
        }

        draw();
        return () => osc.stop();
    }, []);

    return (
        <div style={{ padding: 16, border: "1px solid #555", borderRadius: 8 }}>
            <h3>Waveform Visualizer</h3>
            <canvas ref={canvasRef} width={300} height={120}></canvas>
        </div>
    );
}