import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

/**
 * GroupNode - Represents a collapsed group of nodes
 *
 * data structure:
 * {
 *   label: string,              // User-given name for the group
 *   collapsedNodes: array,      // Original nodes that were collapsed
 *   collapsedEdges: array,      // Original edges between collapsed nodes
 *   inputNodeIds: array,        // IDs of nodes that receive external input
 *   outputNodeIds: array        // IDs of nodes that send output externally
 * }
 */
export function GroupNode({ id, data }) {
    const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data?.label || 'Group');

    // Handle label editing
    const handleLabelChange = (e) => {
        const newLabel = e.target.value;
        setLabel(newLabel);

        // Update node data
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, label: newLabel }
                    };
                }
                return node;
            })
        );
    };

    // Expand the group back to individual nodes
    const handleExpand = () => {
        const nodes = getNodes();
        const edges = getEdges();

        // Get the current position of the group node
        const groupNode = nodes.find(n => n.id === id);
        if (!groupNode) return;

        const groupPosition = groupNode.position;

        // Restore collapsed nodes with adjusted positions
        const restoredNodes = data.collapsedNodes.map((node, index) => ({
            ...node,
            position: {
                x: groupPosition.x + node.position.x,
                y: groupPosition.y + node.position.y
            }
        }));

        // Find edges connected to this group node
        const externalEdges = edges.filter(edge =>
            edge.source === id || edge.target === id
        );

        // Recreate external connections
        const newExternalEdges = externalEdges.map(edge => {
            if (edge.source === id) {
                // Connection FROM group - reconnect from output nodes
                const outputNodeId = data.outputNodeIds[0] || data.collapsedNodes[data.collapsedNodes.length - 1].id;
                return {
                    ...edge,
                    source: outputNodeId,
                    sourceHandle: null
                };
            } else {
                // Connection TO group - reconnect to input nodes
                const inputNodeId = data.inputNodeIds[0] || data.collapsedNodes[0].id;
                return {
                    ...edge,
                    target: inputNodeId,
                    targetHandle: null
                };
            }
        });

        // Remove group node and add back original nodes
        setNodes((nds) => [
            ...nds.filter(n => n.id !== id),
            ...restoredNodes
        ]);

        // Remove group edges and restore internal + external edges
        setEdges((eds) => [
            ...eds.filter(e => e.source !== id && e.target !== id),
            ...data.collapsedEdges,
            ...newExternalEdges
        ]);
    };

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid #fff',
                borderRadius: 8,
                padding: 16,
                minWidth: 160,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#fff', width: 12, height: 12 }}
            />

            {/* Label */}
            <div style={{ marginBottom: 12, textAlign: 'center' }}>
                {isEditing ? (
                    <input
                        type="text"
                        value={label}
                        onChange={handleLabelChange}
                        onBlur={() => setIsEditing(false)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') setIsEditing(false);
                        }}
                        autoFocus
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid #fff',
                            borderRadius: 4,
                            padding: '4px 8px',
                            color: '#fff',
                            fontSize: '1em',
                            fontWeight: 'bold',
                            width: '100%',
                            textAlign: 'center'
                        }}
                    />
                ) : (
                    <div
                        onDoubleClick={() => setIsEditing(true)}
                        style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1em',
                            cursor: 'text',
                            padding: '4px 8px'
                        }}
                    >
                        {label}
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{
                fontSize: '0.75em',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 8,
                textAlign: 'center'
            }}>
                {data.collapsedNodes?.length || 0} nodes grouped
            </div>

            {/* Expand button */}
            <button
                onClick={handleExpand}
                style={{
                    width: '100%',
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid #fff',
                    borderRadius: 4,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85em',
                    fontWeight: 'bold'
                }}
            >
                Expand
            </button>

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#fff', width: 12, height: 12 }}
            />
        </div>
    );
}
