/**
 * Tutorial Generator
 * Transforms simple JSON configs into full tutorial presets
 */

// Import all tutorial JSON configs
import betterOffAlone from './tutorials/betterOffAlone.json';

// Registry of all tutorial configs
const tutorialConfigs = [
  betterOffAlone,
  // Add more tutorials here as you create them
];

// Map oscillator type to node type
const oscillatorTypeMap = {
  'sawtooth': 'sawtoothOscNode',
  'sine': 'sineOscNode',
  'square': 'squareOscNode',
  'triangle': 'triangleOscNode',
  'pulse': 'pulseOscNode',
  'noise': 'noiseOscNode',
};

// Map effect type to node type
const effectTypeMap = {
  'reverb': 'reverbNode',
  'delay': 'delayNode',
  'chorus': 'chorusNode',
  'distortion': 'distortionNode',
  'filter': 'filterNode',
};

// Parameter metadata for each node type (for generating steps)
const parameterMeta = {
  sawtoothOscNode: {
    params: ['detune', 'octaveOffset', 'unisonVoices', 'unisonSpread'],
    labels: {
      detune: 'Detune',
      octaveOffset: 'Octave',
      unisonVoices: 'Unison Voices',
      unisonSpread: 'Unison Spread'
    }
  },
  sineOscNode: {
    params: ['detune', 'octaveOffset', 'unisonVoices', 'unisonSpread'],
    labels: {
      detune: 'Detune',
      octaveOffset: 'Octave',
      unisonVoices: 'Unison Voices',
      unisonSpread: 'Unison Spread'
    }
  },
  squareOscNode: {
    params: ['detune', 'octaveOffset', 'unisonVoices', 'unisonSpread'],
    labels: {
      detune: 'Detune',
      octaveOffset: 'Octave',
      unisonVoices: 'Unison Voices',
      unisonSpread: 'Unison Spread'
    }
  },
  triangleOscNode: {
    params: ['detune', 'octaveOffset', 'unisonVoices', 'unisonSpread'],
    labels: {
      detune: 'Detune',
      octaveOffset: 'Octave',
      unisonVoices: 'Unison Voices',
      unisonSpread: 'Unison Spread'
    }
  },
  pulseOscNode: {
    params: ['pulseWidth', 'detune', 'octaveOffset', 'unisonVoices', 'unisonSpread'],
    labels: {
      pulseWidth: 'Pulse Width',
      detune: 'Detune',
      octaveOffset: 'Octave',
      unisonVoices: 'Unison Voices',
      unisonSpread: 'Unison Spread'
    }
  },
  noiseOscNode: {
    params: ['detune', 'unisonVoices', 'unisonSpread'],
    labels: {
      detune: 'Detune',
      unisonVoices: 'Unison Voices',
      unisonSpread: 'Unison Spread'
    }
  },
  envelopeNode: {
    params: ['attack', 'decay', 'sustain', 'release'],
    labels: {
      attack: 'Attack',
      decay: 'Decay',
      sustain: 'Sustain',
      release: 'Release'
    }
  },
  reverbNode: {
    params: ['wet', 'decay', 'preDelay'],
    labels: {
      wet: 'Mix (Wet)',
      decay: 'Decay',
      preDelay: 'Pre-Delay'
    }
  },
  delayNode: {
    params: ['wet', 'delayTime', 'feedback'],
    labels: {
      wet: 'Mix (Wet)',
      delayTime: 'Delay Time',
      feedback: 'Feedback'
    }
  },
  chorusNode: {
    params: ['wet', 'frequency', 'depth', 'delayTime'],
    labels: {
      wet: 'Mix (Wet)',
      frequency: 'Rate',
      depth: 'Depth',
      delayTime: 'Delay'
    }
  },
  distortionNode: {
    params: ['wet', 'distortion'],
    labels: {
      wet: 'Mix (Wet)',
      distortion: 'Drive'
    }
  },
  filterNode: {
    params: ['frequency', 'resonance', 'type'],
    labels: {
      frequency: 'Cutoff',
      resonance: 'Resonance',
      type: 'Type'
    }
  }
};

/**
 * Generate a full tutorial preset from a simple JSON config
 * Supports both single effect (config.chain.effect) and multiple effects (config.chain.effects)
 */
function generatePreset(config) {
  const oscType = oscillatorTypeMap[config.chain.oscillator.type];
  const oscParams = config.chain.oscillator.params;
  const envParams = config.chain.envelope;

  // Support both single effect and effects array
  const effects = config.chain.effects || [config.chain.effect];
  const effectsData = effects.map((eff, idx) => ({
    type: eff.type,
    nodeType: effectTypeMap[eff.type],
    params: eff.params,
    id: `tutorial-${eff.type}${effects.length > 1 ? `-${idx}` : ''}`
  }));

  // Node IDs
  const ids = {
    sequencer: `tutorial-sequencer`,
    piano: `tutorial-piano`,
    oscillator: `tutorial-${config.chain.oscillator.type}`,
    envelope: `tutorial-envelope`,
    effects: effectsData.map(e => e.id),
    output: `tutorial-output`
  };

  // Build referenceParams for all effects
  const referenceEffects = {};
  effectsData.forEach(eff => {
    referenceEffects[eff.type] = { ...eff.params };
  });

  // Generate nodes
  const nodes = [
    {
      id: ids.sequencer,
      type: 'pianoRollNode',
      position: { x: 150, y: 100 },
      data: {
        midiFilePath: config.midiFile,
        isPlaying: false,
        tempo: config.tempo,
        notes: [],
        loopLength: 16,
        canvasHeight: 400,
        canvasWidth: 1000,
        compactMode: true,
        referenceParams: {
          oscillator: {
            type: config.chain.oscillator.type,
            ...oscParams
          },
          envelope: { ...envParams },
          effects: effectsData.map(e => ({ type: e.type, ...e.params })),
          // Keep backward compat for single effect
          effectType: effectsData[0].type,
          ...referenceEffects
        }
      }
    },
    {
      id: ids.piano,
      type: 'pianoNode',
      position: { x: 150, y: 600 },
      data: { voiceMode: 'mono' }
    },
    {
      id: ids.oscillator,
      type: oscType,
      position: { x: 500, y: 350 },
      data: { ...oscParams }
    },
    {
      id: ids.envelope,
      type: 'envelopeNode',
      position: { x: 850, y: 150 },
      data: { ...envParams }
    }
  ];

  // Add effect nodes (spread out horizontally)
  effectsData.forEach((eff, idx) => {
    nodes.push({
      id: eff.id,
      type: eff.nodeType,
      position: { x: 1100 + idx * 300, y: 350 + (idx % 2) * 150 },
      data: { ...eff.params }
    });
  });

  // Add output node
  nodes.push({
    id: ids.output,
    type: 'outputNode',
    position: { x: 1100 + effectsData.length * 300, y: 250 },
    data: {}
  });

  // Generate edges
  const edges = [
    {
      id: 'e-piano-osc',
      source: ids.piano,
      target: ids.oscillator,
      sourceHandle: 'trigger-out',
      targetHandle: 'trigger-in'
    },
    {
      id: 'e-osc-env',
      source: ids.oscillator,
      target: ids.envelope,
      sourceHandle: 'audio-out',
      targetHandle: 'audio-in'
    }
  ];

  // Chain: envelope -> effect1 -> effect2 -> ... -> output
  let prevNodeId = ids.envelope;
  effectsData.forEach((eff, idx) => {
    edges.push({
      id: `e-${prevNodeId.replace('tutorial-', '')}-${eff.type}`,
      source: prevNodeId,
      target: eff.id,
      sourceHandle: 'audio-out',
      targetHandle: 'audio-in'
    });
    prevNodeId = eff.id;
  });

  // Last effect -> output
  edges.push({
    id: `e-${prevNodeId.replace('tutorial-', '')}-output`,
    source: prevNodeId,
    target: ids.output,
    sourceHandle: 'audio-out',
    targetHandle: 'audio-in'
  });

  // Generate steps
  const steps = generateStepsMultiEffect(config, ids, oscType, effectsData, oscParams, envParams);

  return {
    name: `${config.title} - Lead Synth`,
    description: config.description,
    nodes,
    edges,
    initialEdges: [...edges],
    steps
  };
}

/**
 * Generate the learning steps for a tutorial (multi-effect version)
 */
function generateStepsMultiEffect(config, ids, oscType, effectsData, oscParams, envParams) {
  const steps = [];
  let stepNumber = 0;

  const allNodeIds = [ids.sequencer, ids.piano, ids.oscillator, ids.envelope, ...ids.effects, ids.output];
  const oscMeta = parameterMeta[oscType];
  const envMeta = parameterMeta.envelopeNode;

  // Get only the params that exist in the config
  const activeOscParams = oscMeta.params.filter(p => oscParams[p] !== undefined);
  const activeEnvParams = envMeta.params.filter(p => envParams[p] !== undefined);

  // Build blurred params for all effects
  const allEffectBlurredParams = {};
  effectsData.forEach(eff => {
    const effMeta = parameterMeta[eff.nodeType];
    allEffectBlurredParams[eff.id] = effMeta.params.filter(p => eff.params[p] !== undefined);
  });

  // Step 0: Choose oscillator
  steps.push({
    stepNumber: stepNumber++,
    title: "Choose the Oscillator",
    description: `Which oscillator type should we use for this sound? Drag the correct oscillator onto the canvas. Try different types to hear how they sound!`,
    concisePrompt: "Which oscillator should we use?",
    type: 'chooseNode',
    requiredNodeType: oscType,
    requiredNodeId: ids.oscillator,
    hint: getOscillatorHint(config.chain.oscillator.type),
    visibleNodeIds: [ids.sequencer, ids.piano, ids.envelope, ...ids.effects, ids.output],
    blurredNodeIds: [ids.envelope, ...ids.effects],
    blurredParams: {
      [ids.envelope]: activeEnvParams,
      ...allEffectBlurredParams
    },
    targetParameters: { ...oscParams },
    blurAllParameters: true
  });

  // Oscillator parameter steps
  activeOscParams.forEach((param, idx) => {
    const remainingParams = activeOscParams.slice(idx + 1);
    steps.push({
      stepNumber: stepNumber++,
      title: `Adjust ${oscMeta.labels[param]}`,
      description: `${idx === 0 ? 'Great choice! Now adjust' : 'Now adjust'} the ${oscMeta.labels[param]} parameter.`,
      concisePrompt: `Adjust ${oscMeta.labels[param]}`,
      type: 'adjustParameter',
      focusNodeId: ids.oscillator,
      visibleNodeIds: allNodeIds,
      blurredNodeIds: [ids.envelope, ...ids.effects],
      blurredParams: {
        [ids.oscillator]: remainingParams,
        [ids.envelope]: activeEnvParams,
        ...allEffectBlurredParams
      },
      targetParameters: { [param]: oscParams[param] }
    });
  });

  // Step: Choose envelope
  steps.push({
    stepNumber: stepNumber++,
    title: "Add the Envelope",
    description: "Oscillator done! Now we need an envelope to shape how the sound changes over time. Drag an Envelope node onto the canvas.",
    concisePrompt: "Add an Envelope",
    type: 'chooseNode',
    requiredNodeType: 'envelopeNode',
    requiredNodeId: ids.envelope,
    hint: "The envelope controls Attack, Decay, Sustain, and Release.",
    visibleNodeIds: [ids.sequencer, ids.piano, ids.oscillator, ...ids.effects, ids.output],
    blurredNodeIds: [...ids.effects],
    blurredParams: { ...allEffectBlurredParams },
    targetParameters: { ...envParams },
    blurAllParameters: true
  });

  // Envelope parameter steps
  activeEnvParams.forEach((param, idx) => {
    const remainingParams = activeEnvParams.slice(idx + 1);
    steps.push({
      stepNumber: stepNumber++,
      title: `Adjust Envelope ${envMeta.labels[param]}`,
      description: `${idx === 0 ? 'Perfect! Now shape the envelope.' : ''} Adjust the ${envMeta.labels[param]} parameter.`,
      concisePrompt: `Adjust ${envMeta.labels[param]}`,
      type: 'adjustParameter',
      focusNodeId: ids.envelope,
      visibleNodeIds: allNodeIds,
      blurredNodeIds: [...ids.effects],
      blurredParams: {
        [ids.envelope]: remainingParams,
        ...allEffectBlurredParams
      },
      targetParameters: { [param]: envParams[param] }
    });
  });

  // Generate steps for each effect
  effectsData.forEach((eff, effIdx) => {
    const effMeta = parameterMeta[eff.nodeType];
    const activeEffectParams = effMeta.params.filter(p => eff.params[p] !== undefined);
    const remainingEffects = ids.effects.slice(effIdx + 1);

    // Build blurred params for remaining effects only
    const remainingEffectBlurredParams = {};
    effectsData.slice(effIdx + 1).forEach(e => {
      const meta = parameterMeta[e.nodeType];
      remainingEffectBlurredParams[e.id] = meta.params.filter(p => e.params[p] !== undefined);
    });

    const effectNumber = effectsData.length > 1 ? ` ${effIdx + 1}` : '';
    const effectName = eff.type.charAt(0).toUpperCase() + eff.type.slice(1);

    // Step: Choose this effect
    steps.push({
      stepNumber: stepNumber++,
      title: `Choose Effect${effectNumber}: ${effectName}`,
      description: effIdx === 0
        ? "Envelope done! Now let's add some character to the sound. Which effect should we use first?"
        : `Now let's add another effect to shape the sound further.`,
      concisePrompt: `Which effect should we add?`,
      type: 'chooseNode',
      requiredNodeType: eff.nodeType,
      requiredNodeId: eff.id,
      hint: getEffectHint(eff.type),
      visibleNodeIds: allNodeIds.filter(id => id !== eff.id),
      blurredNodeIds: remainingEffects,
      blurredParams: remainingEffectBlurredParams,
      targetParameters: { ...eff.params },
      blurAllParameters: true
    });

    // Effect parameter steps
    activeEffectParams.forEach((param, idx) => {
      const remainingParams = activeEffectParams.slice(idx + 1);
      steps.push({
        stepNumber: stepNumber++,
        title: `Adjust ${effectName} ${effMeta.labels[param]}`,
        description: `${idx === 0 ? 'Excellent choice! ' : ''}Adjust the ${effMeta.labels[param]} parameter.`,
        concisePrompt: `Adjust ${effMeta.labels[param]}`,
        type: 'adjustParameter',
        focusNodeId: eff.id,
        visibleNodeIds: allNodeIds,
        blurredNodeIds: remainingEffects,
        blurredParams: {
          [eff.id]: remainingParams,
          ...remainingEffectBlurredParams
        },
        targetParameters: { [param]: eff.params[param] }
      });
    });
  });

  // Complete step
  steps.push({
    stepNumber: stepNumber++,
    title: "Tutorial Complete!",
    description: `Perfect! You've built the complete '${config.title}' synth! Try playing some notes to hear your creation.`,
    concisePrompt: "Tutorial Complete!",
    type: 'complete',
    focusNodeId: null,
    visibleNodeIds: allNodeIds,
    blurredNodeIds: [],
    blurredParams: {}
  });

  return steps;
}

function getOscillatorHint(type) {
  const hints = {
    sawtooth: "Think about which waveform has a bright, harsh sound with lots of harmonics.",
    sine: "Think about which waveform is the purest, with no harmonics.",
    square: "Think about which waveform has a hollow, buzzy sound.",
    triangle: "Think about which waveform is mellow with odd harmonics.",
    pulse: "Think about which waveform can vary its brightness with pulse width.",
    noise: "Think about which source creates random frequencies."
  };
  return hints[type] || "Choose the oscillator type.";
}

function getEffectHint(type) {
  const hints = {
    reverb: "Think about which effect adds a sense of space and room ambience.",
    delay: "Think about which effect creates echoes and repeats.",
    chorus: "Think about which effect adds thickness and movement by detuning copies.",
    distortion: "Think about which effect adds grit and harmonics.",
    filter: "Think about which effect shapes the frequency content."
  };
  return hints[type] || "Choose the effect type.";
}

/**
 * Generate all tutorial presets from configs
 */
export function generateAllPresets() {
  const presets = {};
  tutorialConfigs.forEach(config => {
    // Convert song ID to preset key (e.g., "better-off-alone" -> "betterOffAlone")
    const presetKey = config.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    presets[presetKey] = generatePreset(config);
  });
  return presets;
}

/**
 * Get all songs for the SongBank, organized by difficulty
 */
export function getSongList() {
  const songs = {
    easy: [],
    medium: [],
    hard: []
  };

  tutorialConfigs.forEach(config => {
    const song = {
      id: config.id,
      title: config.title,
      artist: config.artist,
      available: true // All JSON-defined tutorials are available
    };

    if (songs[config.difficulty]) {
      songs[config.difficulty].push(song);
    }
  });

  return songs;
}

/**
 * Get the preset key for a song ID
 */
export function getPresetKeyForSong(songId) {
  return songId.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Export generated presets
export const tutorialPresets = generateAllPresets();
