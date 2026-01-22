import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { audioGraph } from '../AudioGraph';
import { Handle, Position } from 'reactflow';

/**
 * OutputNode marks the END of a voice chain.
 *
 * Purpose:
 * - Tells the system "this is where the voice ends"
 * - Piano looks for chains ending in OutputNode
 * - When found, converts that chain into a voice template
 *
 * Example chain:
 * [Piano] → [Osc] → [Filter] → [Mixer] → [OUTPUT] ← You place this at the end
 */
export function OutputNode({ id }) {
    const gainRef = useRef(null);

    useEffect(() => {
        // Create a simple Gain node (just passes audio through)
        // We need an actual audio node so the chain can connect to it
        const gain = new Tone.Gain(1);
        gainRef.current = gain;

        // Connect to speakers
        gain.toDestination();

        // Register with audio graph
        audioGraph.registerNode(id, gain);

        return () => {
            audioGraph.unregisterNode(id);
            gainRef.current = null;
        };
    }, [id]);

    return (
        <div
            style={{
                padding: 12,
                background: '#1a1a1a',
                color: 'white',
                borderRadius: 6,
                border: '2px solid #f0f',
                width: 100,
                textAlign: 'center',
                boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)',
            }}
        >
            {/* Input handle only - this is the END of the chain */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#f0f', width: 24, height: 24, left: -12 }}
            />

            <div style={{ marginBottom: 4 }}>
                <strong style={{ color: '#f0f', fontSize: '0.9em' }}>OUTPUT</strong>
            </div>

            <div style={{
                fontSize: '0.65em',
                color: '#999',
                lineHeight: 1.3
            }}>
                Voice Chain End
            </div>

            <div style={{
                marginTop: 6,
                fontSize: '1.5em',
            }}>
                OUT
            </div>
        </div>
    );
}
