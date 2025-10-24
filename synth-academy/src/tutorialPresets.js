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
        id: 'tutorial-piano',
        type: 'pianoNode',
        position: { x: 100, y: 200 },
        data: {
          voiceMode: 'mono', // Mono mode for lead
        }
      },
      {
        id: 'tutorial-sawtooth',
        type: 'sawtoothOscNode',
        position: { x: 350, y: 200 },
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
        position: { x: 600, y: 200 },
        data: {
          // Target values for "Better Off Alone" lead synth
          delay: 0,       // No delay
          attack: 0.01,   // Fast attack
          hold: 0,        // No hold
          decay: 0.1,     // Short decay
          sustain: 1.0,   // 100% sustain
          release: 0.02   // 20ms release
        }
      },
      {
        id: 'tutorial-reverb',
        type: 'reverbNode',
        position: { x: 850, y: 200 },
        data: {
          wet: 0.2,      // 20% wet
          decay: 3.0,    // Big size
          preDelay: 0.01
        }
      },
      {
        id: 'tutorial-output',
        type: 'outputNode',
        position: { x: 1100, y: 200 },
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
      // Sawtooth Oscillator: detune, octaveOffset, unisonVoices, unisonSpread (in order from top to bottom)
      {
        stepNumber: 1,
        title: "Adjust Detune",
        description: "Start by adjusting the Detune parameter. Play with it to hear how it affects the sound!",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-sawtooth': ['octaveOffset', 'unisonVoices', 'unisonSpread'], // All except detune
        },
      },
      {
        stepNumber: 2,
        title: "Adjust Octave",
        description: "Now adjust the Octave Offset to get the right pitch range.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-sawtooth': ['unisonVoices', 'unisonSpread'], // All except detune and octaveOffset
        },
      },
      {
        stepNumber: 3,
        title: "Adjust Unison Voices",
        description: "Set the number of unison voices for a richer sound.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-sawtooth': ['unisonSpread'], // All except detune, octaveOffset, and unisonVoices
        },
      },
      {
        stepNumber: 4,
        title: "Adjust Unison Spread",
        description: "Finally, adjust the spread between unison voices.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-sawtooth',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-sawtooth': [], // All oscillator params unblurred
        },
      },

      // Envelope: delay, attack, hold, decay, sustain, release (in order from top to bottom)
      {
        stepNumber: 5,
        title: "Adjust Envelope Delay",
        description: "Oscillator done! Now shape the envelope. Start with the Delay parameter.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-envelope': ['attack', 'hold', 'decay', 'sustain', 'release'], // All except delay
        },
      },
      {
        stepNumber: 6,
        title: "Adjust Envelope Attack",
        description: "Good! Now adjust the Attack time.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-envelope': ['hold', 'decay', 'sustain', 'release'], // All except delay and attack
        },
      },
      {
        stepNumber: 7,
        title: "Adjust Envelope Hold",
        description: "Nice! Adjust the Hold time.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-envelope': ['decay', 'sustain', 'release'], // All except delay, attack, and hold
        },
      },
      {
        stepNumber: 8,
        title: "Adjust Envelope Decay",
        description: "Great! Now adjust the Decay time.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-envelope': ['sustain', 'release'], // All except delay, attack, hold, and decay
        },
      },
      {
        stepNumber: 9,
        title: "Adjust Envelope Sustain",
        description: "Perfect! Adjust the Sustain level.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-envelope': ['release'], // All except delay, attack, hold, decay, and sustain
        },
      },
      {
        stepNumber: 10,
        title: "Adjust Envelope Release",
        description: "Almost there! Adjust the Release time.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-envelope',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-reverb', 'tutorial-output'],
        blurredParams: {
          'tutorial-envelope': [], // All envelope params unblurred
        },
      },

      // Reverb: decay, preDelay, wet (in order from top to bottom as shown in UI)
      {
        stepNumber: 11,
        title: "Adjust Reverb Decay",
        description: "Envelope done! Add space with reverb. Start with the decay time.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-reverb',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-output'],
        blurredParams: {
          'tutorial-reverb': ['preDelay', 'wet'], // All except decay
        },
      },
      {
        stepNumber: 12,
        title: "Adjust Reverb Pre-Delay",
        description: "Good! Now adjust the pre-delay time.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-reverb',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-output'],
        blurredParams: {
          'tutorial-reverb': ['wet'], // All except decay and preDelay
        },
      },
      {
        stepNumber: 13,
        title: "Adjust Reverb Mix",
        description: "Finally, adjust the wet/dry mix.",
        type: 'adjustParameter',
        focusNodeId: 'tutorial-reverb',
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: ['tutorial-output'],
        blurredParams: {
          'tutorial-reverb': [], // All reverb params unblurred
        },
      },

      // Complete
      {
        stepNumber: 14,
        title: "Tutorial Complete!",
        description: "Perfect! You've adjusted all the parameters for the 'Better Off Alone' lead synth!",
        type: 'complete',
        focusNodeId: null,
        visibleNodeIds: ['tutorial-piano', 'tutorial-sawtooth', 'tutorial-envelope', 'tutorial-reverb', 'tutorial-output'],
        blurredNodeIds: [],
        blurredParams: {},
      }
    ]
  }
};
