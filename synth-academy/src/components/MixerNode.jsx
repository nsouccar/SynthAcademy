import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position } from 'reactflow';

export function MixerNode({ id }) {
    const channelRef = useRef(null);
    const [volume, setVolume] = useState(0); // 0 dB

    useEffect(() => {
        // Create a Channel (combines multiple inputs into one output)
        // Channel is like a mixer channel - multiple sources can connect to it
        const channel = new Tone.Channel({
            volume: volume,
        });

        channelRef.current = channel;

        // Connect to destination by default
        channel.toDestination();

        // Register with audio graph
        audioGraph.registerNode(id, channel);

        return () => {
            // Unregister from audio graph (handles cleanup)
            audioGraph.unregisterNode(id);
            channelRef.current = null;
        };
    }, [id]);

    // Update volume when slider changes
    useEffect(() => {
        if (channelRef.current) {
            channelRef.current.volume.value = volume;
        }
    }, [volume]);

    return (
        <div
            style={{
                padding: 10,
                background: '#333',
                color: 'white',
                borderRadius: 6,
                border: '1px solid #0f0',
                width: 140,
                textAlign: 'center',
            }}
        >
            {/* Multiple input handles on the left */}
            <Handle
                type="target"
                position={Position.Left}
                id="input-1"
                style={{ top: '30%', background: '#0f0' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="input-2"
                style={{ top: '50%', background: '#0f0' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="input-3"
                style={{ top: '70%', background: '#0f0' }}
            />

            <strong style={{ color: '#0f0' }}>MIXER</strong>

            <div style={{ marginTop: 8, fontSize: '0.85em' }}>
                <label style={{ display: 'block', marginBottom: 4 }}>
                    Volume: {volume > 0 ? '+' : ''}{volume}dB
                </label>
                <input
                    type="range"
                    min="-30"
                    max="12"
                    step="1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ fontSize: '0.7em', color: '#888', marginTop: 6 }}>
                Combines inputs
            </div>

            {/* Output handle on the right */}
            <Handle type="source" position={Position.Right} style={{ background: '#0f0' }} />
        </div>
    );
}
