import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { addEdge, Background, Controls, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { WaveformGraph2D } from './components/WaveformGraph2D';
import { OscNode } from './components/OscNode';
import { FilterNode } from './components/FilterNode';
import { audioGraph } from './AudioGraph';
import * as Tone from 'tone';

import 'reactflow/dist/style.css';

// Register node types outside component to avoid warning
const nodeTypes = {
  oscNode: OscNode,
  filterNode: FilterNode
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

  // Cleanup audio graph on unmount
  useEffect(() => {
    return () => {
      audioGraph.cleanup();
    };
  }, []);

  // Handle node click to play sound
  const onNodeClick = useCallback(async (event, node) => {
    await Tone.start();
    // Trigger a custom event that the node can listen to
    const nodeElement = event.target.closest('.react-flow__node');
    if (nodeElement) {
      nodeElement.dispatchEvent(new CustomEvent('playSound'));
    }
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
        {/* Add Filter button */}
        <button
          onClick={addFilterNode}
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
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

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}