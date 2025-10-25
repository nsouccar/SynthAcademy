import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { addEdge, Background, Controls, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { WaveformGraph2D } from './components/WaveformGraph2D';
import { OscNode } from './components/OscNode';
import { PulseOscNode } from './components/PulseOscNode';
import { SineOscNode } from './components/SineOscNode';
import { SquareOscNode } from './components/SquareOscNode';
import { SawtoothOscNode } from './components/SawtoothOscNode';
import { TriangleOscNode } from './components/TriangleOscNode';
import { NoiseOscNode } from './components/NoiseOscNode';
import { FilterNode } from './components/FilterNode';
import { PianoNode } from './components/PianoNode';
import { OutputNode } from './components/OutputNode';
import { GroupNode } from './components/GroupNode';
import { EnvelopeNode } from './components/EnvelopeNode';
import { LFONode } from './components/LFONode';
import { ChorusNode } from './components/ChorusNode';
import { ReverbNode } from './components/ReverbNode';
import { DelayNode } from './components/DelayNode';
import { DistortionNode } from './components/DistortionNode';
import { PitchShifterNode } from './components/PitchShifterNode';
import { PhaserNode } from './components/PhaserNode';
import { VibratoNode } from './components/VibratoNode';
import { PianoRollNode } from './components/PianoRollNode';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { SongBank } from './components/SongBank';
import { audioGraph, setVoiceManager } from './AudioGraph';
import { voiceManager } from './VoiceManager';

import 'reactflow/dist/style.css';

// Initialize the voice manager reference in AudioGraph
setVoiceManager(voiceManager);

// Register node types outside component to avoid warning
const nodeTypes = {
  oscNode: OscNode,
  pulseOscNode: PulseOscNode,
  sineOscNode: SineOscNode,
  squareOscNode: SquareOscNode,
  sawtoothOscNode: SawtoothOscNode,
  triangleOscNode: TriangleOscNode,
  noiseOscNode: NoiseOscNode,
  filterNode: FilterNode,
  pianoNode: PianoNode,
  pianoRollNode: PianoRollNode,
  outputNode: OutputNode,
  groupNode: GroupNode,
  envelopeNode: EnvelopeNode,
  lfoNode: LFONode,
  chorusNode: ChorusNode,
  reverbNode: ReverbNode,
  delayNode: DelayNode,
  distortionNode: DistortionNode,
  pitchShifterNode: PitchShifterNode,
  phaserNode: PhaserNode,
  vibratoNode: VibratoNode
};

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedTutorialKey, setSelectedTutorialKey] = useState(null);
  const [tutorialLevel, setTutorialLevel] = useState(1);

  // Handle song selection from the song bank
  const handleSongSelect = useCallback((song, level) => {
    // Map song IDs to tutorial preset keys
    const songToPresetMap = {
      'better-off-alone': 'betterOffAlone'
      // Add more mappings as tutorials are created
    };

    const presetKey = songToPresetMap[song.id];
    if (presetKey) {
      setSelectedTutorialKey(presetKey);
      setTutorialLevel(level);
      setShowTutorial(true);
    }
  }, []);

  // Export project as JSON file
  const exportProject = useCallback(() => {
    const projectData = {
      nodes,
      edges,
      timestamp: Date.now(),
      version: '1.0'
    };
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synth-academy-project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Import project from JSON file
  const importProject = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const projectData = JSON.parse(event.target.result);
          setNodes(projectData.nodes || []);
          setEdges(projectData.edges || []);
          alert('Project imported successfully!');
        } catch (err) {
          console.error('Failed to import project:', err);
          alert('Failed to import project. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

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
    (params) => {
      // If tutorial is active, validate the connection
      if (showTutorial) {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);

        // Dispatch event for tutorial to validate
        window.dispatchEvent(new CustomEvent('tutorialConnection', {
          detail: { connection: params, sourceNode, targetNode }
        }));

        // Wait for tutorial response
        const handleAccepted = () => {
          setEdges((eds) => addEdge(params, eds));
          window.removeEventListener('tutorialConnectionAccepted', handleAccepted);
          window.removeEventListener('tutorialConnectionRejected', handleRejected);
        };

        const handleRejected = () => {
          // Don't add the edge
          window.removeEventListener('tutorialConnectionAccepted', handleAccepted);
          window.removeEventListener('tutorialConnectionRejected', handleRejected);
        };

        window.addEventListener('tutorialConnectionAccepted', handleAccepted);
        window.addEventListener('tutorialConnectionRejected', handleRejected);
      } else {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [showTutorial, nodes]
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

  // Add oscillator nodes
  const addSineOscNode = useCallback(() => {
    const nodeData = { id: `sine-${Date.now()}`, type: 'sineOscNode', position: { x: 100, y: 100 }, data: {} };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'sineOscNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addSquareOscNode = useCallback(() => {
    const nodeData = { id: `square-${Date.now()}`, type: 'squareOscNode', position: { x: 100, y: 100 }, data: {} };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'squareOscNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addSawtoothOscNode = useCallback(() => {
    console.log('addSawtoothOscNode CLICKED! showTutorial:', showTutorial);
    const nodeData = { id: `sawtooth-${Date.now()}`, type: 'sawtoothOscNode', position: { x: 350, y: 200 }, data: {} };

    // If tutorial is active, dispatch custom event
    if (showTutorial) {
      console.log('DISPATCHING tutorialNodeAdd event', { nodeType: 'sawtoothOscNode', nodeData });
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'sawtoothOscNode', nodeData }
      }));
    } else {
      console.log('Adding node directly (not in tutorial mode)');
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addTriangleOscNode = useCallback(() => {
    const nodeData = { id: `triangle-${Date.now()}`, type: 'triangleOscNode', position: { x: 100, y: 100 }, data: {} };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'triangleOscNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addPulseOscNode = useCallback(() => {
    const nodeData = { id: `pulse-${Date.now()}`, type: 'pulseOscNode', position: { x: 100, y: 100 }, data: { pulseWidth: 0.5 } };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'pulseOscNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addNoiseOscNode = useCallback(() => {
    const nodeData = { id: `noise-${Date.now()}`, type: 'noiseOscNode', position: { x: 100, y: 100 }, data: {} };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'noiseOscNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

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

  // Add a sequencer node
  const addSequencerNode = useCallback(() => {
    const id = `sequencer-${Date.now()}`;
    const newNode = {
      id,
      type: 'pianoRollNode',
      position: { x: 100, y: 100 },
      data: {
        tempo: 120,
        notes: [],
        loopLength: 16, // 4 bars
        isPlaying: false,
        isRecording: false
      },
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
    const nodeData = {
      id,
      type: 'envelopeNode',
      position: { x: 600, y: 200 },
      data: {
        attack: 0,
        decay: 0.1,
        sustain: 1.0,
        release: 0.02
      },
    };

    // If tutorial is active, dispatch custom event
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'envelopeNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  // Add an LFO node
  const addLFONode = useCallback(() => {
    const id = `lfo-${Date.now()}`;
    const newNode = {
      id,
      type: 'lfoNode',
      position: { x: 500, y: 150 },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Add effect nodes
  const addChorusNode = useCallback(() => {
    const nodeData = { id: `chorus-${Date.now()}`, type: 'chorusNode', position: { x: 600, y: 150 }, data: {} };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'chorusNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addReverbNode = useCallback(() => {
    const nodeData = {
      id: `reverb-${Date.now()}`,
      type: 'reverbNode',
      position: { x: 850, y: 200 },
      data: {
        wet: 0.2,
        decay: 3.0,
        preDelay: 0.01
      }
    };

    // If tutorial is active, dispatch custom event
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'reverbNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addDelayNode = useCallback(() => {
    const nodeData = { id: `delay-${Date.now()}`, type: 'delayNode', position: { x: 600, y: 350 }, data: {} };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'delayNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addDistortionNode = useCallback(() => {
    const nodeData = { id: `distortion-${Date.now()}`, type: 'distortionNode', position: { x: 600, y: 450 }, data: {} };
    if (showTutorial) {
      window.dispatchEvent(new CustomEvent('tutorialNodeAdd', {
        detail: { nodeType: 'distortionNode', nodeData }
      }));
    } else {
      setNodes((nds) => [...nds, nodeData]);
    }
  }, [showTutorial]);

  const addPitchShifterNode = useCallback(() => {
    setNodes((nds) => [...nds, { id: `pitchshifter-${Date.now()}`, type: 'pitchShifterNode', position: { x: 700, y: 150 }, data: {} }]);
  }, []);

  const addPhaserNode = useCallback(() => {
    setNodes((nds) => [...nds, { id: `phaser-${Date.now()}`, type: 'phaserNode', position: { x: 700, y: 250 }, data: {} }]);
  }, []);

  const addVibratoNode = useCallback(() => {
    setNodes((nds) => [...nds, { id: `vibrato-${Date.now()}`, type: 'vibratoNode', position: { x: 700, y: 350 }, data: {} }]);
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
          flexWrap: 'wrap',
          maxWidth: 'calc(100vw - 600px)' // Account for both left and right sidebars
        }}>
          {/* Oscillators */}
          <button onClick={addSineOscNode} style={{ padding: '8px 16px', background: '#4a9eff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Sine
          </button>
          <button onClick={addSquareOscNode} style={{ padding: '8px 16px', background: '#ff4a4a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Square
          </button>
          <button onClick={addSawtoothOscNode} style={{ padding: '8px 16px', background: '#4aff4a', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Sawtooth
          </button>
          <button onClick={addTriangleOscNode} style={{ padding: '8px 16px', background: '#ffff4a', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Triangle
          </button>
          <button onClick={addPulseOscNode} style={{ padding: '8px 16px', background: '#ff9d4a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Pulse
          </button>
          <button onClick={addNoiseOscNode} style={{ padding: '8px 16px', background: '#ff4aff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            Noise
          </button>

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
            onClick={addSequencerNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Add Sequencer
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
            onClick={addLFONode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Add LFO
          </button>

          <button
            onClick={addChorusNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Chorus
          </button>

          <button
            onClick={addReverbNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Reverb
          </button>

          <button
            onClick={addDelayNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Delay
          </button>

          <button
            onClick={addDistortionNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Distortion
          </button>

          <button
            onClick={addPitchShifterNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Pitch Shifter
          </button>

          <button
            onClick={addPhaserNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Phaser
          </button>

          <button
            onClick={addVibratoNode}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Vibrato
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

          {/* Export/Import Buttons */}
          <button
            onClick={exportProject}
            style={{
              padding: '8px 16px',
              background: '#FF9800',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ⬇️ Export Patch
          </button>

          <button
            onClick={importProject}
            style={{
              padding: '8px 16px',
              background: '#9C27B0',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ⬆️ Import Patch
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

        {/* Interactive Tutorial Overlay */}
        {showTutorial && selectedTutorialKey && (
          <InteractiveTutorial
            presetKey={selectedTutorialKey}
            level={tutorialLevel}
            setNodes={setNodes}
            setEdges={setEdges}
            onComplete={() => {
              alert('🎉 Tutorial Complete! You nailed it!');
              setShowTutorial(false);
              setSelectedTutorialKey(null);
              setTutorialLevel(1);
            }}
            onClose={() => {
              setShowTutorial(false);
              setSelectedTutorialKey(null);
              setTutorialLevel(1);
            }}
          />
        )}
      </div>

      {/* Song Bank Sidebar */}
      <SongBank onSelectSong={handleSongSelect} />
    </div>
  );
}