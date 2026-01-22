import { useState, useEffect, useCallback } from 'react';
import { tutorialPresets } from '../tutorialGenerator';

/**
 * InteractiveTutorial - "Fix the synth" style tutorial
 * Level 1: Step-by-step guided tutorial
 * Level 2: Challenge mode - nodes are placed but disconnected and randomized
 */
export function InteractiveTutorial({ presetKey, level = 1, setNodes, setEdges, onComplete, onClose }) {
  const preset = tutorialPresets[presetKey];
  const [currentStep, setCurrentStep] = useState(0); // Start at step 1 (index 0)
  const [showCelebration, setShowCelebration] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [tutorialNodeIds, setTutorialNodeIds] = useState(new Set());
  const isLevel2 = level === 2;

  console.log('InteractiveTutorial RENDER - currentStep:', currentStep, 'initialized:', initialized);

  // Helper to get random value for a parameter - wrapped in useCallback to prevent infinite loops
  const getRandomParameterValue = useCallback((nodeId, paramName, correctValue) => {
    // Define parameter ranges for randomization - generic by parameter name
    const paramRangesByParam = {
      // Oscillator params (works for all oscillator types)
      detune: { min: -50, max: 50 },
      octaveOffset: { min: -2, max: 2, step: 1 },
      unisonVoices: { min: 1, max: 7, step: 1 },
      unisonSpread: { min: 0, max: 50, step: 1 },
      pulseWidth: { min: 0.1, max: 0.9 },
      // Envelope params
      delay: { min: 0, max: 2 },
      attack: { min: 0.001, max: 2 },
      hold: { min: 0, max: 2 },
      decay: { min: 0.001, max: 10 },
      sustain: { min: 0, max: 1 },
      release: { min: 0.001, max: 5 },
      // Effect params
      wet: { min: 0, max: 1 },
      preDelay: { min: 0, max: 0.1 },
      // Filter params
      frequency: { min: 0.1, max: 0.9 },
      resonance: { min: 0, max: 1 },
      // Chorus params
      depth: { min: 0, max: 1 },
      delayTime: { min: 0.5, max: 10 },
      // Distortion params
      distortion: { min: 0, max: 1 },
      // Delay effect params
      feedback: { min: 0, max: 0.9 }
    };

    const range = paramRangesByParam[paramName];
    if (!range) return undefined;

    // Generate random values until we get one that's different from the correct value
    let randomValue;
    let attempts = 0;
    const maxAttempts = 20;

    do {
      const random = Math.random() * (range.max - range.min) + range.min;

      if (range.step) {
        randomValue = Math.round(random / range.step) * range.step;
      } else {
        randomValue = parseFloat(random.toFixed(3));
      }

      attempts++;
    } while (randomValue === correctValue && attempts < maxAttempts);

    // If we couldn't find a different value, offset it by a bit
    if (randomValue === correctValue) {
      if (range.step) {
        randomValue = correctValue + range.step;
        // Wrap around if out of bounds
        if (randomValue > range.max) randomValue = range.min;
      } else {
        randomValue = correctValue + 0.1;
        // Wrap around if out of bounds
        if (randomValue > range.max) randomValue = range.min;
      }
    }

    return randomValue;
  }, []); // Empty deps - this function doesn't depend on any props or state

  // Initialize tutorial - add all nodes fully connected WITH tutorial mode enabled from the start
  useEffect(() => {
    if (!preset || initialized) return;

    console.log('Tutorial - Initializing with preset:', preset.name, 'level:', level);

    // Level 2: Challenge Mode - Place all required nodes jumbled, disconnected, and randomized
    if (isLevel2) {
      // Jumble the order of nodes (except keep sequencer at top)
      const sequencerNode = preset.nodes.find(n => n.id === 'tutorial-sequencer');
      const otherNodes = preset.nodes.filter(n => n.id !== 'tutorial-sequencer');

      // Shuffle the other nodes randomly
      const shuffledNodes = [...otherNodes].sort(() => Math.random() - 0.5);

      // Map nodes to randomized versions with jumbled positions
      const randomizedNodes = [sequencerNode, ...shuffledNodes].map((node, index) => {
        if (!node) return null; // Skip if node is undefined

        const nodeData = { ...node.data };

        // Randomize all adjustable parameters (skip sequencer and special params)
        if (node.id !== 'tutorial-sequencer') {
          Object.keys(nodeData).forEach(key => {
            if (!['tutorialMode', 'blurredParams', 'voiceMode', 'waveform', 'midiFilePath', 'compactMode', 'referenceParams', 'isPlaying', 'tempo', 'notes', 'loopLength', 'canvasHeight', 'canvasWidth'].includes(key)) {
              const correctValue = nodeData[key];
              const randomValue = getRandomParameterValue(node.id, key, correctValue);
              if (randomValue !== undefined) {
                nodeData[key] = randomValue;
                console.log(`Level 2 - Randomized ${node.id}.${key}: ${correctValue} → ${randomValue}`);
              }
            }
          });
        }

        // IMPORTANT: Clear any blur-related data for Level 2
        delete nodeData.blurredParams;
        delete nodeData.tutorialMode;

        // Position: sequencer at top, others spread in jumbled order
        let position;
        if (node.id === 'tutorial-sequencer') {
          position = { x: 100, y: 50 }; // Keep sequencer at top
        } else {
          // Jumbled positions for other nodes
          const col = (index - 1) % 3;
          const row = Math.floor((index - 1) / 3);
          position = { x: 150 + col * 350, y: 200 + row * 300 };
        }

        return {
          ...node,
          position,
          data: nodeData,
          draggable: true,
          selectable: true,
          connectable: true,
          // IMPORTANT: Clear all styling - no blur, no special effects
          style: {
            filter: 'none',
            opacity: 1,
            animation: undefined,
            transition: undefined
          }
        };
      }).filter(Boolean); // Remove any null nodes

      console.log('Level 2 - Setting nodes:', randomizedNodes.map(n => ({ id: n.id, type: n.type, hasBlur: !!n.style?.filter })));
      setNodes(randomizedNodes);
      setEdges([]); // No connections in Level 2 - user must connect them!
      setTutorialNodeIds(new Set(preset.nodes.map(n => n.id)));
      setInitialized(true);
      console.log('Level 2 - Initialization complete!');
      return;
    }

    // Level 1: Guided Tutorial Mode
    // Get the current step's blur configuration (respects currentStep initial value)
    const initialStep = preset.steps[currentStep];
    console.log('Tutorial - Initial step:', initialStep);

    // Filter nodes based on step type
    let nodesToAdd;
    if (initialStep.type === 'chooseNode') {
      // For chooseNode steps, only add the visible nodes (not the node they need to choose)
      nodesToAdd = preset.nodes.filter(node =>
        initialStep.visibleNodeIds?.includes(node.id)
      ).map(node => {
        const isBlurred = initialStep.blurredNodeIds?.includes(node.id);
        const blurredParamsForNode = (initialStep.blurredParams && initialStep.blurredParams[node.id]) || [];

        return {
          ...node,
          data: {
            ...node.data,
            tutorialMode: true,
            blurredParams: blurredParamsForNode
          },
          style: {
            filter: isBlurred ? 'blur(8px) hue-rotate(0deg) saturate(3)' : 'none',
            opacity: isBlurred ? 0.7 : 1,
            transition: 'all 0.3s ease',
            animation: isBlurred ? 'rainbow-blur 3s linear infinite' : undefined
          },
          draggable: true,
          selectable: true,
          connectable: true
        };
      });
    } else {
      // For other step types, add all nodes with blur configuration
      nodesToAdd = preset.nodes.filter(Boolean).map(node => {
        const isBlurred = initialStep.blurredNodeIds?.includes(node.id);
        const isFocus = node.id === initialStep.focusNodeId;
        const blurredParamsForNode = (initialStep.blurredParams && initialStep.blurredParams[node.id]) || [];

      console.log(`Tutorial - Adding node ${node.id}: isBlurred=${isBlurred}, blurredParams=`, blurredParamsForNode);

      // Find the currently active (unblurred) parameter for this node
      // If this is the focus node, find which parameter is NOT in blurredParams
      const nodeData = { ...node.data };
      if (node.id === initialStep.focusNodeId && nodeData) {
        const allParams = Object.keys(nodeData).filter(key =>
          !['tutorialMode', 'blurredParams', 'voiceMode', 'waveform'].includes(key)
        );
        const activeParam = allParams.find(param => !blurredParamsForNode.includes(param));

        if (activeParam) {
          // Get the correct value from the step's targetParameters, not from current node data
          const correctValue = initialStep.targetParameters?.[activeParam] ?? nodeData[activeParam];
          const randomValue = getRandomParameterValue(node.id, activeParam, correctValue);
          if (randomValue !== undefined) {
            nodeData[activeParam] = randomValue;
            console.log(`Tutorial - Randomizing ${node.id}.${activeParam} to ${randomValue} (correct value: ${correctValue})`);
          }
        }
      }

      return {
        ...node,
        data: {
          ...nodeData,
          tutorialMode: true,
          blurredParams: blurredParamsForNode,
        },
        style: {
          filter: isBlurred ? 'blur(8px) hue-rotate(0deg) saturate(3)' : 'none',
          opacity: isBlurred ? 0.7 : 1,
          transition: 'all 0.3s ease',
          border: isFocus ? '3px solid #4169E1' : undefined,
          boxShadow: isFocus ? '0 0 20px rgba(65, 105, 225, 0.5)' : undefined,
          animation: isBlurred ? 'rainbow-blur 3s linear infinite' : undefined
        },
        draggable: true,
        selectable: true,
        connectable: true
      };
    });
    }

    // For chooseNode steps, add edges EXCEPT those involving the node to be chosen
    let edgesToAdd;
    if (initialStep.type === 'chooseNode') {
      const excludedNodeId = initialStep.requiredNodeId;
      edgesToAdd = (preset.initialEdges || []).filter(edge =>
        edge.source !== excludedNodeId && edge.target !== excludedNodeId
      );
    } else {
      edgesToAdd = preset.initialEdges || [];
    }

    setNodes(prevNodes => {
      const newNodes = nodesToAdd.filter(
        tutorialNode => !prevNodes.some(n => n.id === tutorialNode.id)
      );

      const ids = new Set(nodesToAdd.map(n => n.id));
      setTutorialNodeIds(ids);

      return [...prevNodes, ...newNodes];
    });

    setEdges(prevEdges => {
      const existingEdgeIds = new Set(prevEdges.map(e => e.id));
      const newEdges = edgesToAdd.filter(edge => !existingEdgeIds.has(edge.id));
      return [...prevEdges, ...newEdges];
    });

    setInitialized(true);
  }, [preset, initialized, setNodes, setEdges]);

  // Apply blur styling to nodes and parameters based on current step
  useEffect(() => {
    if (!preset || !initialized) return;
    if (isLevel2) return; // Skip blur styling for Level 2
    const step = preset.steps[currentStep];

    console.log('Tutorial - Applying step:', currentStep, step);
    console.log('Tutorial - Blurred node IDs:', step.blurredNodeIds);
    console.log('Tutorial - Blurred params:', step.blurredParams);
    console.log('Tutorial - Visible node IDs:', step.visibleNodeIds);

    setNodes(prevNodes => {
      console.log('Tutorial - Filtering nodes. tutorialNodeIds:', Array.from(tutorialNodeIds));
      console.log('Tutorial - All node IDs:', prevNodes.map(n => n.id));

      return prevNodes.filter(node => {
        // Check if this is a tutorial node by looking at its data
        const isTutorialNode = node.data?.tutorialMode || tutorialNodeIds.has(node.id);

        // Keep non-tutorial nodes
        if (!isTutorialNode) {
          console.log(`Tutorial - Keeping non-tutorial node: ${node.id}`);
          return true;
        }

        // For chooseNode steps, keep nodes the user is actively adding (not pre-existing ones being removed)
        // Check if this is a node type that matches what we're choosing
        const matchesRequiredType = step.type === 'chooseNode' && (
          (step.requiredNodeType?.includes('OscNode') && node.type?.includes('OscNode')) ||
          (step.requiredNodeType === 'envelopeNode' && node.type === 'envelopeNode') ||
          (step.requiredNodeType === 'chorusNode' && node.type === 'chorusNode') ||
          (step.requiredNodeType === 'reverbNode' && node.type === 'reverbNode') ||
          (step.requiredNodeType === 'delayNode' && node.type === 'delayNode') ||
          (step.requiredNodeType === 'distortionNode' && node.type === 'distortionNode')
        );

        // Only allow experiment nodes if they're NOT the required node ID (which means they're new additions, not pre-existing)
        const isNewExperimentNode = matchesRequiredType && node.id !== step.requiredNodeId;

        // Keep nodes that are either:
        // 1. In visibleNodeIds (pre-placed nodes we want to show)
        // 2. New experiment nodes the user is trying out
        const shouldKeep = step.visibleNodeIds?.includes(node.id) || isNewExperimentNode;
        console.log(`Tutorial - Node ${node.id}: isTutorialNode=${isTutorialNode}, shouldKeep=${shouldKeep}, isNewExperiment=${isNewExperimentNode}, matchesType=${matchesRequiredType}`);
        return shouldKeep;
      }).map(node => {
      // Check if this is a tutorial node
      const isTutorialNode = node.data?.tutorialMode || tutorialNodeIds.has(node.id);
      if (!isTutorialNode) {
        return node;
      }

      const isBlurred = step.blurredNodeIds?.includes(node.id);
      const isFocus = node.id === step.focusNodeId;

      // Get blurred params for this specific node
      const blurredParamsForNode = (step.blurredParams && step.blurredParams[node.id]) || [];

      console.log(`Tutorial - Node ${node.id}: isBlurred=${isBlurred}, blurredParams=`, blurredParamsForNode);

      // Find the currently active (unblurred) parameter and randomize it
      const nodeData = { ...node.data };
      if (node.id === step.focusNodeId) {
        const allParams = Object.keys(nodeData).filter(key =>
          !['tutorialMode', 'blurredParams', 'voiceMode', 'waveform'].includes(key)
        );
        const activeParam = allParams.find(param => !blurredParamsForNode.includes(param));

        if (activeParam) {
          // Get the correct value from the step's targetParameters, not from current node data
          const correctValue = step.targetParameters?.[activeParam] ?? nodeData[activeParam];
          const randomValue = getRandomParameterValue(node.id, activeParam, correctValue);
          if (randomValue !== undefined) {
            nodeData[activeParam] = randomValue;
            console.log(`Tutorial - Randomizing ${node.id}.${activeParam} to ${randomValue} (correct value: ${correctValue})`);
          }
        }
      }

      return {
        ...node,
        data: {
          ...nodeData,
          tutorialMode: true,
          blurredParams: blurredParamsForNode,
        },
        style: {
          filter: isBlurred ? 'blur(8px) hue-rotate(0deg) saturate(3)' : 'none',
          opacity: isBlurred ? 0.7 : 1,
          transition: 'all 0.3s ease',
          border: isFocus ? '3px solid #4169E1' : undefined,
          boxShadow: isFocus ? '0 0 20px rgba(65, 105, 225, 0.5)' : undefined,
          animation: isBlurred ? 'rainbow-blur 3s linear infinite' : undefined
        },
        draggable: true,
        selectable: true,
        connectable: true
      };
    });
    });
  }, [currentStep, initialized, preset, setNodes, getRandomParameterValue]);

  // Handle next button click
  const handleNext = useCallback(() => {
    if (currentStep < preset.steps.length - 1) {
      setCurrentStep(currentStep + 1);

      const nextStep = preset.steps[currentStep + 1];
      if (nextStep?.type === 'complete') {
        if (onComplete) onComplete();
      }
    } else {
      if (onComplete) onComplete();
    }
  }, [currentStep, preset, onComplete]);

  // Handle node additions during 'chooseNode' steps
  useEffect(() => {
    if (!preset || !initialized) {
      console.log('Tutorial - Node add handler: preset or initialized missing', { preset: !!preset, initialized });
      return;
    }
    if (isLevel2) return; // No special node handling for Level 2
    const step = preset.steps[currentStep];
    console.log('Tutorial - Setting up node add handler for step:', currentStep, 'type:', step.type);
    if (step.type !== 'chooseNode') {
      console.log('Tutorial - Skipping node add handler, not a chooseNode step');
      return;
    }

    const handleNodeAdd = (event) => {
      console.log('Tutorial - handleNodeAdd CALLED!', event.detail);
      const { nodeType, nodeData } = event.detail;
      console.log('Tutorial - Node added:', nodeType, nodeData);

      // Check if it's the correct node type
      const isCorrectType = nodeType === step.requiredNodeType;

      if (isCorrectType) {
        console.log('Tutorial - Correct node type! Setting parameters with blur');

        // Create the node with tutorial mode, pre-set parameters, and all params blurred
        const targetParams = step.targetParameters || {};
        const allParamNames = Object.keys(targetParams);

        const tutorialNode = {
          ...nodeData,
          id: step.requiredNodeId, // Use the predefined ID
          data: {
            ...targetParams, // Set the target parameters
            tutorialMode: true,
            blurredParams: step.blurAllParameters ? allParamNames : []
          },
          style: {
            border: '3px solid #4169E1',
            boxShadow: '0 0 20px rgba(65, 105, 225, 0.5)'
          },
          draggable: true,
          selectable: true,
          connectable: true
        };

        setNodes((nds) => [...nds, tutorialNode]);

        // Auto-connect the edges for this node from the preset
        const nodeId = step.requiredNodeId;
        const edgesToAdd = (preset.initialEdges || []).filter(edge =>
          edge.source === nodeId || edge.target === nodeId
        );
        if (edgesToAdd.length > 0) {
          console.log('Tutorial - Auto-connecting edges for node:', nodeId, edgesToAdd);
          setEdges((eds) => {
            const existingEdgeIds = new Set(eds.map(e => e.id));
            const newEdges = edgesToAdd.filter(edge => !existingEdgeIds.has(edge.id));
            return [...eds, ...newEdges];
          });
        }

        setTutorialNodeIds(prev => {
          const newSet = new Set([...prev, step.requiredNodeId]);
          // Don't auto-advance - let user click the arrow to continue
          return newSet;
        });
      } else {
        console.log('Tutorial - Different oscillator type, allowing user to experiment');

        // Allow any oscillator to be added so user can experiment
        // Pre-set parameters and blur them, just like the correct oscillator
        const targetParams = step.targetParameters || {};
        const allParamNames = Object.keys(targetParams);

        const experimentNode = {
          ...nodeData,
          data: {
            ...targetParams, // Set the same target parameters
            tutorialMode: true,
            blurredParams: step.blurAllParameters ? allParamNames : []
          },
          draggable: true,
          selectable: true,
          connectable: true
        };

        console.log('Tutorial - Adding experiment node:', experimentNode);
        setNodes((nds) => [...nds, experimentNode]);

        // Auto-connect the experiment node using the same edges as the required node
        // but with the experiment node's ID
        const requiredNodeId = step.requiredNodeId;
        const experimentEdges = (preset.initialEdges || [])
          .filter(edge => edge.source === requiredNodeId || edge.target === requiredNodeId)
          .map(edge => ({
            ...edge,
            id: edge.id.replace(requiredNodeId, experimentNode.id),
            source: edge.source === requiredNodeId ? experimentNode.id : edge.source,
            target: edge.target === requiredNodeId ? experimentNode.id : edge.target
          }));
        if (experimentEdges.length > 0) {
          console.log('Tutorial - Auto-connecting experiment edges:', experimentEdges);
          setEdges((eds) => {
            const existingEdgeIds = new Set(eds.map(e => e.id));
            const newEdges = experimentEdges.filter(edge => !existingEdgeIds.has(edge.id));
            return [...eds, ...newEdges];
          });
        }

        // Add to tutorialNodeIds so it's recognized in the filter
        setTutorialNodeIds(prev => new Set([...prev, experimentNode.id]));
      }
    };

    console.log('Tutorial - Registering tutorialNodeAdd event listener');
    window.addEventListener('tutorialNodeAdd', handleNodeAdd);
    return () => {
      console.log('Tutorial - Removing tutorialNodeAdd event listener');
      window.removeEventListener('tutorialNodeAdd', handleNodeAdd);
    };
  }, [currentStep, initialized, preset, setNodes, setEdges, setTutorialNodeIds, handleNext]);

  // Handle connections during tutorial
  useEffect(() => {
    if (!initialized) return;

    const handleConnection = (event) => {
      // Level 2: Always accept all connections
      if (isLevel2) {
        window.dispatchEvent(new CustomEvent('tutorialConnectionAccepted'));
        return;
      }

      const { connection, sourceNode, targetNode } = event.detail;
      const step = preset.steps[currentStep];

      // For chooseNode steps, allow all connections so users can experiment
      if (step.type === 'chooseNode') {
        window.dispatchEvent(new CustomEvent('tutorialConnectionAccepted'));
        return;
      }

      // For other steps, you can add validation logic here
      // For now, accept all connections
      window.dispatchEvent(new CustomEvent('tutorialConnectionAccepted'));
    };

    window.addEventListener('tutorialConnection', handleConnection);
    return () => window.removeEventListener('tutorialConnection', handleConnection);
  }, [currentStep, initialized, preset, isLevel2]);

  if (!preset) {
    return <div>Preset not found</div>;
  }

  // Level 2: Challenge Mode - No tutorial UI, just the sequencer is visible
  if (isLevel2) {
    return null; // The sequencer node is already on the canvas
  }

  // Level 1: Guided Tutorial Mode
  const step = preset.steps[currentStep];

  // Determine which buttons to flash based on current step
  const getFlashingButtons = () => {
    if (!step) return [];

    if (step.type === 'chooseNode') {
      const nodeType = step.requiredNodeType;
      // Flash all oscillator buttons
      if (nodeType.includes('Osc')) {
        return ['oscillators'];
      }
    } else if (step.nodeId === 'tutorial-envelope') {
      return ['envelope'];
    } else if (step.nodeId === 'tutorial-reverb') {
      return ['effects'];
    }
    return [];
  };

  const flashingButtons = getFlashingButtons();

  // Get simple instruction text
  const getInstruction = () => {
    if (!step) return '';

    if (step.type === 'chooseNode') {
      const nodeType = step.requiredNodeType;
      // Check what type of node to choose
      if (nodeType.includes('Osc')) {
        return 'Choose an Oscillator';
      } else if (nodeType === 'envelopeNode') {
        return 'Choose the Envelope to Shape the Sound';
      } else if (nodeType === 'reverbNode' || nodeType === 'delayNode' || nodeType === 'chorusNode' ||
                 nodeType === 'distortionNode' || nodeType === 'phaserNode' || nodeType === 'vibratoNode' ||
                 nodeType === 'pitchShifterNode') {
        return 'Choose an Effect';
      }
      return 'Choose a Node';
    } else if (step.type === 'adjustParameter') {
      return 'Adjust the Settings';
    } else if (step.type === 'complete') {
      return 'Tutorial Complete';
    }
    return step.title;
  };

  // Store flashing categories in window for App.jsx to access
  useEffect(() => {
    window.tutorialFlashCategories = flashingButtons;
    window.dispatchEvent(new CustomEvent('tutorialFlashUpdate'));

    return () => {
      window.tutorialFlashCategories = [];
      window.dispatchEvent(new CustomEvent('tutorialFlashUpdate'));
    };
  }, [flashingButtons.join(',')]);

  return (
    <>
      {/* StarCrush Font */}
      <style>{`
        @font-face {
          font-family: 'StarCrush';
          src: url('/Star Crush.ttf') format('truetype');
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes arrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
      `}</style>

      {/* Simple Instruction Text with Arrow */}
      <div style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '30px'
      }}>
        <div style={{
          fontFamily: 'StarCrush, sans-serif',
          fontSize: '64px',
          color: '#000',
          textShadow: '4px 4px 0 rgba(255,255,255,0.3)',
          letterSpacing: '4px',
          textAlign: 'center'
        }}>
          {getInstruction()}
        </div>
        <button
          onClick={handleNext}
          style={{
            fontSize: '64px',
            animation: 'arrowBounce 1.5s ease-in-out infinite',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: '#000',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          →
        </button>
      </div>

      {/* Exit Button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid white',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          zIndex: 1001
        }}
      >
        ✕ Exit
      </button>
    </>
  );
}
