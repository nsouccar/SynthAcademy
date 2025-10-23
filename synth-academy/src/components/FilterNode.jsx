import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position, useReactFlow } from 'reactflow';

export function FilterNode({ id, data }) {
    const filterRef = useRef(null);
    const { setNodes } = useReactFlow();

    // Initialize state from node data if available, otherwise use defaults
    const [cutoff, setCutoff] = useState(data?.cutoff !== undefined ? data.cutoff : 50); // 0-100%
    const [resonance, setResonance] = useState(data?.resonance !== undefined ? data.resonance : 0); // 0-100%
    const [filterType, setFilterType] = useState(data?.type || 'lowpass');

    // Convert cutoff percentage to frequency (logarithmic scale 20Hz - 20kHz)
    const percentToFrequency = (percent) => {
        const minFreq = Math.log(20);
        const maxFreq = Math.log(20000);
        return Math.exp(minFreq + (percent / 100) * (maxFreq - minFreq));
    };

    // Convert resonance percentage to Q value (0.1 - 30)
    const percentToQ = (percent) => {
        return 0.1 + (percent / 100) * 29.9;
    };

    const frequency = percentToFrequency(cutoff);
    const qValue = percentToQ(resonance);

    useEffect(() => {
        // Create a filter node
        const filter = new Tone.Filter(frequency, filterType);
        filter.Q.value = qValue;
        filterRef.current = filter;

        // Connect to destination by default
        filter.toDestination();

        // Register with audio graph
        audioGraph.registerNode(id, filter);

        return () => {
            // Unregister from audio graph (handles cleanup)
            audioGraph.unregisterNode(id);
            filterRef.current = null;
        };
    }, [id, frequency, filterType, qValue]);

    // Update filter parameters when they change
    useEffect(() => {
        if (filterRef.current) {
            filterRef.current.frequency.value = frequency;
            filterRef.current.Q.value = qValue;
            filterRef.current.type = filterType;
        }

        // Update the node's data in ReactFlow so templates get the new values
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            cutoff: cutoff,
                            resonance: resonance,
                            frequency: frequency,
                            type: filterType,
                        },
                    };
                }
                return node;
            })
        );

        // Notify AudioGraph so it can update active voices
        audioGraph.notifyParameterChange(id, 'filterNode', 'frequency', frequency);
        audioGraph.notifyParameterChange(id, 'filterNode', 'type', filterType);
    }, [cutoff, resonance, frequency, qValue, filterType, id, setNodes]);

    return (
        <div
            style={{
                padding: 10,
                background: '#333',
                color: 'white',
                borderRadius: 6,
                border: '1px solid #f90',
                width: 140,
                textAlign: 'center',
            }}
        >
            {/* Audio input on the left */}
            <Handle
                type="target"
                position={Position.Left}
                id="audio-in"
                style={{ background: '#0f0', top: '50%' }}
            />

            {/* Modulation input on the top (for envelopes/LFOs) */}
            <Handle
                type="target"
                position={Position.Top}
                id="modulation-in"
                style={{ background: '#f5576c', left: '50%' }}
            />

            <strong style={{ color: '#f90' }}>FILTER</strong>

            <div className="nodrag nopan" style={{ marginTop: 8, fontSize: '0.85em' }}>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        padding: 4,
                        marginBottom: 6,
                        background: '#222',
                        color: 'white',
                        border: '1px solid #555',
                        borderRadius: 3,
                        cursor: 'pointer',
                    }}
                >
                    <option value="lowpass">Lowpass</option>
                    <option value="highpass">Highpass</option>
                    <option value="bandpass">Bandpass</option>
                    <option value="notch">Notch</option>
                </select>

                <label style={{ display: 'block', marginBottom: 4 }}>
                    Cutoff: {cutoff}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={cutoff}
                    onChange={(e) => setCutoff(Number(e.target.value))}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />

                <label style={{ display: 'block', marginTop: 8, marginBottom: 4 }}>
                    Resonance: {resonance}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={resonance}
                    onChange={(e) => setResonance(Number(e.target.value))}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <Handle type="source" position={Position.Right} />
        </div>
    );
}
