// Sound presets for the guided tutorial system
export const soundPresets = {
  'poker-face-bass': {
    id: 'poker-face-bass',
    name: 'Poker Face Bass',
    artist: 'Lady Gaga',
    description: 'A deep, punchy synth bass with unison and subtle reverb',
    audioFile: '/sounds/poker-face-bass.wav', // You'll need to add this audio file

    // Tutorial steps organized by phase
    steps: [
      // PHASE 1: COLOR (Oscillators & Filters)
      {
        phase: 'color',
        question: 'Which oscillator should we use for the main sound?',
        instruction: 'Add a Sawtooth oscillator to the canvas',
        highlightToolbar: ['sawtoothOscNode'],
        requiredNodes: [
          { type: 'sawtoothOscNode', id: 'saw-1' }
        ],
        requiredParams: {}
      },
      {
        phase: 'color',
        question: 'How many voices should we use for the unison effect?',
        instruction: 'Set the sawtooth Voices to 4',
        highlightNodes: ['saw-1'],
        highlightParams: [
          { nodeId: 'saw-1', param: 'unisonVoices' }
        ],
        requiredParams: {
          'saw-1': { unisonVoices: 4 }
        }
      },
      {
        phase: 'color',
        question: 'How much should we detune the voices?',
        instruction: 'Set the sawtooth Spread to 21 cents',
        highlightNodes: ['saw-1'],
        highlightParams: [
          { nodeId: 'saw-1', param: 'unisonSpread' }
        ],
        requiredParams: {
          'saw-1': { unisonSpread: 21 }
        }
      },
      {
        phase: 'color',
        question: 'What oscillator should we add for the sub bass?',
        instruction: 'Add a Pulse oscillator for the sub bass',
        highlightToolbar: ['pulseOscNode'],
        requiredNodes: [
          { type: 'pulseOscNode', id: 'pulse-1' }
        ],
        requiredParams: {}
      },
      {
        phase: 'color',
        question: 'What octave should the sub bass be at?',
        instruction: 'Set the pulse Octave to -1',
        highlightNodes: ['pulse-1'],
        highlightParams: [
          { nodeId: 'pulse-1', param: 'octaveOffset' }
        ],
        requiredParams: {
          'pulse-1': { octaveOffset: -1 }
        }
      },
      {
        phase: 'color',
        question: 'What should the pulse width be?',
        instruction: 'Set the pulse Width to 100%',
        highlightNodes: ['pulse-1'],
        highlightParams: [
          { nodeId: 'pulse-1', param: 'pulseWidth' }
        ],
        requiredParams: {
          'pulse-1': { pulseWidth: 1.0 } // 100% = 1.0
        }
      },
      {
        phase: 'color',
        question: 'Now let\'s add a filter to shape the tone',
        instruction: 'Add a Filter node',
        highlightToolbar: ['filterNode'],
        requiredNodes: [
          { type: 'filterNode', id: 'filter-1' }
        ],
        requiredParams: {}
      },
      {
        phase: 'color',
        question: 'What should the filter cutoff be?',
        instruction: 'Set the filter Cutoff to 90%',
        highlightNodes: ['filter-1'],
        highlightParams: [
          { nodeId: 'filter-1', param: 'cutoff' }
        ],
        requiredParams: {
          'filter-1': { cutoff: 90 }
        }
      },

      // PHASE 2: SHAPE (Amp Envelope)
      {
        phase: 'shape',
        question: 'How do we control how the volume changes over time?',
        instruction: 'Add an Envelope node for amplitude',
        highlightToolbar: ['envelopeNode'],
        requiredNodes: [
          { type: 'envelopeNode', id: 'env-1' }
        ],
        requiredParams: {}
      },
      {
        phase: 'shape',
        question: 'How quickly should the sound start?',
        instruction: 'Set the envelope Attack to 0 ms',
        highlightNodes: ['env-1'],
        highlightParams: [
          { nodeId: 'env-1', param: 'attack' }
        ],
        requiredParams: {
          'env-1': { attack: 0 }
        }
      },
      {
        phase: 'shape',
        question: 'How long should it take to reach the sustain level?',
        instruction: 'Set the envelope Decay to 400 ms',
        highlightNodes: ['env-1'],
        highlightParams: [
          { nodeId: 'env-1', param: 'decay' }
        ],
        requiredParams: {
          'env-1': { decay: 0.4 } // 400ms = 0.4s
        }
      },
      {
        phase: 'shape',
        question: 'What level should the sound hold at?',
        instruction: 'Set the envelope Sustain to 50%',
        highlightNodes: ['env-1'],
        highlightParams: [
          { nodeId: 'env-1', param: 'sustain' }
        ],
        requiredParams: {
          'env-1': { sustain: 0.5 } // 50% = 0.5
        }
      },
      {
        phase: 'shape',
        question: 'How long should the sound fade out?',
        instruction: 'Set the envelope Release to 170 ms',
        highlightNodes: ['env-1'],
        highlightParams: [
          { nodeId: 'env-1', param: 'release' }
        ],
        requiredParams: {
          'env-1': { release: 0.17 } // 170ms = 0.17s
        }
      },

      // PHASE 3: GRADIENT (Modulation) - None for this preset
      // Skipping this phase for Poker Face bass

      // PHASE 4: EFFECTS
      {
        phase: 'effects',
        question: 'What effect adds space and depth?',
        instruction: 'Add a Reverb effect',
        highlightToolbar: ['reverbNode'],
        requiredNodes: [
          { type: 'reverbNode', id: 'reverb-1' }
        ],
        requiredParams: {}
      },
      {
        phase: 'effects',
        question: 'How much reverb should we add?',
        instruction: 'Set the reverb Wet to 10%',
        highlightNodes: ['reverb-1'],
        highlightParams: [
          { nodeId: 'reverb-1', param: 'wet' }
        ],
        requiredParams: {
          'reverb-1': { wet: 0.1 } // 10% = 0.1
        }
      },

      // FINAL STEP: Connect everything
      {
        phase: 'routing',
        question: 'Finally, let\'s connect everything together',
        instruction: 'Connect: Sawtooth → Filter → Envelope → Reverb → Output. Also connect: Pulse → Filter',
        requiredConnections: [
          { from: 'saw-1', to: 'filter-1' },
          { from: 'pulse-1', to: 'filter-1' },
          { from: 'filter-1', to: 'env-1' },
          { from: 'env-1', to: 'reverb-1' },
          { from: 'reverb-1', to: 'output-1' }
        ],
        requiredNodes: [
          { type: 'outputNode', id: 'output-1' }
        ]
      }
    ],

    // Target parameter ranges (for validation with tolerance)
    tolerance: {
      unisonVoices: 0, // Must be exact
      unisonSpread: 2, // ±2 cents
      octaveOffset: 0, // Must be exact
      pulseWidth: 0.05, // ±5%
      cutoff: 5, // ±5%
      attack: 0.01, // ±10ms
      decay: 0.05, // ±50ms
      sustain: 0.05, // ±5%
      release: 0.02, // ±20ms
      wet: 0.02 // ±2%
    }
  }
};
