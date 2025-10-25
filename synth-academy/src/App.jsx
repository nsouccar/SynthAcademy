import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { addEdge, Background, Controls, applyNodeChanges, applyEdgeChanges, ReactFlowProvider } from 'reactflow';
import './y2k-theme.css';
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
import { FloatingBalloons } from './components/FloatingBalloons';
import { audioGraph, setVoiceManager } from './AudioGraph';
import { voiceManager } from './VoiceManager';
import * as Tone from 'tone';

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

function AppContent() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedTutorialKey, setSelectedTutorialKey] = useState(null);
  const [tutorialLevel, setTutorialLevel] = useState(1);
  const [audioLevel, setAudioLevel] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [flashingNodeType, setFlashingNodeType] = useState(null);

  // Check if there are any envelope nodes on the canvas
  const hasEnvelopeNode = nodes.some(node => node.type === 'envelopeNode');

  // Listen for tutorial hint events
  useEffect(() => {
    const handleTutorialHint = (event) => {
      setFlashingNodeType(event.detail.nodeType);
    };

    const handleTutorialHintStop = () => {
      setFlashingNodeType(null);
    };

    window.addEventListener('tutorialShowHint', handleTutorialHint);
    window.addEventListener('tutorialHideHint', handleTutorialHintStop);

    return () => {
      window.removeEventListener('tutorialShowHint', handleTutorialHint);
      window.removeEventListener('tutorialHideHint', handleTutorialHintStop);
    };
  }, []);

  // Set up audio analyzer to track audio levels for star reactivity
  useEffect(() => {
    let rafId;
    try {
      const analyser = new Tone.Analyser('waveform', 256);
      Tone.Destination.connect(analyser);

      const updateAudioLevel = () => {
        const waveform = analyser.getValue();
        // Calculate RMS (root mean square) to get overall amplitude
        let sum = 0;
        for (let i = 0; i < waveform.length; i++) {
          sum += waveform[i] * waveform[i];
        }
        const rms = Math.sqrt(sum / waveform.length);
        // Amplify the signal for better visibility (adjust multiplier as needed)
        const normalized = Math.min(1, rms * 3);
        setAudioLevel(normalized);
        rafId = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();

      return () => {
        cancelAnimationFrame(rafId);
        analyser.dispose();
      };
    } catch (error) {
      console.error('Failed to set up audio analyzer:', error);
    }
  }, []);

  // Handle song selection from the song bank
  const handleSongSelect = useCallback((song, level) => {
    // Map song IDs to tutorial preset keys
    const songToPresetMap = {
      'better-off-alone': 'betterOffAlone'
      // Add more mappings as tutorials are created
    };

    const presetKey = songToPresetMap[song.id];
    if (presetKey) {
      // Clear the canvas before starting tutorial
      setNodes([]);
      setEdges([]);

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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#87CEEB' }}>
      {/* React Flow Canvas - Full width */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          overflow: 'hidden'
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Space Theme & Animation Styles */}
        <style>{`
          @font-face {
            font-family: 'AudioNugget';
            src: url('/AudioNugget.ttf') format('truetype');
          }

          @font-face {
            font-family: 'Silvers';
            src: url('/SILVERS PERSONAL USE.ttf') format('truetype');
          }

          @font-face {
            font-family: 'ByteBounce';
            src: url('/ByteBounce.ttf') format('truetype');
          }

          @font-face {
            font-family: 'StarCrush';
            src: url('/Star Crush.ttf') format('truetype');
          }

          @keyframes float3d {
            0%, 100% {
              transform: translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg);
            }
            25% {
              transform: translateY(-8px) translateZ(10px) rotateX(2deg) rotateY(-2deg);
            }
            50% {
              transform: translateY(-4px) translateZ(5px) rotateX(-1deg) rotateY(1deg);
            }
            75% {
              transform: translateY(-10px) translateZ(12px) rotateX(1deg) rotateY(2deg);
            }
          }

          @keyframes glow {
            0%, 100% {
              text-shadow:
                0 0 10px #00ffff,
                0 0 20px #00ffff,
                0 0 30px #00ffff,
                0 0 40px #ff00ff,
                0 0 70px #ff00ff,
                0 0 80px #ff00ff;
            }
            50% {
              text-shadow:
                0 0 20px #00ffff,
                0 0 30px #00ffff,
                0 0 40px #00ffff,
                0 0 50px #ff00ff,
                0 0 80px #ff00ff,
                0 0 100px #ff00ff;
            }
          }

          .floating-button {
            font-family: 'ByteBounce', sans-serif !important;
            border: 3px solid black !important;
            animation: float3d 4s ease-in-out infinite;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1);
            transform-style: preserve-3d;
            transition: all 0.3s ease;
            font-size: 16px !important;
            letter-spacing: 1px;
            padding: 8px 14px !important;
            font-weight: bold !important;
            position: relative;
            cursor: pointer;
          }

          .floating-button::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: calc(100% + 25px);
            left: 50%;
            transform: translateX(-50%) scale(0);
            background: linear-gradient(135deg, #ff69b4 0%, #ff1493 50%, #ff69b4 100%);
            border: 6px solid black;
            border-radius: 35px;
            padding: 30px 45px;
            color: white !important;
            font-size: 48px !important;
            font-weight: bold !important;
            font-family: 'ByteBounce', sans-serif !important;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            z-index: 1000;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6),
                        inset 0 3px 0 rgba(255, 255, 255, 0.4),
                        0 0 30px rgba(255, 105, 180, 0.8);
            text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
            letter-spacing: 4px;
            display: block;
          }

          .floating-button::before {
            content: '';
            position: absolute;
            bottom: calc(100% + 5px);
            left: 50%;
            transform: translateX(-50%) scale(0);
            width: 0;
            height: 0;
            border-left: 25px solid transparent;
            border-right: 25px solid transparent;
            border-top: 25px solid black;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            z-index: 999;
          }

          .floating-button:hover::after {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }

          .floating-button:hover::before {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }

          .floating-button:hover {
            animation-play-state: paused;
            transform: translateY(-6px) translateZ(20px) scale(1.05) !important;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1) !important;
          }

          @keyframes flashWhite {
            0%, 100% {
              filter: brightness(1);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1);
              transform: scale(1);
            }
            50% {
              filter: brightness(3) saturate(0);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3), 0 0 60px rgba(255, 255, 255, 1), 0 0 100px rgba(255, 255, 255, 0.8);
              transform: scale(1.1);
            }
          }

          .flash-hint {
            animation: flashWhite 0.8s ease-in-out infinite !important;
          }

          .synthworld-title {
            font-family: 'StarCrush', sans-serif;
            font-size: 72px;
            color: #4169E1;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 8px;
            text-transform: uppercase;
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 5;
            pointer-events: none;
            user-select: none;
          }

          /* 3D Rope Effect for Edges */
          .react-flow__edge-path {
            stroke-width: 12 !important;
            stroke: url(#ropeGradient) !important;
            filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.4))
                    drop-shadow(-1px -1px 2px rgba(255, 255, 255, 0.1));
          }

          .react-flow__edge.selected .react-flow__edge-path {
            stroke: url(#ropeGradientSelected) !important;
            stroke-width: 14 !important;
            filter: drop-shadow(3px 3px 5px rgba(0, 0, 0, 0.6))
                    drop-shadow(-2px -2px 3px rgba(255, 255, 255, 0.2));
          }


          .react-flow__handle {
            width: 10px !important;
            height: 10px !important;
            opacity: 1 !important;
            border-radius: 50% !important;
            border: none !important;
          }

          .react-flow__handle:hover {
            opacity: 1 !important;
            width: 12px !important;
            height: 12px !important;
          }

          /* Hide all node controls */
          .react-flow__resize-control,
          .react-flow__node-toolbar,
          .react-flow__node-resizer,
          .react-flow__resize-control-handle,
          .react-flow__nodesselection-rect {
            display: none !important;
            visibility: hidden !important;
          }

        `}</style>

        {/* SVG Gradients for 3D Rope Effect */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="ropeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#D2691E', stopOpacity: 1 }} />
              <stop offset="40%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
              <stop offset="60%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#4A3319', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="ropeGradientSelected" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
              <stop offset="40%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
              <stop offset="60%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#FF6347', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating 3D Balloons - only show when envelope node exists */}
        {hasEnvelopeNode && <FloatingBalloons audioLevel={audioLevel} />}

        {/* Infinite Tiling Sky Background - seamless repeating pattern */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          {/* Single seamless background layer with parallax and blur */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            backgroundImage: 'url(/bluesky-optimized.png)',
            backgroundSize: '800px 400px',
            backgroundRepeat: 'repeat',
            backgroundPosition: `${panX * 0.2}px ${panY * 0.2}px`,
            filter: 'blur(2px)',
            opacity: 0.95
          }} />
        </div>

        {/* Synthworld Title */}
        <div className="synthworld-title">Synth-Chronicity</div>

        {/* Add node buttons */}
        <div style={{
          position: 'absolute',
          top: 120,
          left: 20,
          right: 20,
          zIndex: 10,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          perspective: '1000px', // Enable 3D perspective for children
          perspectiveOrigin: 'center center'
        }}>
          {/* Oscillators - Dreamy Sky Blue */}
          <button
            onClick={addSineOscNode}
            className={`floating-button ${flashingNodeType === 'oscillator' ? 'flash-hint' : ''}`}
            data-tooltip="SINE"
            style={{
              animationDelay: '0s',
              '--original-bg': 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              background: 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              color: '#333'
            }}
          >
            Sine
          </button>
          <button
            onClick={addSquareOscNode}
            className={`floating-button ${flashingNodeType === 'oscillator' ? 'flash-hint' : ''}`}
            data-tooltip="SQUARE"
            style={{
              animationDelay: '0.2s',
              '--original-bg': 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              background: 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              color: '#333'
            }}
          >
            Square
          </button>
          <button
            onClick={addSawtoothOscNode}
            className={`floating-button ${flashingNodeType === 'oscillator' ? 'flash-hint' : ''}`}
            data-tooltip="SAWTOOTH"
            style={{
              animationDelay: '0.4s',
              '--original-bg': 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              background: 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              color: '#333'
            }}
          >
            Sawtooth
          </button>
          <button
            onClick={addTriangleOscNode}
            className={`floating-button ${flashingNodeType === 'oscillator' ? 'flash-hint' : ''}`}
            data-tooltip="TRIANGLE"
            style={{
              animationDelay: '0.6s',
              '--original-bg': 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              background: 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              color: '#333'
            }}
          >
            Triangle
          </button>
          <button
            onClick={addPulseOscNode}
            className={`floating-button ${flashingNodeType === 'oscillator' ? 'flash-hint' : ''}`}
            data-tooltip="PULSE"
            style={{
              animationDelay: '0.8s',
              '--original-bg': 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              background: 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              color: '#333'
            }}
          >
            Pulse
          </button>
          <button
            onClick={addNoiseOscNode}
            className={`floating-button ${flashingNodeType === 'oscillator' ? 'flash-hint' : ''}`}
            data-tooltip="NOISE"
            style={{
              animationDelay: '1.0s',
              '--original-bg': 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              background: 'linear-gradient(135deg, #a8edea 0%, #89cff0 100%)',
              color: '#333'
            }}
          >
            Noise
          </button>

          {/* Utilities - Dreamy Mint Green */}
          <button
            onClick={addFilterNode}
            className="floating-button"
            data-tooltip="FILTER"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '1.2s',
              '--original-bg': 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)'
            }}
          >
            + Add Filter
          </button>

          <button
            onClick={addPianoNode}
            className="floating-button"
            data-tooltip="PIANO"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '1.4s',
              '--original-bg': 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)'
            }}
          >
            + Add Piano
          </button>

          <button
            onClick={addSequencerNode}
            className="floating-button"
            data-tooltip="SEQUENCER"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '1.6s',
              '--original-bg': 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)'
            }}
          >
            + Add Sequencer
          </button>

          <button
            onClick={addOutputNode}
            className="floating-button"
            data-tooltip="OUTPUT"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '1.8s',
              '--original-bg': 'linear-gradient(135deg, #c1fba4 0%, #a8e6cf 100%)'
            }}
          >
            + Add Output
          </button>

          {/* Modulators - Dreamy Rose Pink */}
          <button
            onClick={addEnvelopeNode}
            className={`floating-button ${flashingNodeType === 'envelopeNode' ? 'flash-hint' : ''}`}
            data-tooltip="ENVELOPE"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '2.0s',
              '--original-bg': 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%)'
            }}
          >
            + Add Envelope
          </button>

          <button
            onClick={addLFONode}
            className="floating-button"
            data-tooltip="LFO"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '2.2s',
            }}
          >
            + Add LFO
          </button>

          {/* Effects - Dreamy Lavender Purple */}
          <button
            onClick={addChorusNode}
            className={`floating-button ${flashingNodeType === 'effect' ? 'flash-hint' : ''}`}
            data-tooltip="CHORUS"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '2.4s',
              '--original-bg': 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)'
            }}
          >
            + Chorus
          </button>

          <button
            onClick={addReverbNode}
            className={`floating-button ${flashingNodeType === 'effect' ? 'flash-hint' : ''}`}
            data-tooltip="REVERB"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '2.6s',
              '--original-bg': 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)'
            }}
          >
            + Reverb
          </button>

          <button
            onClick={addDelayNode}
            className={`floating-button ${flashingNodeType === 'effect' ? 'flash-hint' : ''}`}
            data-tooltip="DELAY"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '2.8s',
              '--original-bg': 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)'
            }}
          >
            + Delay
          </button>

          <button
            onClick={addDistortionNode}
            className={`floating-button ${flashingNodeType === 'effect' ? 'flash-hint' : ''}`}
            data-tooltip="DISTORTION"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '3.0s',
              '--original-bg': 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)'
            }}
          >
            + Distortion
          </button>

          <button
            onClick={addPitchShifterNode}
            className={`floating-button ${flashingNodeType === 'effect' ? 'flash-hint' : ''}`}
            data-tooltip="PITCH SHIFTER"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '3.2s',
              '--original-bg': 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)'
            }}
          >
            + Pitch Shifter
          </button>

          <button
            onClick={addPhaserNode}
            className={`floating-button ${flashingNodeType === 'effect' ? 'flash-hint' : ''}`}
            data-tooltip="PHASER"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '3.4s',
              '--original-bg': 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)'
            }}
          >
            + Phaser
          </button>

          <button
            onClick={addVibratoNode}
            className={`floating-button ${flashingNodeType === 'effect' ? 'flash-hint' : ''}`}
            data-tooltip="VIBRATO"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '3.6s',
              '--original-bg': 'linear-gradient(135deg, #d4a5f9 0%, #c7b3f5 100%)'
            }}
          >
            + Vibrato
          </button>

          {/* File Exchange - Dreamy Peach */}
          <button
            onClick={exportProject}
            className="floating-button"
            data-tooltip="EXPORT PATCH"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ffd89b 0%, #ffb88c 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '4.0s',
              '--original-bg': 'linear-gradient(135deg, #ffd89b 0%, #ffb88c 100%)'
            }}
          >
            Export Patch
          </button>

          <button
            onClick={importProject}
            className="floating-button"
            data-tooltip="IMPORT PATCH"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ffd89b 0%, #ffb88c 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              animationDelay: '4.2s',
              '--original-bg': 'linear-gradient(135deg, #ffd89b 0%, #ffb88c 100%)'
            }}
          >
            Import Patch
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onMove={(_, viewport) => {
            setPanX(viewport.x);
            setPanY(viewport.y);
          }}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            style: {
              strokeWidth: 8,
              stroke: '#8B4513',
            },
            animated: false,
          }}
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
              // Clear the canvas after completing tutorial
              setNodes([]);
              setEdges([]);
              setShowTutorial(false);
              setSelectedTutorialKey(null);
              setTutorialLevel(1);
            }}
            onClose={() => {
              // Clear the canvas when exiting tutorial
              setNodes([]);
              setEdges([]);
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

// Wrap AppContent with ReactFlowProvider to enable useReactFlow hook
export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}