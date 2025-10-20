import React, { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

export default function FilterControl({ onReady }) {
    const [cutoff, setCutoff] = useState(800);
    const filterRef = useRef(null);

    useEffect(() => {
        filterRef.current = new Tone.Filter(cutoff, "lowpass").toDestination();
        if (onReady) onReady(filterRef.current);
        return () => filterRef.current.dispose();
    }, []);

    useEffect(() => {
        if (filterRef.current) {
            filterRef.current.frequency.value = cutoff;
        }
    }, [cutoff]);

    return (
        <div style={{ padding: 16, border: "1px solid #555", borderRadius: 8 }}>
            <h3>Filter</h3>
            <label>Cutoff: {cutoff} Hz</label>
            <input
                type="range"
                min="100"
                max="10000"
                step="50"
                value={cutoff}
                onChange={(e) => setCutoff(+e.target.value)}
            />
        </div>
    );
}