import React, { useState } from "react";
import * as Tone from "tone";
import OscillatorControl from "./components/OscillatorControl";
import FilterControl from "./components/FilterControl";
import WaveformVisualizer from "./components/WaveformVisualizer";

export default function App() {
  const [filterNode, setFilterNode] = useState(null);

  return (
    <div style={{ padding: 24, color: "#eee", background: "#111", minHeight: screen.height, minWidth: screen.width }}>
      <h1>AI Synth Tutor – Phase 1 (Fixed)</h1>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }}>
        <FilterControl onReady={setFilterNode} />
        <OscillatorControl destination={filterNode} />
      </div>
    </div>
  );
}