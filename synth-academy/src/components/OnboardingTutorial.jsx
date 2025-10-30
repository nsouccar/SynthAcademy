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
      id: 'drag-node',
      title: 'Move Your Node Around',
      description: 'Click and drag the oscillator node to move it around the canvas!',
      targetSelector: '.react-flow__node',
      position: 'center',
      flashNode: 'oscillator'
    },
    {
      id: 'pan-canvas',
      title: 'Pan the Canvas',
      description: 'Click and drag on the empty canvas area (not on a node) to pan around and explore your workspace!',
      targetSelector: '.react-flow',
      position: 'center'
    },
    {
      id: 'zoom',
      title: 'Zoom In and Out',
      description: 'Use your mouse wheel or trackpad to zoom in and out. Try it now!',
      targetSelector: '.react-flow',
      position: 'center'
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
      description: 'Play notes using your keyboard! Lower row (Z X C V B N M) plays white keys, upper row (Q W E R T Y U) plays an octave higher. Press S D G H J for black keys. Use arrow keys Up/Down to change octaves. Or click the keys with your mouse!',
      targetSelector: '.react-flow__node-pianoNode',
      position: 'center'
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
      description: 'Click on the wire between the oscillator and Output, then hit Delete on your keyboard to remove it, so we can add the Envelope in between!',
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
    },
    {
      id: 'filter-add',
      title: 'Add a Filter to Shape the Brightness',
      description: 'A filter controls the brightness of your sound! Click the Filter button to add one.',
      targetSelector: '.floating-button[data-tooltip="FILTER"]',
      position: 'right',
      flashButtons: ['FILTER']
    },
    {
      id: 'reconnect-with-filter',
      title: 'Rewire Your Effects Chain',
      description: 'Delete the wire between Envelope and Output. Then connect: Envelope → Filter → Output. This puts the filter in your signal path!',
      targetSelector: '.react-flow__edge',
      position: 'center',
      flashEdge: true
    },
    {
      id: 'filter-params',
      title: 'Shape the Brightness!',
      description: 'Play with the Filter parameters while playing notes on the Piano to hear how it changes the sound!',
      targetSelector: '.react-flow__node-filterNode',
      position: 'center',
      flashFilter: true
    },
    {
      id: 'effect-add',
      title: 'Try Adding an Effect!',
      description: 'Effects like Reverb, Delay, and Chorus add space and depth to your sound. Choose any effect to add it!',
      targetSelector: '.floating-button[data-tooltip="REVERB"]',
      position: 'right',
      flashButtons: ['REVERB', 'DELAY', 'CHORUS', 'DISTORTION', 'PHASER', 'VIBRATO'],
      highlightEffects: true
    },
    {
      id: 'effect-chain',
      title: 'Add the Effect to Your Chain',
      description: 'Connect your new effect between the Filter and Output: Filter → Effect → Output. Experiment with the effect parameters!',
      targetSelector: '.react-flow__node',
      position: 'center'
    },
    {
      id: 'tv-add',
      title: 'Visualize Your Sound!',
      description: 'Add a TV Monitor to see the waveform at any point in your chain!',
      targetSelector: '.floating-button[data-tooltip="TV"]',
      position: 'right',
      flashButtons: ['TV']
    },
    {
      id: 'tv-chain',
      title: 'See the Waveform!',
      description: 'Place the TV anywhere in your effects chain to see what the audio looks like at that point. Example: Effect → TV → Output shows the final waveform being outputted!',
      targetSelector: '.react-flow__node',
      position: 'center',
      highlightTV: true
    },
    {
      id: 'delete-node',
      title: 'Deleting Nodes',
      description: 'You can delete any node by clicking on it and pressing the Delete or Backspace key. Try it out!',
      targetSelector: '.react-flow__node',
      position: 'center'
    },
    {
      id: 'tutorial-complete',
      title: 'You Did It!',
      description: 'Now you know the basics! Exit to make weird sounds and experiment, or click the flashing purple button to learn how to recreate professional synths from your favorite songs!',
      targetSelector: null,
      position: 'center',
      highlightLearnButton: true
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

  // Handle back step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  // Flash envelope parameters (sliders)
  useEffect(() => {
    if (!currentStepData?.flashEnvelope) return;

    const envelopeNode = document.querySelector('.react-flow__node-envelopeNode');
    if (!envelopeNode) return;

    // Target the parameter slider controls within the envelope node
    const parameterControls = envelopeNode.querySelectorAll('.nodrag.nopan');
    parameterControls.forEach(control => {
      control.classList.add('onboarding-flash-envelope-param');
    });

    return () => {
      parameterControls.forEach(control => {
        control.classList.remove('onboarding-flash-envelope-param');
      });
    };
  }, [currentStepData]);

  // Flash LFO parameters (sliders and dropdown)
  useEffect(() => {
    if (!currentStepData?.flashLFO) return;

    const lfoNode = document.querySelector('.react-flow__node-lfoNode');
    if (!lfoNode) return;

    // Target the parameter controls within the LFO node
    const parameterControls = lfoNode.querySelectorAll('.nodrag.nopan');
    parameterControls.forEach(control => {
      control.classList.add('onboarding-flash-lfo-param');
    });

    return () => {
      parameterControls.forEach(control => {
        control.classList.remove('onboarding-flash-lfo-param');
      });
    };
  }, [currentStepData]);

  // Highlight oscillator node for drag tutorial
  useEffect(() => {
    if (!currentStepData?.flashNode) return;

    if (currentStepData.flashNode === 'oscillator') {
      const oscillatorNodes = document.querySelectorAll('[class*="OscNode"]');
      oscillatorNodes.forEach(node => {
        node.classList.add('onboarding-highlight-node');
      });

      return () => {
        oscillatorNodes.forEach(node => {
          node.classList.remove('onboarding-highlight-node');
        });
      };
    }
  }, [currentStepData]);

  // Flash filter parameters (sliders and dropdown)
  useEffect(() => {
    if (!currentStepData?.flashFilter) return;

    const filterNode = document.querySelector('.react-flow__node-filterNode');
    if (!filterNode) return;

    // Target the parameter controls within the filter node
    const parameterControls = filterNode.querySelectorAll('.nodrag.nopan');
    parameterControls.forEach(control => {
      control.classList.add('onboarding-flash-filter-param');
    });

    return () => {
      parameterControls.forEach(control => {
        control.classList.remove('onboarding-flash-filter-param');
      });
    };
  }, [currentStepData]);

  // Highlight Learn Famous Sounds button
  useEffect(() => {
    if (!currentStepData?.highlightLearnButton) return;

    // Target the Learn Famous Sounds button by finding button with "LEARN FAMOUS SOUNDS" text
    const buttons = Array.from(document.querySelectorAll('button'));
    const learnButton = buttons.find(btn => btn.textContent.includes('LEARN FAMOUS SOUNDS'));

    if (learnButton) {
      learnButton.classList.add('onboarding-highlight-learn-button');
    }

    return () => {
      if (learnButton) {
        learnButton.classList.remove('onboarding-highlight-learn-button');
      }
    };
  }, [currentStepData]);

  // Highlight all effects buttons
  useEffect(() => {
    if (!currentStepData?.highlightEffects) return;

    const effectButtons = ['REVERB', 'DELAY', 'CHORUS', 'DISTORTION', 'PHASER', 'VIBRATO'].map(tooltip =>
      document.querySelector(`.floating-button[data-tooltip="${tooltip}"]`)
    ).filter(Boolean);

    effectButtons.forEach(btn => btn?.classList.add('onboarding-highlight-effects'));

    return () => {
      effectButtons.forEach(btn => btn?.classList.remove('onboarding-highlight-effects'));
    };
  }, [currentStepData]);

  // Highlight TV node
  useEffect(() => {
    if (!currentStepData?.highlightTV) return;

    const tvNodes = document.querySelectorAll('.react-flow__node-tvNode');
    tvNodes.forEach(node => {
      node.classList.add('onboarding-highlight-node');
    });

    return () => {
      tvNodes.forEach(node => {
        node.classList.remove('onboarding-highlight-node');
      });
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
              onClick={handleBack}
              disabled={currentStep === 0}
              style={{
                padding: '10px 20px',
                background: currentStep === 0 ? '#ccc' : 'transparent',
                border: '2px solid #999',
                borderRadius: '8px',
                color: currentStep === 0 ? '#999' : '#666',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fontSize: '14px',
                opacity: currentStep === 0 ? 0.5 : 1
              }}
            >
              ← Back
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

          {/* X Close Button - Top Right of Dialog */}
          <button
            onClick={handleSkip}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: '2px solid #999',
              borderRadius: '50%',
              color: '#666',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f44336';
              e.currentTarget.style.borderColor = '#f44336';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#999';
              e.currentTarget.style.color = '#666';
            }}
          >
            ✕
          </button>
        </div>

      {/* Animations */}
      <style>{`
        @keyframes onboarding-flash-animation {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 1);
            transform: scale(1);
            background: inherit;
          }
          50% {
            box-shadow: 0 0 60px 30px rgba(76, 175, 80, 0.9);
            transform: scale(1.15);
            background: rgba(76, 175, 80, 0.3);
          }
        }

        .onboarding-flash {
          animation: onboarding-flash-animation 0.8s ease-in-out infinite !important;
          border: 4px solid #4CAF50 !important;
          position: relative;
          z-index: 9999 !important;
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

        @keyframes onboarding-flash-lfo-param-animation {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 87, 108, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 15px 8px rgba(245, 87, 108, 0.4);
            transform: scale(1.02);
          }
        }

        .onboarding-flash-lfo-param {
          animation: onboarding-flash-lfo-param-animation 1.5s ease-in-out infinite !important;
          border-radius: 4px !important;
        }

        @keyframes onboarding-flash-envelope-param-animation {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 87, 108, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 15px 8px rgba(245, 87, 108, 0.4);
            transform: scale(1.02);
          }
        }

        .onboarding-flash-envelope-param {
          animation: onboarding-flash-envelope-param-animation 1.5s ease-in-out infinite !important;
          border-radius: 4px !important;
        }

        .onboarding-highlight-node {
          border: 3px solid #4CAF50 !important;
          box-shadow: 0 0 20px rgba(76, 175, 80, 0.6) !important;
          transition: all 0.3s ease !important;
        }

        @keyframes onboarding-flash-filter-param-animation {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 15px 8px rgba(76, 175, 80, 0.4);
            transform: scale(1.02);
          }
        }

        .onboarding-flash-filter-param {
          animation: onboarding-flash-filter-param-animation 1.5s ease-in-out infinite !important;
          border-radius: 4px !important;
        }

        @keyframes onboarding-highlight-learn-button-animation {
          0%, 100% {
            box-shadow: 0 0 40px 20px rgba(156, 39, 176, 1);
            transform: scale(1);
            background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 50%, #6A1B9A 100%) !important;
          }
          50% {
            box-shadow: 0 0 60px 30px rgba(156, 39, 176, 0.8);
            transform: scale(1.08);
            background: linear-gradient(135deg, #CE93D8 0%, #BA68C8 50%, #AB47BC 100%) !important;
          }
        }

        .onboarding-highlight-learn-button {
          animation: onboarding-highlight-learn-button-animation 0.8s ease-in-out infinite !important;
          z-index: 10001 !important;
          border-color: #E1BEE7 !important;
        }

        @keyframes onboarding-highlight-effects-animation {
          0%, 100% {
            box-shadow: 0 0 20px 5px rgba(76, 175, 80, 0.8);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px 10px rgba(76, 175, 80, 0.6);
            transform: scale(1.05);
          }
        }

        .onboarding-highlight-effects {
          animation: onboarding-highlight-effects-animation 1.5s ease-in-out infinite !important;
          border-color: #4CAF50 !important;
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
        left: '20px', // Position in upper left corner
        padding: '12px 24px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        border: '3px solid #fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#fff',
        fontWeight: 'bold',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        fontFamily: 'StarCrush, sans-serif',
        letterSpacing: '2px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }}
      title="Show tutorial"
    >
      TUTORIAL
    </button>
  );
}
