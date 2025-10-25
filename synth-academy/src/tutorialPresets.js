/**
 * Tutorial Presets
 * Each preset defines a complete synth chain with specific parameters
 * and the learning steps for the user to complete
 */

export const tutorialPresets = {
  betterOffAlone: {
    name: "Better Off Alone - Lead Synth",
    description: "Learn to build Alice Deejay's iconic lead sound",

    // Complete node configuration
    nodes: [
      {
        id: 'tutorial-sequencer',
        type: 'pianoRollNode',
        position: { x: 150, y: 100 },
        data: {
          midiFilePath: '/Samplab_YAYAYA.mid', // Path to MIDI file in public folder
          isPlaying: false,
          tempo: 140,
          notes: [], // Will be loaded from MIDI file
          loopLength: 16,
          canvasHeight: 400,
          canvasWidth: 1000,
          compactMode: true, // Show only play button in tutorial mode
          referenceParams: {
            // Correct "Better Off Alone" synth parameters
            envelope: {
              attack: 0.01,
              decay: 0.1,
              sustain: 1.0,
              release: 0.02
            },
            reverb: {
              wet: 0.2,
              decay: 3.0,
              preDelay: 0.01
            }
          }
        }
      },
      {
        id: 'tutorial-piano',
        type: 'pianoNode',
        position: { x: 150, y: 600 },
        data: {
          voiceMode: 'mono', // Mono mode for lead
        }
      },
      {
        id: 'tutorial-sawtooth',
        type: 'sawtoothOscNode',
        position: { x: 500, y: 350 },
        data: {
          // Target values for "Better Off Alone" lead synth
          detune: 0,           // Target: 0
          octaveOffset: 0,     // Target: 0
          unisonVoices: 1,     // Target: 1
          unisonSpread: 50     // Target: 50
        }
      },
      {
        id: 'tutorial-envelope',
        type: 'envelopeNode',
        position: { x: 850, y: 150 },
        data: {
          // Target values for "Better Off Alone" lead synth
          attack: 0.01,   // Fast attack
          decay: 0.1,     // Short decay
          sustain: 1.0,   // 100% sustain
          release: 0.02   // 20ms release
        }
      },
      {
        id: 'tutorial-reverb',
        type: 'reverbNode',
        position: { x: 1200, y: 450 },
        data: {
          wet: 0.2,      // 20% wet
          decay: 3.0,    // Big size
          preDelay: 0.01
        }
      },
      {
        id: 'tutorial-output',
        type: 'outputNode',
        position: { x: 1550, y: 250 },
        data: {}
      }
    ],

    // Complete edge configuration
    edges: [
      {
        id: 'e-piano-sawtooth',
        source: 'tutorial-piano',
        target: 'tutorial-sawtooth',
        sourceHandle: 'trigger-out',
        targetHandle: 'trigger-in'
      },
      {
        id: 'e-sawtooth-envelope',
        source: 'tutorial-sawtooth',
        target: 'tutorial-envelope',
        sourceHandle: 'audio-out',
        targetHandle: 'audio-in'
      },
      {
        id: 'e-envelope-reverb',
        source: 'tutorial-envelope',
        target: 'tutorial-reverb',
        sourceHandle: 'audio-out',
        targetHandle: 'audio-in'
      },
      {
        id: 'e-reverb-output',
        source: 'tutorial-reverb',
        target: 'tutorial-output',
        sourceHandle: 'audio-out',
        targetHandle: 'audio-in'
      }
    ],

    // All edges - the complete chain is pre-connected
    initialEdges: [
      {
        id: 'e-piano-sawtooth',
        source: 'tutorial-piano',
        target: 'tutorial-sawtooth',
        sourceHandle: 'trigger-out',
        targetHandle: 'trigger-in'
      },
      {
        id: 'e-sawtooth-envelope',
        source: 'tutorial-sawtooth',
        target: 'tutorial-envelope',
        sourceHandle: 'audio-out',
        targetHandle: 'audio-in'
      },
      {
        id: 'e-envelope-reverb',
        source: 'tutorial-envelope',
        target: 'tutorial-reverb',
        sourceHandle: 'audio-out',
        targetHandle: 'audio-in'
      },
      {
        id: 'e-reverb-output',
        source: 'tutorial-reverb',
        target: 'tutorial-output',
        sourceHandle: 'audio-out',
        targetHandle: 'audio-in'
      }
    ],

    // Learning steps - user clicks through each parameter one by one
    steps: [
      // Step 0: Choose the oscillator type
      {
        stepNumber: 0,
        title: "Choose the Oscillator",
        description: "Which oscillator type should we use for this bright, cutting lead sound? Drag the correct oscillator type onto the canvas. Try different types to hear how they sound!",
        concisePrompt: "Which oscillator should we use?",
        type: 'chooseNode',
        requiredNodeType: 'sawtoothOscNode',
        requiredNodeId: 'tutorial-sawtooth',
        hint: "Think about which waveform has a bright, harsh sound with lots of harmonics.",
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb'],
        blurredParams: {
          'tutorial-envelope': ['attack', 'decay', 'sustain', 'release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          detune: 0,
          octaveOffset: 0,
          unisonVoices: 1,
          unisonSpread: 50
        },
        blurAllParameters: true  // All parameters start blurred
      },

      // Sawtooth Oscillator: detune, octaveOffset, unisonVoices, unisonSpread (in order from top to bottom)
      {
        stepNumber: 1,
        title: "Adjust Detune",
        description: "Great choice! Now adjust the Detune parameter. Play with it to hear how it affects the sound!",
        concisePrompt: "Adjust the Detune",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb'],
        blurredParams: {
          'tutorial-sawtooth': ['octaveOffset', 'unisonVoices', 'unisonSpread'],
          'tutorial-envelope': ['attack', 'decay', 'sustain', 'release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          detune: 0
        },
      },
      {
        stepNumber: 2,
        title: "Adjust Octave",
        description: "Now adjust the Octave Offset to get the right pitch range.",
        concisePrompt: "Adjust the Octave",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb'],
        blurredParams: {
          'tutorial-sawtooth': ['unisonVoices', 'unisonSpread'],
          'tutorial-envelope': ['attack', 'decay', 'sustain', 'release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          octaveOffset: 0
        },
      },
      {
        stepNumber: 3,
        title: "Adjust Unison Voices",
        description: "Set the number of unison voices for a richer sound.",
        concisePrompt: "Adjust Unison Voices",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb'],
        blurredParams: {
          'tutorial-sawtooth': ['unisonSpread'],
          'tutorial-envelope': ['attack', 'decay', 'sustain', 'release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          unisonVoices: 1
        },
      },
      {
        stepNumber: 4,
        title: "Adjust Unison Spread",
        description: "Finally, adjust the spread between unison voices.",
        concisePrompt: "Adjust Unison Spread",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb'],
        blurredParams: {
          'tutorial-sawtooth': [],
          'tutorial-envelope': ['attack', 'decay', 'sustain', 'release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          unisonSpread: 50
        },
      },

      // Step 5: Choose envelope
      {
        stepNumber: 5,
        title: "Add the Envelope",
        description: "Oscillator done! Now try playing the piano. Notice the sound doesn't stop when you release the key? We need an envelope to shape how the sound changes over time. Drag an Envelope node onto the canvas and connect it between the oscillator and reverb.",
        concisePrompt: "Add an Envelope",
        type: 'chooseNode',
        requiredNodeType: 'envelopeNode',
        requiredNodeId: 'tutorial-envelope',
        hint: "The envelope controls how the volume changes from note-on to note-off (Attack, Decay, Sustain, Release).",
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb'],
        blurredParams: {
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          attack: 0.01,
          decay: 0.1,
          sustain: 1.0,
          release: 0.02
        },
        blurAllParameters: true
      },

      // Envelope: attack, decay, sustain, release
      {
        stepNumber: 6,
        title: "Adjust Envelope Attack",
        description: "Perfect! Now shape the envelope. Start with the Attack parameter - how quickly the sound reaches full volume.",
        concisePrompt: "Adjust Attack",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb'],
        blurredParams: {
          'tutorial-envelope': ['decay', 'sustain', 'release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          attack: 0.01
        },
      },
      {
        stepNumber: 7,
        title: "Adjust Envelope Decay",
        description: "Great! Now adjust the Decay time - how long it takes to fall from peak to sustain level.",
        concisePrompt: "Adjust Decay",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb'],
        blurredParams: {
          'tutorial-envelope': ['sustain', 'release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          decay: 0.1
        },
      },
      {
        stepNumber: 8,
        title: "Adjust Envelope Sustain",
        description: "Perfect! Adjust the Sustain level - the volume while holding the note.",
        concisePrompt: "Adjust Sustain",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb'],
        blurredParams: {
          'tutorial-envelope': ['release'],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          sustain: 1.0
        },
      },
      {
        stepNumber: 9,
        title: "Adjust Envelope Release",
        description: "Almost there! Adjust the Release time - how long the sound fades after releasing the key.",
        concisePrompt: "Adjust Release",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb'],
        blurredParams: {
          'tutorial-envelope': [],
          'tutorial-reverb': ['wet', 'decay', 'preDelay']
        },
        targetParameters: {
          release: 0.02
        },
      },

      // Step 10: Choose effect (Reverb)
      {
        stepNumber: 10,
        title: "Choose the Effect",
        description: "Envelope done! Now let's add some space to the sound. Which effect should we use? Drag different effects onto the canvas to hear how they sound!",
        concisePrompt: "Which effect should we add?",
        type: 'chooseNode',
        requiredNodeType: 'reverbNode',
        requiredNodeId: 'tutorial-reverb',
        hint: "Think about which effect adds a sense of space and room ambience.",
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-output'],
        blurredNodeIds: [],
        blurredParams: {},
        targetParameters: {
          wet: 0.2,
          decay: 3.0,
          preDelay: 0.01
        },
        blurAllParameters: true
      },

      // Reverb: wet, decay, preDelay
      {
        stepNumber: 11,
        title: "Adjust Reverb Mix",
        description: "Excellent choice! Now adjust the wet/dry mix to control how much reverb to add.",
        concisePrompt: "Adjust Reverb Mix",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-reverb',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: [],
        blurredParams: {
          'tutorial-reverb': ['decay', 'preDelay'],
        },
        targetParameters: {
          wet: 0.2
        },
      },
      {
        stepNumber: 12,
        title: "Adjust Reverb Decay",
        description: "Good! Now adjust the decay time - how long the reverb tail lasts.",
        concisePrompt: "Adjust Reverb Decay",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-reverb',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: [],
        blurredParams: {
          'tutorial-reverb': ['preDelay'],
        },
        targetParameters: {
          decay: 3.0
        },
      },
      {
        stepNumber: 13,
        title: "Adjust Reverb Pre-Delay",
        description: "Finally, adjust the pre-delay - the gap before the reverb starts.",
        concisePrompt: "Adjust Pre-Delay",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-reverb',
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: [],
        blurredParams: {
          'tutorial-reverb': [],
        },
        targetParameters: {
          preDelay: 0.01
        },
      },

      // Complete
      {
        stepNumber: 14,
        title: "Tutorial Complete!",
        description: "Perfect! You've built the complete 'Better Off Alone' lead synth! Try playing some notes to hear your creation.",
        concisePrompt: "Tutorial Complete!",
        type: 'complete',
        focusNodeId: null,
        visibleNodeIds: ['tutorial-sequencer', 'tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: [],
        blurredParams: {},
      }
    ]
  }
};
