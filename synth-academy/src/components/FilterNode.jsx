import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position, useReactFlow } from 'reactflow';

export function FilterNode({ id, data }) {
    const filterRef = useRef(null);
    const { setNodes } = useReactFlow();

    // Initialize state from node data if available, otherwise use defaults
    const [frequency, setFrequency] = useState(data?.frequency || 1000);
    const [filterType, setFilterType] = useState(data?.type || 'lowpass');

    useEffect(() => {
        // Create a filter node
        const filter = new Tone.Filter(frequency, filterType);
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
    }, [id]);

    // Update filter parameters when they change
    useEffect(() => {
        if (filterRef.current) {
            filterRef.current.frequency.value = frequency;
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
    }, [frequency, filterType, id, setNodes]);

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
                    Freq: {frequency}Hz
                </label>
                <input
                    type="range"
                    min="20"
                    max="20000"
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value))}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <Handle type="source" position={Position.Right} />
        </div>
    );
}
