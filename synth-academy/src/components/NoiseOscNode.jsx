import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position, useReactFlow } from 'reactflow';

export function NoiseOscNode({ data, id }) {
    const synthRef = useRef(null);
    const { setNodes } = useReactFlow();

    const [detune, setDetune] = useState(data?.detune || 0);
    const [octaveOffset, setOctaveOffset] = useState(data?.octaveOffset || 0);

    useEffect(() => {
        const synth = new Tone.Noise('white');
        synth.volume.value = -Infinity;
        synthRef.current = synth;

        synth.start();
        synth.toDestination();

        audioGraph.registerNode(id, synth);

        return () => {
            audioGraph.unregisterNode(id);
            synthRef.current = null;
        };
    }, [id]);

    useEffect(() => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            waveform: 'noise',
                            detune: detune,
                        },
                    };
                }
                return node;
            })
        );
    }, [detune, id, setNodes]);

    useEffect(() => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            waveform: 'noise',
                            octaveOffset: octaveOffset,
                        },
                    };
                }
                return node;
            })
        );
    }, [octaveOffset, id, setNodes]);

    return (
        <div
            style={{
                padding: 10,
                background: '#333',
                color: 'white',
                borderRadius: 6,
                border: '1px solid #ff4aff',
                width: 120,
                textAlign: 'center',
                cursor: 'pointer',
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                id="control-in"
                style={{ background: '#0af', top: '50%' }}
            />

            <Handle
                type="target"
                position={Position.Top}
                id="modulation-in"
                style={{ background: '#f5576c', left: '50%' }}
            />

            <Handle type="source" position={Position.Right} style={{ background: '#0f0' }} />

            <strong style={{ color: '#ff4aff' }}>NOISE</strong>
            <p style={{ fontSize: '0.8em' }}>Oscillator</p>

            <div className="nodrag nopan" style={{ marginTop: 8, fontSize: '0.75em' }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Detune: {detune > 0 ? '+' : ''}{detune}¢
                </label>
                <input
                    type="range"
                    min="-50"
                    max="50"
                    value={detune}
                    onChange={(e) => setDetune(Number(e.target.value))}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <div className="nodrag nopan" style={{ marginTop: 8, fontSize: '0.75em' }}>
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>
        </div>
    );
}
