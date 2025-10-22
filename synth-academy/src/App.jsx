import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { addEdge, Background, Controls, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { WaveformGraph2D } from './components/WaveformGraph2D';
import { OscNode } from './components/OscNode';
import { FilterNode } from './components/FilterNode';
import { PianoNode } from './components/PianoNode';
import { OutputNode } from './components/OutputNode';
import { GroupNode } from './components/GroupNode';
import { EnvelopeNode } from './components/EnvelopeNode';
import { audioGraph, setVoiceManager } from './AudioGraph';
import { voiceManager } from './VoiceManager';

import 'reactflow/dist/style.css';

// Initialize the voice manager reference in AudioGraph
setVoiceManager(voiceManager);

// Register node types outside component to avoid warning
const nodeTypes = {
  oscNode: OscNode,
  filterNode: FilterNode,
  pianoNode: PianoNode,
  outputNode: OutputNode,
  groupNode: GroupNode,
  envelopeNode: EnvelopeNode
};

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Handle waveform drop
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const waveform = event.dataTransfer.getData('waveform');
    const waveformDataStr = event.dataTransfer.getData('waveformData');

    // Only handle if waveform data exists
    if (!waveform) return;

    const id = `${Date.now()}`;
    const bounds = event.currentTarget.getBoundingClientRect();

    // Parse custom waveform data if available
    let waveformData = null;
    if (waveformDataStr) {
      try {
        waveformData = JSON.parse(waveformDataStr);
      } catch (e) {
        console.warn('Failed to parse waveform data:', e);
      }
    }

    setNodes((nds) =>
      nds.concat({
        id,
        type: 'oscNode',
        position: {
          x: event.clientX - bounds.left - 60,
          y: event.clientY - bounds.top - 40,
        },
        data: {
          waveform,
          waveformData, // Custom waveform harmonic data
        },
      })
    );
  }, []);

  // Allow dragging over
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle connections
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  // Handle node changes (dragging, selection, etc.)
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Sync audio graph connections whenever edges change
  useEffect(() => {
    audioGraph.syncConnections(edges);
  }, [edges]);

  // Scan for voice templates whenever nodes or edges change
  useEffect(() => {
    audioGraph.scanForVoiceTemplates(nodes, edges);
  }, [nodes, edges]);

  // Cleanup audio graph on unmount
  useEffect(() => {
    return () => {
      audioGraph.cleanup();
    };
  }, []);

  // Add a filter node at the center of the viewport
  const addFilterNode = useCallback(() => {
    const id = `filter-${Date.now()}`;
    const newNode = {
      id,
      type: 'filterNode',
      position: { x: 250, y: 100 },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Add a piano node
  const addPianoNode = useCallback(() => {
    const id = `piano-${Date.now()}`;
    const newNode = {
      id,
      type: 'pianoNode',
      position: { x: 250, y: 250 },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Add an output node
  const addOutputNode = useCallback(() => {
    const id = `output-${Date.now()}`;
    const newNode = {
      id,
      type: 'outputNode',
      position: { x: 500, y: 250 },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Add an envelope node
  const addEnvelopeNode = useCallback(() => {
    const id = `envelope-${Date.now()}`;
    const newNode = {
      id,
      type: 'envelopeNode',
      position: { x: 400, y: 150 },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Auto-collapse oscillators into "Color" group
  const createColorGroup = useCallback(() => {
    // Find all oscillator nodes
    const colorNodes = nodes.filter(node =>
      node.type === 'oscNode'
    );

    if (colorNodes.length < 1) {
      alert('No oscillators found to group');
      return;
    }

    // Collapse logic
    const selectedNodeIds = new Set(colorNodes.map(n => n.id));

    // Find edges internal to the group
    const internalEdges = edges.filter(edge =>
      selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    // Find input nodes (nodes receiving connections from outside)
    const inputNodeIds = colorNodes
      .filter(node =>
        edges.some(edge => edge.target === node.id && !selectedNodeIds.has(edge.source))
      )
      .map(n => n.id);

    // Find output nodes (nodes sending connections to outside)
    const outputNodeIds = colorNodes
      .filter(node =>
        edges.some(edge => edge.source === node.id && !selectedNodeIds.has(edge.target))
      )
      .map(n => n.id);

    // Calculate bounding box for collapsed nodes
    const minX = Math.min(...colorNodes.map(n => n.position.x));
    const minY = Math.min(...colorNodes.map(n => n.position.y));
    const maxX = Math.max(...colorNodes.map(n => n.position.x + 150));
    const maxY = Math.max(...colorNodes.map(n => n.position.y + 100));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Store original positions relative to group center
    const nodesWithRelativePos = colorNodes.map(node => ({
      ...node,
      position: {
        x: node.position.x - centerX,
        y: node.position.y - centerY
      },
      selected: false
    }));

    // Create group node
    const groupId = `group-${Date.now()}`;
    const groupNode = {
      id: groupId,
      type: 'groupNode',
      position: { x: centerX - 80, y: centerY - 50 },
      data: {
        label: 'Color',
        collapsedNodes: nodesWithRelativePos,
        collapsedEdges: internalEdges,
        inputNodeIds,
        outputNodeIds
      }
    };

    // Find external edges (connections to/from the group)
    const externalEdges = edges.filter(edge => {
      const sourceInGroup = selectedNodeIds.has(edge.source);
      const targetInGroup = selectedNodeIds.has(edge.target);
      return sourceInGroup !== targetInGroup; // XOR - one in, one out
    });

    // Reconnect external edges to the group node
    const reconnectedEdges = externalEdges.map(edge => {
      if (selectedNodeIds.has(edge.source)) {
        // Edge FROM group
        return { ...edge, source: groupId, sourceHandle: null };
      } else {
        // Edge TO group
        return { ...edge, target: groupId, targetHandle: null };
      }
    });

    // Update nodes and edges
    setNodes((nds) => [
      ...nds.filter(n => !selectedNodeIds.has(n.id)),
      groupNode
    ]);

    setEdges((eds) => [
      ...eds.filter(e =>
        !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
      ),
      ...reconnectedEdges
    ]);
  }, [nodes, edges]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Sidebar with WaveformGraph2D */}
      <WaveformGraph2D />

      {/* React Flow Canvas */}
      <div
        style={{ flex: 1, background: '#111', position: 'relative' }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Add node buttons */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}>
          <button
            onClick={addFilterNode}
            style={{
              padding: '8px 16px',
              background: '#f90',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Add Filter
          </button>

          <button
            onClick={addPianoNode}
            style={{
              padding: '8px 16px',
              background: '#0af',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Add Piano
          </button>

          <button
            onClick={addOutputNode}
            style={{
              padding: '8px 16px',
              background: '#f0f',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Add Output
          </button>

          <button
            onClick={addEnvelopeNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Add Envelope
          </button>

          <button
            onClick={createColorGroup}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            Shape → Color
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          zoomOnPinch={true}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}