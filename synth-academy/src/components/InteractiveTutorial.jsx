import { useState, useEffect, useCallback } from 'react';
import { tutorialPresets } from '../tutorialPresets';

/**
 * InteractiveTutorial - "Fix the synth" style tutorial
 * Users swap modules and adjust parameters to recreate a target sound
 */
export function InteractiveTutorial({ presetKey, setNodes, setEdges, onComplete, onClose }) {
  const preset = tutorialPresets[presetKey];
  const [currentStep, setCurrentStep] = useState(0); // Start at step 1 (index 0)
  const [showCelebration, setShowCelebration] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [tutorialNodeIds, setTutorialNodeIds] = useState(new Set());

  // Helper to get random value for a parameter - wrapped in useCallback to prevent infinite loops
  const getRandomParameterValue = useCallback((nodeId, paramName) => {
    // Define parameter ranges for randomization
    const paramRanges = {
      'tutorial-sawtooth': {
        detune: { min: -50, max: 50 },
        octaveOffset: { min: -2, max: 2, step: 1 },
        unisonVoices: { min: 1, max: 7, step: 1 },
        unisonSpread: { min: 0, max: 50, step: 1 }
      },
      'tutorial-envelope': {
        delay: { min: 0, max: 2 },
        attack: { min: 0.001, max: 2 },
        hold: { min: 0, max: 2 },
        decay: { min: 0.001, max: 3 },
        sustain: { min: 0, max: 1 },
        release: { min: 0.001, max: 5 }
      },
      'tutorial-reverb': {
        wet: { min: 0, max: 1 },
        decay: { min: 0.1, max: 10 },
        preDelay: { min: 0, max: 0.1 }
      }
    };

    const nodeRanges = paramRanges[nodeId];
    if (!nodeRanges || !nodeRanges[paramName]) return undefined;

    const range = nodeRanges[paramName];
    const random = Math.random() * (range.max - range.min) + range.min;

    if (range.step) {
      return Math.round(random / range.step) * range.step;
    }
    return parseFloat(random.toFixed(3));
  }, []); // Empty deps - this function doesn't depend on any props or state

  // Initialize tutorial - add all nodes fully connected WITH tutorial mode enabled from the start
  useEffect(() => {
    if (!preset || initialized) return;

    console.log('Tutorial - Initializing with preset:', preset.name);

    // Get the current step's blur configuration (respects currentStep initial value)
    const initialStep = preset.steps[currentStep];
    console.log('Tutorial - Initial step:', initialStep);

    // Add all nodes including the oscillator with tutorial mode enabled
    const nodesToAdd = preset.nodes.filter(Boolean).map(node => {
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
          // Randomize the active parameter
          const randomValue = getRandomParameterValue(node.id, activeParam);
          if (randomValue !== undefined) {
            nodeData[activeParam] = randomValue;
            console.log(`Tutorial - Randomizing ${node.id}.${activeParam} to ${randomValue}`);
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
          filter: isBlurred ? 'blur(5px)' : 'none',
          opacity: isBlurred ? 0.5 : 1,
          transition: 'all 0.3s ease',
          border: isFocus ? '3px solid #4CAF50' : undefined,
          boxShadow: isFocus ? '0 0 20px rgba(76, 175, 80, 0.5)' : undefined
        },
        draggable: true,
        selectable: true,
        connectable: true
      };
    });

    const edgesToAdd = preset.initialEdges || [];

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
    const step = preset.steps[currentStep];

    console.log('Tutorial - Applying step:', currentStep, step);
    console.log('Tutorial - Blurred node IDs:', step.blurredNodeIds);
    console.log('Tutorial - Blurred params:', step.blurredParams);

    setNodes(prevNodes => prevNodes.map(node => {
      if (!tutorialNodeIds.has(node.id)) {
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
          // Randomize the active parameter
          const randomValue = getRandomParameterValue(node.id, activeParam);
          if (randomValue !== undefined) {
            nodeData[activeParam] = randomValue;
            console.log(`Tutorial - Randomizing ${node.id}.${activeParam} to ${randomValue}`);
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
          filter: isBlurred ? 'blur(5px)' : 'none',
          opacity: isBlurred ? 0.5 : 1,
          transition: 'all 0.3s ease',
          border: isFocus ? '3px solid #4CAF50' : undefined,
          boxShadow: isFocus ? '0 0 20px rgba(76, 175, 80, 0.5)' : undefined
        },
        draggable: true,
        selectable: true,
        connectable: true
      };
    }));
  }, [currentStep, initialized, preset, setNodes, tutorialNodeIds, getRandomParameterValue]);

  // Handle next button click
  const handleNext = () => {
    if (currentStep < preset.steps.length - 1) {
      setCurrentStep(currentStep + 1);

      const nextStep = preset.steps[currentStep + 1];
      if (nextStep?.type === 'complete') {
        if (onComplete) onComplete();
      }
    } else {
      if (onComplete) onComplete();
    }
  };

  if (!preset) {
    return <div>Preset not found</div>;
  }

  const step = preset.steps[currentStep];
  const progress = ((currentStep + 1) / preset.steps.length) * 100;

  return (
    <>
      {/* Bottom instruction bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        boxShadow: '0 -4px 6px rgba(0,0,0,0.3)',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>{preset.name}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕ Exit Tutorial
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            Step {currentStep + 1} of {preset.steps.length}
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '15px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              {step.type === 'adjustParameter' ? '🎚️ ' : step.type === 'complete' ? '🎉 ' : '🔌 '}
              {step.title}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>{step.description}</p>
          </div>

          {step.type !== 'complete' && (
            <button
              onClick={handleNext}
              style={{
                background: '#4CAF50',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                marginLeft: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#45a049'}
              onMouseOut={(e) => e.target.style.background = '#4CAF50'}
            >
              Next →
            </button>
          )}
        </div>
      </div>

    </>
  );
}
