import React, { useState, useEffect } from 'react';

/**
 * OnboardingTutorial - Interactive walkthrough for first-time users
 * Shows step-by-step guide with arrows and animations
 * Can be skipped or replayed via info button
 */
export function OnboardingTutorial({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Tutorial steps
  const steps = [
    {
      id: 'oscillators',
      title: 'Oscillators - The Sound Makers',
      description: 'An oscillator is a wave that makes sound! Click one to add it to the canvas.',
      targetSelector: '.floating-button[data-tooltip="SINE"]',
      position: 'right',
      highlightArea: 'oscillator-buttons',
      flashButtons: ['SINE', 'SQUARE', 'SAWTOOTH', 'TRIANGLE', 'PULSE', 'NOISE']
    },
    {
      id: 'output',
      title: 'Add an Output',
      description: 'Now add an Output node so you can hear the sound!',
      targetSelector: '.floating-button[data-tooltip="OUTPUT"]',
      position: 'right',
      flashButtons: ['OUTPUT']
    },
    {
      id: 'connect',
      title: 'Connect Them Together',
      description: 'Click and drag from the green circle on the right of the oscillator to the green circle on the left of the Output to connect them!',
      targetSelector: '.react-flow__node',
      position: 'center',
      flashHandles: 'connection' // Flash specific connection handles
    },
    {
      id: 'piano',
      title: 'Add a Piano',
      description: 'Now add a Piano node so you can play notes!',
      targetSelector: '.floating-button[data-tooltip="PIANO"]',
      position: 'right',
      flashButtons: ['PIANO']
    },
    {
      id: 'play',
      title: 'Make Some Music!',
      description: 'Click on the Piano node and use your keyboard to play notes and hear your synth!',
      targetSelector: '.react-flow__node-pianoNode',
      position: 'center',
      flashPiano: true
    },
    {
      id: 'envelope-add',
      title: 'Give Your Sound Shape!',
      description: 'Add an Envelope node to control how your sound starts and stops.',
      targetSelector: '.floating-button[data-tooltip="ENVELOPE"]',
      position: 'right',
      flashButtons: ['ENVELOPE']
    },
    {
      id: 'delete-wire',
      title: 'Remove the Old Connection',
      description: 'Click on the wire between the oscillator and Output to delete it, so we can add the Envelope in between!',
      targetSelector: '.react-flow__edge',
      position: 'center',
      flashEdge: true
    },
    {
      id: 'connect-osc-envelope',
      title: 'Connect Oscillator to Envelope',
      description: 'Drag a wire from the right circle of the oscillator to the left circle of the Envelope.',
      targetSelector: '.react-flow__node',
      position: 'center',
      flashHandles: 'osc-to-envelope'
    },
    {
      id: 'connect-envelope-output',
      title: 'Connect Envelope to Output',
      description: 'Now drag a wire from the right circle of the Envelope to the left circle of the Output.',
      targetSelector: '.react-flow__node',
      position: 'center',
      flashHandles: 'envelope-to-output'
    },
    {
      id: 'envelope-params',
      title: 'Shape Your Sound!',
      description: 'Play around with the Envelope parameters and test how they change the sound on the Piano!',
      targetSelector: '.react-flow__node-envelopeNode',
      position: 'center',
      flashEnvelope: true
    },
    {
      id: 'lfo-add',
      title: 'Make It Wavy!',
      description: 'Add an LFO node to modulate the pitch and make your sound "wavy"!',
      targetSelector: '.floating-button[data-tooltip="LFO"]',
      position: 'right',
      flashButtons: ['LFO']
    },
    {
      id: 'connect-lfo',
      title: 'Connect LFO to Oscillator',
      description: 'Drag a wire from the right circle of the LFO to the top circle of the oscillator.',
      targetSelector: '.react-flow__node',
      position: 'center',
      flashHandles: 'lfo-to-osc'
    },
    {
      id: 'lfo-params',
      title: 'Experiment with the LFO!',
      description: 'Play around with the LFO parameters and hear how it affects the sound!',
      targetSelector: '.react-flow__node-lfoNode',
      position: 'center',
      flashLFO: true
    }
  ];

  const currentStepData = steps[currentStep];

  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tutorial complete
      handleComplete();
    }
  };

  // Handle skip
  const handleSkip = () => {
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  // Handle complete
  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  // Get position of target element
  const getTargetPosition = () => {
    if (!currentStepData?.targetSelector) return null;

    const element = document.querySelector(currentStepData.targetSelector);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  };

  const targetPos = getTargetPosition();

  // Add flashing class to buttons
  useEffect(() => {
    if (!currentStepData?.flashButtons) return;

    const buttons = currentStepData.flashButtons.map(tooltip =>
      document.querySelector(`.floating-button[data-tooltip="${tooltip}"]`)
    ).filter(Boolean);

    buttons.forEach(btn => btn?.classList.add('onboarding-flash'));

    return () => {
      buttons.forEach(btn => btn?.classList.remove('onboarding-flash'));
    };
  }, [currentStepData]);

  // Add flashing to connection handles
  useEffect(() => {
    if (!currentStepData?.flashHandles) return;

    const handlesToFlash = [];

    if (currentStepData.flashHandles === 'connection') {
      // Flash only the output handle of oscillator nodes and input handle of output nodes
      const oscillatorNodes = document.querySelectorAll('[class*="OscNode"]');
      const outputNodes = document.querySelectorAll('[class*="outputNode"]');

      // Get source handles (right side) from oscillators
      oscillatorNodes.forEach(node => {
        const sourceHandles = node.querySelectorAll('.react-flow__handle-right');
        handlesToFlash.push(...sourceHandles);
      });

      // Get target handles (left side) from output nodes
      outputNodes.forEach(node => {
        const targetHandles = node.querySelectorAll('.react-flow__handle-left');
        handlesToFlash.push(...targetHandles);
      });
    } else if (currentStepData.flashHandles === 'osc-to-envelope') {
      // Flash oscillator output and envelope input
      const oscillatorNodes = document.querySelectorAll('[class*="OscNode"]');
      const envelopeNodes = document.querySelectorAll('[class*="envelopeNode"]');

      oscillatorNodes.forEach(node => {
        const sourceHandles = node.querySelectorAll('.react-flow__handle-right');
        handlesToFlash.push(...sourceHandles);
      });

      envelopeNodes.forEach(node => {
        const targetHandles = node.querySelectorAll('.react-flow__handle-left');
        handlesToFlash.push(...targetHandles);
      });
    } else if (currentStepData.flashHandles === 'envelope-to-output') {
      // Flash envelope output and output node input
      const envelopeNodes = document.querySelectorAll('[class*="envelopeNode"]');
      const outputNodes = document.querySelectorAll('[class*="outputNode"]');

      envelopeNodes.forEach(node => {
        const sourceHandles = node.querySelectorAll('.react-flow__handle-right');
        handlesToFlash.push(...sourceHandles);
      });

      outputNodes.forEach(node => {
        const targetHandles = node.querySelectorAll('.react-flow__handle-left');
        handlesToFlash.push(...targetHandles);
      });
    } else if (currentStepData.flashHandles === 'lfo-to-osc') {
      // Flash LFO output and oscillator modulation input (top)
      const lfoNodes = document.querySelectorAll('[class*="lfoNode"]');
      const oscillatorNodes = document.querySelectorAll('[class*="OscNode"]');

      lfoNodes.forEach(node => {
        const sourceHandles = node.querySelectorAll('.react-flow__handle-right');
        handlesToFlash.push(...sourceHandles);
      });

      oscillatorNodes.forEach(node => {
        const topHandles = node.querySelectorAll('.react-flow__handle-top');
        handlesToFlash.push(...topHandles);
      });
    }

    handlesToFlash.forEach(handle => handle?.classList.add('onboarding-flash-handle'));

    return () => {
      handlesToFlash.forEach(handle => handle?.classList.remove('onboarding-flash-handle'));
    };
  }, [currentStepData]);

  // Flash piano node
  useEffect(() => {
    if (!currentStepData?.flashPiano) return;

    const pianoNode = document.querySelector('.react-flow__node-pianoNode');
    if (pianoNode) {
      pianoNode.classList.add('onboarding-flash');
    }

    return () => {
      if (pianoNode) {
        pianoNode.classList.remove('onboarding-flash');
      }
    };
  }, [currentStepData]);

  // Flash edge/wire for deletion
  useEffect(() => {
    if (!currentStepData?.flashEdge) return;

    const edges = document.querySelectorAll('.react-flow__edge-path');
    edges.forEach(edge => edge?.classList.add('onboarding-flash-edge'));

    return () => {
      edges.forEach(edge => edge?.classList.remove('onboarding-flash-edge'));
    };
  }, [currentStepData]);

  // Flash envelope node
  useEffect(() => {
    if (!currentStepData?.flashEnvelope) return;

    const envelopeNode = document.querySelector('.react-flow__node-envelopeNode');
    if (envelopeNode) {
      envelopeNode.classList.add('onboarding-flash');
    }

    return () => {
      if (envelopeNode) {
        envelopeNode.classList.remove('onboarding-flash');
      }
    };
  }, [currentStepData]);

  // Flash LFO node
  useEffect(() => {
    if (!currentStepData?.flashLFO) return;

    const lfoNode = document.querySelector('.react-flow__node-lfoNode');
    if (lfoNode) {
      lfoNode.classList.add('onboarding-flash');
    }

    return () => {
      if (lfoNode) {
        lfoNode.classList.remove('onboarding-flash');
      }
    };
  }, [currentStepData]);

  if (!isVisible || !currentStepData) return null;

  return (
    <>

      {/* Instruction box */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
          border: '3px solid #4CAF50',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '500px',
          zIndex: 10000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontFamily: 'StarCrush, sans-serif'
        }}
      >
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '28px',
              color: '#4CAF50',
              fontFamily: 'StarCrush, sans-serif',
              textShadow: '2px 2px 0 rgba(0,0,0,0.1)'
            }}
          >
            {currentStepData.title}
          </h2>
          <p
            style={{
              margin: '0 0 24px 0',
              fontSize: '18px',
              color: '#333',
              lineHeight: '1.6',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {currentStepData.description}
          </p>

          {/* Progress indicator */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: '4px',
                  background: index <= currentStep ? '#4CAF50' : '#ddd',
                  borderRadius: '2px',
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button
              onClick={handleSkip}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '2px solid #999',
                borderRadius: '8px',
                color: '#666',
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }}
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Got it!'}
            </button>
          </div>
        </div>

      {/* Animated arrow pointing to target */}
      {targetPos && currentStepData.position === 'right' && (
        <div
          style={{
            position: 'fixed',
            top: targetPos.top + targetPos.height / 2 - 20,
            left: targetPos.right + 20,
            width: '40px',
            height: '40px',
            zIndex: 10000,
            animation: 'bounce-horizontal 1.5s ease-in-out infinite'
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path
              d="M 5 20 L 25 20 L 20 15 M 25 20 L 20 25"
              stroke="#4CAF50"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes onboarding-flash-animation {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 20px 10px rgba(76, 175, 80, 0.3);
            transform: scale(1.05);
          }
        }

        .onboarding-flash {
          animation: onboarding-flash-animation 1.5s ease-in-out infinite !important;
          border-color: #4CAF50 !important;
        }

        @keyframes onboarding-flash-handle-animation {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.9);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px 15px rgba(76, 175, 80, 0.5);
            transform: scale(1.5);
          }
        }

        .onboarding-flash-handle {
          animation: onboarding-flash-handle-animation 1.2s ease-in-out infinite !important;
          background: #4CAF50 !important;
          z-index: 10001 !important;
        }

        @keyframes onboarding-flash-edge-animation {
          0%, 100% {
            stroke: #4CAF50;
            stroke-width: 2;
            filter: drop-shadow(0 0 0 rgba(76, 175, 80, 0.7));
          }
          50% {
            stroke: #66BB6A;
            stroke-width: 4;
            filter: drop-shadow(0 0 15px rgba(76, 175, 80, 0.9));
          }
        }

        .onboarding-flash-edge {
          animation: onboarding-flash-edge-animation 1.2s ease-in-out infinite !important;
          z-index: 10001 !important;
        }

        @keyframes pulse-border {
          0%, 100% {
            border-color: #4CAF50;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(76, 175, 80, 0.6);
          }
          50% {
            border-color: #66BB6A;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 40px rgba(76, 175, 80, 0.8);
          }
        }

        @keyframes bounce-horizontal {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(10px);
          }
        }
      `}</style>
    </>
  );
}

/**
 * InfoButton - Button to replay the onboarding tutorial
 */
export function OnboardingInfoButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '380px', // Position left of song bank
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        border: '3px solid #fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: '#fff',
        fontWeight: 'bold',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        fontFamily: 'Arial, sans-serif'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }}
      title="Show tutorial"
    >
      ?
    </button>
  );
}
