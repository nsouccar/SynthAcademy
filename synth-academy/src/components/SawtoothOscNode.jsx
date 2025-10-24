import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position, useReactFlow } from 'reactflow';

export function SawtoothOscNode({ data, id }) {
    const synthRef = useRef(null);
    const { setNodes } = useReactFlow();

    const [detune, setDetune] = useState(data?.detune || 0);
    const [octaveOffset, setOctaveOffset] = useState(data?.octaveOffset || 0);
    const [unisonVoices, setUnisonVoices] = useState(data?.unisonVoices || 1);
    const [unisonSpread, setUnisonSpread] = useState(data?.unisonSpread || 50);

    // Tutorial mode
    const tutorialMode = data?.tutorialMode || false;
    const blurredParams = data?.blurredParams || [];

    console.log('SawtoothOscNode - tutorialMode:', tutorialMode, 'blurredParams:', blurredParams);

    // Helper to check if a parameter should be blurred
    const isParamBlurred = (paramName) => {
        return tutorialMode && blurredParams.includes(paramName);
    };

    // Dispatch tutorial parameter change events
    const handleParameterChange = (parameter, value, setter) => {
        setter(value);
        if (tutorialMode) {
            window.dispatchEvent(new CustomEvent('tutorialParameterChange', {
                detail: { nodeId: id, parameter, value }
            }));
        }
    };

    useEffect(() => {
        const synth = new Tone.Oscillator(440, 'sawtooth');
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
                            waveform: 'sawtooth',
                            detune: detune,
                            octaveOffset: octaveOffset,
                            unisonVoices: unisonVoices,
                            unisonSpread: unisonSpread,
                        },
                    };
                }
                return node;
            })
        );
    }, [detune, octaveOffset, unisonVoices, unisonSpread, id, setNodes]);

    return (
        <div
            style={{
                padding: 10,
                background: '#333',
                color: 'white',
                borderRadius: 6,
                border: '1px solid #4aff4a',
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

            <strong style={{ color: '#4aff4a' }}>SAWTOOTH</strong>
            <p style={{ fontSize: '0.8em' }}>Oscillator</p>

            <div className="nodrag nopan" style={{
                marginTop: 8,
                fontSize: '0.75em',
                filter: isParamBlurred('detune') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('detune') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('detune') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Detune: {detune > 0 ? '+' : ''}{detune}¢
                </label>
                <input
                    type="range"
                    min="-50"
                    max="50"
                    value={detune}
                    onChange={(e) => handleParameterChange('detune', Number(e.target.value), setDetune)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <div className="nodrag nopan" style={{
                marginTop: 8,
                fontSize: '0.75em',
                filter: isParamBlurred('octaveOffset') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('octaveOffset') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('octaveOffset') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Octave: {octaveOffset > 0 ? '+' : ''}{octaveOffset}
                </label>
                <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={octaveOffset}
                    onChange={(e) => handleParameterChange('octaveOffset', Number(e.target.value), setOctaveOffset)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <div className="nodrag nopan" style={{
                marginTop: 8,
                fontSize: '0.75em',
                filter: isParamBlurred('unisonVoices') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('unisonVoices') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('unisonVoices') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Voices: {unisonVoices}
                </label>
                <input
                    type="range"
                    min="1"
                    max="7"
                    step="1"
                    value={unisonVoices}
                    onChange={(e) => handleParameterChange('unisonVoices', Number(e.target.value), setUnisonVoices)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>

            <div className="nodrag nopan" style={{
                marginTop: 8,
                fontSize: '0.75em',
                filter: isParamBlurred('unisonSpread') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('unisonSpread') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('unisonSpread') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Spread: {unisonSpread}¢
                </label>
                <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={unisonSpread}
                    onChange={(e) => handleParameterChange('unisonSpread', Number(e.target.value), setUnisonSpread)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
            </div>
        </div>
    );
}
