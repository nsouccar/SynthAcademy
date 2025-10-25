import * as Tone from 'tone';
import { audioGraph } from './AudioGraph';

/**
 * VoiceManager handles the creation and management of synthesizer voices.
 *
 * Key Concepts:
 * - Voice Template: The chain you build on canvas (Osc → Filter → Effects)
 * - Voice Instance: A playing copy of the template at a specific frequency
 * - Voice Pool: Reusable voice instances for performance
 */
class VoiceManager {
  constructor() {
    // Map of template ID to voice template definition
    // Template = the chain you build: which nodes, how they connect
    this.voiceTemplates = new Map();

    // Map of active voices: voiceId -> { templateId, frequency, nodes }
    // Active voice = currently playing note
    this.activeVoices = new Map();

    // Voice counter for unique IDs
    this.voiceCounter = 0;

    // Max simultaneous voices (prevents CPU overload)
    this.maxVoices = 8;
  }

  /**
   * Register a voice template
   * A template defines what nodes are in the voice chain
   *
   * @param {string} templateId - Unique ID for this template
   * @param {object} template - Template definition
   *   {
   *     nodes: [{ type: 'oscNode', data: {...} }, { type: 'filterNode', ... }],
   *     connections: [{ from: nodeIndex, to: nodeIndex }]
   *   }
   */
  registerVoiceTemplate(templateId, template) {
    console.log(`Registering voice template: ${templateId}`, template);
    this.voiceTemplates.set(templateId, template);
  }

  /**
   * Unregister a voice template
   * @param {string} templateId - Template ID to remove
   */
  unregisterVoiceTemplate(templateId) {
    // Stop all voices using this template
    this.activeVoices.forEach((voice, voiceId) => {
      if (voice.templateId === templateId) {
        this.stopVoice(voiceId);
      }
    });

    this.voiceTemplates.delete(templateId);
    console.log(`Unregistered voice template: ${templateId}`);
  }

  /**
   * Stop all active voices using a specific template
   * This is called when the template changes (e.g., nodes added/removed)
   * @param {string} templateId - Template ID
   */
  stopVoicesForTemplate(templateId) {
    const voicesToStop = [];
    this.activeVoices.forEach((voice, voiceId) => {
      if (voice.templateId === templateId) {
        voicesToStop.push(voiceId);
      }
    });

    voicesToStop.forEach(voiceId => this.stopVoice(voiceId));
    console.log(`Stopped ${voicesToStop.length} voices for template ${templateId}`);
  }

  /**
   * Start a new voice (triggered by piano key press)
   *
   * @param {string} templateId - Which template to use
   * @param {number} frequency - Note frequency (e.g., 440 Hz for A4)
   * @param {number} velocity - How hard the key was pressed (0-1)
   * @returns {string} voiceId - Unique ID for this voice instance
   */
  startVoice(templateId, frequency, velocity = 1.0) {
    // Check if we have this template
    const template = this.voiceTemplates.get(templateId);
    if (!template) {
      console.warn(`No voice template found: ${templateId}`);
      return null;
    }

    // Check voice limit
    if (this.activeVoices.size >= this.maxVoices) {
      console.warn('Max voices reached, stealing oldest voice');
      this.stealOldestVoice();
    }

    // Create unique voice ID
    const voiceId = `voice-${this.voiceCounter++}`;

    console.log(`Starting voice ${voiceId} at ${frequency}Hz`);

    // Create voice instance
    const voiceInstance = this.createVoiceInstance(template, frequency, velocity);

    // Store active voice
    this.activeVoices.set(voiceId, {
      templateId,
      frequency,
      velocity,
      nodes: voiceInstance.nodes,
      startTime: Tone.now(),
    });

    return voiceId;
  }

  /**
   * Stop a voice (triggered by piano key release)
   *
   * @param {string} voiceId - Voice to stop
   */
  stopVoice(voiceId) {
    const voice = this.activeVoices.get(voiceId);
    if (!voice) {
      console.warn(`Voice not found: ${voiceId}`);
      return;
    }

    console.log(`Stopping voice ${voiceId}`);

    // Trigger release phase of envelopes BEFORE stopping
    voice.nodes.forEach(node => {
      if (node.type === 'envelopeNode' && node.audioNode.triggerRelease) {
        console.log(`Triggering envelope release: R=${node.data.release}s`);
        node.audioNode.triggerRelease();
      }
    });

    // Get the longest release time to know when to cleanup
    let maxReleaseTime = 0;
    voice.nodes.forEach(node => {
      if (node.type === 'envelopeNode' && node.data.release) {
        maxReleaseTime = Math.max(maxReleaseTime, node.data.release);
      }
    });

    // If no envelope, cleanup immediately; otherwise wait for release to finish
    // Add extra 100ms buffer to ensure envelope fully completes and reaches zero
    const cleanupDelay = maxReleaseTime > 0 ? (maxReleaseTime * 1000) + 100 : 0;

    // Remove from active voices immediately (don't wait for cleanup)
    this.activeVoices.delete(voiceId);

    // Cleanup all nodes in this voice (after release completes)
    setTimeout(() => {
      voice.nodes.forEach(node => {
        if (node.audioNode && !node.isCanvasNode) {
          // Only cleanup nodes that belong to this voice (not shared canvas nodes)

          // Stop oscillators (they need explicit stop call)
          // Ramp volume to -Infinity before stopping to prevent clicks
          if (node.type === 'oscNode' && node.audioNode.stop) {
            try {
              // Ramp oscillator volume to silent over 20ms
              if (node.audioNode.volume) {
                node.audioNode.volume.rampTo(-Infinity, 0.02);
              }
              // Schedule stop after ramp completes
              setTimeout(() => {
                try {
                  node.audioNode.stop();
                } catch (e) {
                  // Ignore if already stopped
                }
              }, 25);
            } catch (e) {
              // Ignore if already stopped
            }
          }

          // Stop dedicated oscillator types (including unison)
          if ((node.type === 'pulseOscNode' || node.type === 'sineOscNode' ||
               node.type === 'squareOscNode' || node.type === 'sawtoothOscNode' ||
               node.type === 'triangleOscNode' || node.type === 'noiseOscNode')) {

            // Check if this is a unison node (has multiple oscillators)
            if (node.audioNode._unisonOscillators) {
              node.audioNode._unisonOscillators.forEach(({ osc }) => {
                try {
                  if (osc.volume) {
                    osc.volume.rampTo(-Infinity, 0.02);
                  }
                  setTimeout(() => {
                    try {
                      osc.stop();
                      osc.disconnect();
                      if (osc.dispose) osc.dispose();
                    } catch (e) {
                      // Ignore cleanup errors
                    }
                  }, 25);
                } catch (e) {
                  // Ignore if already stopped
                }
              });
            } else if (node.audioNode.stop) {
              // Single oscillator
              try {
                if (node.audioNode.volume) {
                  node.audioNode.volume.rampTo(-Infinity, 0.02);
                }
                setTimeout(() => {
                  try {
                    node.audioNode.stop();
                  } catch (e) {
                    // Ignore if already stopped
                  }
                }, 25);
              } catch (e) {
                // Ignore if already stopped
              }
            }
          }

          // Disconnect and dispose everything after oscillators have stopped
          // Wait 50ms to let oscillator volume ramp and stop complete
          setTimeout(() => {
            try {
              // For filter envelopes, clean up the scaler too
              if (node.type === 'envelopeNode' && node.audioNode._scaler) {
                node.audioNode._scaler.disconnect();
                if (node.audioNode._scaler.dispose) {
                  node.audioNode._scaler.dispose();
                }
              }

              node.audioNode.disconnect();
              if (node.audioNode.dispose) {
                node.audioNode.dispose();
              }
            } catch (e) {
              // Ignore cleanup errors
            }
          }, 50);
        }
        // For canvas nodes (filters/mixers), do NOTHING
        // They stay connected and are shared across all voices
      });
    }, cleanupDelay);
  }

  /**
   * Create a voice instance from a template
   * This creates actual Tone.js objects
   *
   * @param {object} template - Voice template
   * @param {number} frequency - Note frequency
   * @param {number} velocity - Note velocity
   * @returns {object} Voice instance with nodes
   */
  createVoiceInstance(template, frequency, velocity) {
    const voiceNodes = [];

    // Create each node in the template
    template.nodes.forEach((nodeTemplate) => {
      let audioNode = null;
      let isCanvasNode = false;

      switch (nodeTemplate.type) {
        case 'oscNode':
          // OSCILLATORS: Create new one for each voice (need different frequencies)

          // Apply octave offset if specified (multiply frequency by 2^offset)
          // octaveOffset = 1 means one octave up (2x frequency)
          // octaveOffset = -1 means one octave down (0.5x frequency)
          let adjustedFrequency = frequency;
          if (nodeTemplate.data.octaveOffset) {
            adjustedFrequency = frequency * Math.pow(2, nodeTemplate.data.octaveOffset);
          }

          audioNode = new Tone.Oscillator(adjustedFrequency, nodeTemplate.data.waveform || 'sine');

          // Apply detune if specified (in cents, e.g., +10 or -5)
          if (nodeTemplate.data.detune) {
            audioNode.detune.value = nodeTemplate.data.detune;
          }

          // Set custom waveform if provided
          if (nodeTemplate.data.waveformData) {
            setTimeout(() => {
              try {
                const real = new Float32Array(nodeTemplate.data.waveformData.real);
                const imag = new Float32Array(nodeTemplate.data.waveformData.imag);
                const wave = audioNode.context.createPeriodicWave(real, imag);
                if (audioNode._oscillator) {
                  audioNode._oscillator.setPeriodicWave(wave);
                }
              } catch (e) {
                console.warn('Failed to set custom waveform:', e);
              }
            }, 10);
          }

          // Start oscillator with velocity-based volume
          const volume = -20 + (velocity * 10); // -20dB to -10dB based on velocity
          audioNode.volume.value = volume;
          audioNode.start();
          break;

        case 'pulseOscNode':
        case 'sineOscNode':
        case 'squareOscNode':
        case 'sawtoothOscNode':
        case 'triangleOscNode':
          // DEDICATED OSCILLATOR TYPES: Create new one for each voice

          // Determine waveform from node type
          let dedicatedWaveform = 'sine';
          if (nodeTemplate.type === 'squareOscNode') dedicatedWaveform = 'square';
          else if (nodeTemplate.type === 'sawtoothOscNode') dedicatedWaveform = 'sawtooth';
          else if (nodeTemplate.type === 'triangleOscNode') dedicatedWaveform = 'triangle';
          else if (nodeTemplate.type === 'sineOscNode') dedicatedWaveform = 'sine';

          // Apply octave offset if specified
          let dedicatedAdjustedFrequency = frequency;
          if (nodeTemplate.data.octaveOffset) {
            dedicatedAdjustedFrequency = frequency * Math.pow(2, nodeTemplate.data.octaveOffset);
          }

          // Check if unison is enabled (for any oscillator type)
          const unisonVoices = nodeTemplate.data.unisonVoices > 1
            ? nodeTemplate.data.unisonVoices
            : 1;
          const unisonSpread = nodeTemplate.data.unisonSpread || 50; // Cents

          if (unisonVoices > 1) {
            // Create multiple oscillators for unison
            const merger = new Tone.Gain(); // Mix all voices together in mono
            const oscillators = [];

            for (let i = 0; i < unisonVoices; i++) {
              let osc;
              if (nodeTemplate.type === 'pulseOscNode') {
                osc = new Tone.PulseOscillator(
                  dedicatedAdjustedFrequency,
                  nodeTemplate.data.pulseWidth || 0.5
                );
              } else {
                osc = new Tone.Oscillator(dedicatedAdjustedFrequency, dedicatedWaveform);
              }

              // Apply base detune (shifts ALL voices together)
              if (nodeTemplate.data.detune) {
                osc.detune.value = nodeTemplate.data.detune;
              }

              // Apply spread detune (spreads voices around center pitch)
              // Each voice gets detuned by a different amount from center
              if (unisonVoices > 1) {
                const spreadOffset = ((i / (unisonVoices - 1)) - 0.5) * 2 * unisonSpread;
                osc.detune.value += spreadOffset;
              }

              // Calculate volume compensation (more voices = lower volume per voice)
              const volumeCompensation = -3 * Math.log2(unisonVoices);
              const dedicatedVolume = -20 + (velocity * 10) + volumeCompensation;
              osc.volume.value = dedicatedVolume;

              // Connect: oscillator -> merger (all in mono/center)
              osc.connect(merger);

              osc.start();
              oscillators.push({ osc });
            }

            // The merger becomes the audio node that connects to the next stage
            audioNode = merger;
            // Store oscillators for cleanup
            audioNode._unisonOscillators = oscillators;

          } else {
            // Single oscillator (no unison)
            if (nodeTemplate.type === 'pulseOscNode') {
              audioNode = new Tone.PulseOscillator(
                dedicatedAdjustedFrequency,
                nodeTemplate.data.pulseWidth || 0.5
              );
            } else {
              audioNode = new Tone.Oscillator(dedicatedAdjustedFrequency, dedicatedWaveform);
            }

            // Apply detune if specified
            if (nodeTemplate.data.detune) {
              audioNode.detune.value = nodeTemplate.data.detune;
            }

            // Start oscillator with velocity-based volume
            const dedicatedVolume = -20 + (velocity * 10);
            audioNode.volume.value = dedicatedVolume;
            audioNode.start();
          }
          break;

        case 'noiseOscNode':
          // NOISE OSCILLATOR: Create new one for each voice

          // Check if unison is enabled
          const noiseUnisonVoices = nodeTemplate.data.unisonVoices > 1
            ? nodeTemplate.data.unisonVoices
            : 1;

          if (noiseUnisonVoices > 1) {
            // Create multiple noise generators for unison
            const noiseMerger = new Tone.Gain();
            const noiseOscillators = [];

            for (let i = 0; i < noiseUnisonVoices; i++) {
              const noiseOsc = new Tone.Noise('white');

              // Calculate volume compensation
              const volumeCompensation = -3 * Math.log2(noiseUnisonVoices);
              const voiceVolume = -20 + (velocity * 10) + volumeCompensation;
              noiseOsc.volume.value = voiceVolume;

              noiseOsc.connect(noiseMerger);
              noiseOsc.start();
              noiseOscillators.push({ osc: noiseOsc });
            }

            audioNode = noiseMerger;
            audioNode._unisonOscillators = noiseOscillators;

          } else {
            // Single noise generator
            audioNode = new Tone.Noise('white');
            const noiseVolume = -20 + (velocity * 10);
            audioNode.volume.value = noiseVolume;
            audioNode.start();
          }
          break;

        case 'filterNode':
          // FILTERS: Use canvas node (shared across all voices)
          const canvasNodeId = nodeTemplate.canvasNodeId;
          audioNode = audioGraph.getAudioNode(canvasNodeId);

          // If canvas node not found, it might be from a collapsed group
          // In that case, create a new node instance for this voice
          if (!audioNode) {
            console.log(`Canvas node not found: ${canvasNodeId}, creating new instance from template`);

            audioNode = new Tone.Filter(
              nodeTemplate.data.frequency || 1000,
              nodeTemplate.data.type || 'lowpass'
            );

            // Don't mark as canvas node since we created it for this voice
            isCanvasNode = false;
          } else {
            isCanvasNode = true;
          }
          break;

        case 'envelopeNode':
          // ENVELOPE: Create based on modulation target
          const modulationTarget = nodeTemplate.modulationTarget;

          // Convert curve values (-1 to 1) to Tone.js curve types
          const getCurveType = (curveValue) => {
            if (!curveValue || curveValue === 0) return 'linear';
            if (curveValue > 0.5) return 'exponential';
            if (curveValue > 0) return 'sine'; // Smooth exponential
            if (curveValue < -0.5) return 'cosine'; // Sharp logarithmic
            return 'linear'; // Close to 0
          };

          if (modulationTarget === 'volume') {
            // Volume envelope - use AmplitudeEnvelope in signal chain
            console.log('Raw nodeTemplate.data:', nodeTemplate.data);

            const envelopeParams = {
              attack: nodeTemplate.data.attack ?? 0.01,
              attackCurve: getCurveType(nodeTemplate.data.attackCurve),
              decay: nodeTemplate.data.decay ?? 0.1,
              decayCurve: getCurveType(nodeTemplate.data.decayCurve),
              sustain: nodeTemplate.data.sustain ?? 0.7,  // Use ?? instead of || so 0 is valid
              release: nodeTemplate.data.release ?? 1.0,
              releaseCurve: getCurveType(nodeTemplate.data.releaseCurve)
            };

            console.log('Creating AmplitudeEnvelope with params:', envelopeParams);
            audioNode = new Tone.AmplitudeEnvelope(envelopeParams);

            // Check the envelope's current value
            console.log('Envelope created. Current value:', audioNode.value);
            console.log('Envelope ADSR values:', {
              attack: audioNode.attack,
              decay: audioNode.decay,
              sustain: audioNode.sustain,
              release: audioNode.release
            });

            // CRITICAL: Check if sustain is actually a number or a Tone.Signal
            console.log('Sustain type check:', typeof audioNode.sustain, audioNode.sustain);
            if (audioNode.sustain && audioNode.sustain.value !== undefined) {
              console.log('Sustain as Signal.value:', audioNode.sustain.value);
            }

            // Note: Tone.js doesn't support delay/hold in AmplitudeEnvelope
            // We'll handle them manually if needed later

          } else if (modulationTarget === 'filter') {
            // Filter envelope - modulates filter cutoff frequency
            // Use a Gain-like approach: create an Envelope that controls a multiplier
            // The envelope output (0 to 1) will scale the filter's frequency parameter

            audioNode = new Tone.Envelope({
              attack: nodeTemplate.data.attack ?? 0.01,
              attackCurve: getCurveType(nodeTemplate.data.attackCurve),
              decay: nodeTemplate.data.decay ?? 0.1,
              decayCurve: getCurveType(nodeTemplate.data.decayCurve),
              sustain: nodeTemplate.data.sustain ?? 0.7,
              release: nodeTemplate.data.release ?? 1.0,
              releaseCurve: getCurveType(nodeTemplate.data.releaseCurve)
            });

            // Store a reference to indicate this is a filter envelope
            audioNode._isFilterEnvelope = true;

          } else if (modulationTarget === 'pitch') {
            // Pitch envelope - modulates oscillator frequency
            // Use a regular Envelope that outputs 0-1, will be scaled later
            console.log('Creating PITCH envelope with params:', nodeTemplate.data);
            audioNode = new Tone.Envelope({
              attack: nodeTemplate.data.attack ?? 0.01,
              attackCurve: getCurveType(nodeTemplate.data.attackCurve),
              decay: nodeTemplate.data.decay ?? 0.1,
              decayCurve: getCurveType(nodeTemplate.data.decayCurve),
              sustain: nodeTemplate.data.sustain ?? 0.7,
              release: nodeTemplate.data.release ?? 1.0,
              releaseCurve: getCurveType(nodeTemplate.data.releaseCurve)
            });

            // Store a reference to indicate this is a pitch envelope
            audioNode._isPitchEnvelope = true;
            console.log('Created pitch envelope:', audioNode);

          } else {
            console.warn(`Envelope with unknown modulation target: ${modulationTarget}`);
            // Default to amplitude envelope
            audioNode = new Tone.AmplitudeEnvelope({
              attack: nodeTemplate.data.attack ?? 0.01,
              decay: nodeTemplate.data.decay ?? 0.1,
              sustain: nodeTemplate.data.sustain ?? 0.7,
              release: nodeTemplate.data.release ?? 1.0
            });
          }
          break;

        case 'lfoNode':
          // LFO - Create based on modulation target
          const lfoModTarget = nodeTemplate.modulationTarget;
          const lfoWaveform = nodeTemplate.data.waveform || 'sine';
          const lfoFrequency = nodeTemplate.data.frequency || 5;
          const lfoDepth = nodeTemplate.data.depth || 0.5;
          const lfoDelay = nodeTemplate.data.delay || 0;
          const lfoSmoothness = nodeTemplate.data.smoothness || 0.5;

          if (lfoModTarget === 'pitch' || lfoModTarget === 'filter') {
            // Create an LFO for modulation
            if (lfoWaveform === 'random') {
              // Use Tone.Noise with low-pass filter for random LFO
              audioNode = new Tone.Noise('pink');
              audioNode._isLFO = true;
              audioNode._lfoWaveform = lfoWaveform;
              audioNode._lfoFrequency = lfoFrequency;
              audioNode._lfoDepth = lfoDepth;
              audioNode._lfoDelay = lfoDelay;
              audioNode._lfoSmoothness = lfoSmoothness;
              audioNode._lfoModTarget = lfoModTarget;
            } else {
              // Use Tone.LFO for standard waveforms
              audioNode = new Tone.LFO({
                frequency: lfoFrequency,
                type: lfoWaveform,
                min: 0,
                max: 1,
                phase: 0
              });
              audioNode._isLFO = true;
              audioNode._lfoDepth = lfoDepth;
              audioNode._lfoDelay = lfoDelay;
              audioNode._lfoModTarget = lfoModTarget;

              // Start the LFO after delay
              if (lfoDelay > 0) {
                audioNode.start(`+${lfoDelay}`);
              } else {
                audioNode.start();
              }
            }
            console.log(`Created LFO for ${lfoModTarget} modulation:`, audioNode);
          } else {
            console.warn(`LFO with unknown modulation target: ${lfoModTarget}`);
          }
          break;

        case 'chorusNode':
        case 'reverbNode':
        case 'delayNode':
        case 'distortionNode':
        case 'pitchShifterNode':
        case 'phaserNode':
        case 'vibratoNode':
          // EFFECTS: Use canvas node (shared across all voices, like filters)
          const effectCanvasNodeId = nodeTemplate.canvasNodeId;
          audioNode = audioGraph.getAudioNode(effectCanvasNodeId);

          // If canvas node not found, create it and register it
          if (!audioNode) {
            console.log(`Effect canvas node not found: ${effectCanvasNodeId}, creating new instance`);

            switch (nodeTemplate.type) {
              case 'chorusNode':
                audioNode = new Tone.Chorus({
                  frequency: nodeTemplate.data.frequency || 1.5,
                  delayTime: nodeTemplate.data.delayTime || 3.5,
                  depth: nodeTemplate.data.depth || 0.7,
                  wet: nodeTemplate.data.wet || 0.5
                }).start();
                break;

              case 'reverbNode':
                audioNode = new Tone.Reverb({
                  decay: nodeTemplate.data.decay || 1.5,
                  preDelay: nodeTemplate.data.preDelay || 0.01,
                  wet: nodeTemplate.data.wet || 0.3
                });
                break;

              case 'delayNode':
                audioNode = new Tone.FeedbackDelay({
                  delayTime: nodeTemplate.data.delayTime || 0.25,
                  feedback: nodeTemplate.data.feedback || 0.5,
                  wet: nodeTemplate.data.wet || 0.5
                });
                break;

              case 'distortionNode':
                audioNode = new Tone.Distortion({
                  distortion: nodeTemplate.data.distortion || 0.5,
                  oversample: nodeTemplate.data.oversample || 'none',
                  wet: nodeTemplate.data.wet || 1
                });
                break;

              case 'pitchShifterNode':
                audioNode = new Tone.PitchShift({
                  pitch: nodeTemplate.data.pitch || 0,
                  windowSize: nodeTemplate.data.windowSize || 0.1,
                  wet: nodeTemplate.data.wet || 1
                });
                break;

              case 'phaserNode':
                audioNode = new Tone.Phaser({
                  frequency: nodeTemplate.data.frequency || 0.5,
                  octaves: nodeTemplate.data.octaves || 3,
                  baseFrequency: nodeTemplate.data.baseFrequency || 350,
                  wet: nodeTemplate.data.wet || 0.5
                });
                break;

              case 'vibratoNode':
                audioNode = new Tone.Vibrato({
                  frequency: nodeTemplate.data.frequency || 5,
                  depth: nodeTemplate.data.depth || 0.1,
                  wet: nodeTemplate.data.wet || 1
                });
                break;
            }

            // Register the effect as a canvas node so all voices share it
            audioGraph.registerNode(effectCanvasNodeId, audioNode);

            // Connect effect to destination if it's a leaf node (will be determined later)
            // Effects need to be connected to destination when they're the final node in the chain

            isCanvasNode = true;
          } else {
            isCanvasNode = true;
          }
          break;

        default:
          console.warn(`Unknown node type in voice template: ${nodeTemplate.type}`);
      }

      voiceNodes.push({
        type: nodeTemplate.type,
        audioNode,
        data: nodeTemplate.data,
        isCanvasNode, // Track if this is a shared canvas node
        modulationTarget: nodeTemplate.modulationTarget, // For envelopes
        nodeId: nodeTemplate.canvasNodeId // Store canvas node ID for debugging
      });
    });

    // Connect nodes according to template connections
    template.connections.forEach(conn => {
      const sourceNode = voiceNodes[conn.from];
      const targetNode = voiceNodes[conn.to];

      if (sourceNode?.audioNode && targetNode?.audioNode) {
        // Special case: Filter envelope modulation
        if (sourceNode.type === 'envelopeNode' && sourceNode.modulationTarget === 'filter') {
          // Connect envelope to filter's frequency parameter
          // The envelope outputs 0-1, which will modulate the filter cutoff
          if (targetNode.audioNode.frequency) {
            // Create a Scale node to convert envelope (0-1) to frequency range (50 Hz to 10000 Hz)
            const scaler = new Tone.Scale(50, 10000);
            sourceNode.audioNode.connect(scaler);
            scaler.connect(targetNode.audioNode.frequency);

            // Store scaler for cleanup
            sourceNode.audioNode._scaler = scaler;

            console.log('✓ Connected filter envelope to filter frequency (50-10000 Hz)');
          }
        } else if (sourceNode.type === 'envelopeNode' && sourceNode.modulationTarget === 'pitch') {
          // Special case: Pitch envelope modulation
          // Connect envelope to oscillator's frequency parameter
          console.log('Attempting to connect pitch envelope to oscillator');
          console.log('Source envelope:', sourceNode.audioNode);
          console.log('Target oscillator:', targetNode.audioNode);

          if (targetNode.audioNode.frequency) {
            // Get the oscillator's base frequency
            const baseFreq = targetNode.audioNode.frequency.value;
            console.log('Base frequency:', baseFreq);

            // Create a Scale node to convert envelope (0-1) to frequency multiplier
            // 0 = base frequency, 0.5 = base frequency, 1 = 2 octaves up (4x frequency)
            // This means the envelope sweeps from base freq to +2 octaves
            const scaler = new Tone.Scale(baseFreq, baseFreq * 4);
            console.log('Created scaler:', scaler, 'Range:', baseFreq, 'to', baseFreq * 4);

            sourceNode.audioNode.connect(scaler);
            scaler.connect(targetNode.audioNode.frequency);
            console.log('Connected envelope → scaler → oscillator.frequency');

            // Store scaler for cleanup
            sourceNode.audioNode._scaler = scaler;

            console.log(`✓ Connected pitch envelope to oscillator frequency (${baseFreq}Hz to ${baseFreq * 4}Hz)`);
          } else {
            console.warn('Target oscillator has no frequency parameter!');
          }
        } else if (sourceNode.type === 'lfoNode' && sourceNode.modulationTarget === 'filter') {
          // Special case: LFO modulating filter
          if (targetNode.audioNode.frequency) {
            // Create a Scale node to convert LFO (0-1) to frequency range
            // Scale the range based on depth parameter
            const depth = sourceNode.audioNode._lfoDepth || 0.5;
            const minFreq = 50;
            const maxFreq = 50 + (10000 - 50) * depth;

            const scaler = new Tone.Scale(minFreq, maxFreq);
            sourceNode.audioNode.connect(scaler);
            scaler.connect(targetNode.audioNode.frequency);

            // Store scaler for cleanup
            sourceNode.audioNode._scaler = scaler;

            console.log(`✓ Connected LFO to filter frequency (${minFreq}-${maxFreq} Hz, depth: ${depth})`);
          }
        } else if (sourceNode.type === 'lfoNode' && sourceNode.modulationTarget === 'pitch') {
          // Special case: LFO modulating pitch
          if (targetNode.audioNode.frequency) {
            const baseFreq = targetNode.audioNode.frequency.value;
            const depth = sourceNode.audioNode._lfoDepth || 0.5;

            // Scale based on depth - 0 depth = no modulation, 1 depth = ±2 octaves
            const minFreq = baseFreq / Math.pow(2, depth);
            const maxFreq = baseFreq * Math.pow(2, depth);

            const scaler = new Tone.Scale(minFreq, maxFreq);
            sourceNode.audioNode.connect(scaler);
            scaler.connect(targetNode.audioNode.frequency);

            // Store scaler for cleanup
            sourceNode.audioNode._scaler = scaler;

            console.log(`✓ Connected LFO to oscillator pitch (${minFreq.toFixed(2)}-${maxFreq.toFixed(2)} Hz, depth: ${depth})`);
          }
        } else {
          // Normal audio connection
          console.log(`Connecting ${sourceNode.type} → ${targetNode.type}`);
          console.log(`  Source audioNode:`, sourceNode.audioNode);
          console.log(`  Target audioNode:`, targetNode.audioNode);

          sourceNode.audioNode.connect(targetNode.audioNode);
          console.log(`✓ Connected ${sourceNode.type} → ${targetNode.type}${sourceNode.type === 'envelopeNode' ? ' (volume envelope in audio path)' : ''}`);

          // Extra logging for envelope connections
          if (targetNode.type === 'envelopeNode' && targetNode.modulationTarget === 'volume') {
            console.log(`   ⚡ OSCILLATOR CONNECTED TO VOLUME ENVELOPE - audio should pass through envelope!`);
          }
        }
      }
    });

    // Log the complete voice structure before triggering
    console.log('=== COMPLETE VOICE STRUCTURE ===');
    voiceNodes.forEach((node, index) => {
      console.log(`Node ${index}: ${node.type}`);
      if (node.audioNode) {
        console.log(`  Has audioNode:`, node.audioNode.constructor.name);
        if (node.audioNode._out && node.audioNode._out.destination) {
          console.log(`  Connected to:`, node.audioNode._out.destination.constructor.name);
        }
      }
    });
    console.log('================================');

    // Trigger all envelopes
    voiceNodes.forEach(node => {
      if (node.type === 'envelopeNode' && node.audioNode.triggerAttack) {
        console.log(`Triggering envelope attack:`);
        console.log(`  From node.data: A=${node.data.attack}s D=${node.data.decay}s S=${node.data.sustain} R=${node.data.release}s`);
        console.log(`  Actual envelope: A=${node.audioNode.attack} D=${node.audioNode.decay} S=${node.audioNode.sustain} R=${node.audioNode.release}`);
        node.audioNode.triggerAttack();
      }
    });

    // Connect all leaf nodes (nodes with no outgoing connections) to destination
    // This handles parallel oscillators correctly
    const nodeIndicesWithOutgoingConnections = new Set();

    // Mark all node indices that have outgoing audio connections
    template.connections.forEach(conn => {
      nodeIndicesWithOutgoingConnections.add(conn.from);
    });

    console.log('Node indices with outgoing connections:', Array.from(nodeIndicesWithOutgoingConnections));
    console.log('Total voiceNodes:', voiceNodes.length);

    // Connect all leaf nodes to destination
    let leafNodesConnected = 0;
    const connectedCanvasNodes = new Set(); // Track which canvas nodes we've already connected

    voiceNodes.forEach((node, index) => {
      const hasOutgoingConnection = nodeIndicesWithOutgoingConnections.has(index);
      const isModulator = (
        (node.type === 'envelopeNode' && (node.modulationTarget === 'filter' || node.modulationTarget === 'pitch')) ||
        (node.type === 'lfoNode' && (node.modulationTarget === 'filter' || node.modulationTarget === 'pitch'))
      );

      console.log(`Node ${index} (${node.type}): hasOutgoing=${hasOutgoingConnection}, isModulator=${isModulator}, isCanvasNode=${node.isCanvasNode}`);

      if (!hasOutgoingConnection && !isModulator && node.audioNode) {
        // This is a leaf node that produces audio - connect it to destination
        console.log(`⚠️ CONNECTING LEAF NODE TO DESTINATION: ${node.type} (index ${index})`);

        // For canvas nodes (shared effects/filters), only connect once
        if (node.isCanvasNode) {
          if (!connectedCanvasNodes.has(node.nodeId)) {
            node.audioNode.toDestination();
            connectedCanvasNodes.add(node.nodeId);
            console.log(`✓ Connected canvas leaf node ${node.type} (${node.nodeId}) to destination`);
            leafNodesConnected++;
          }
        } else {
          // For voice-specific nodes (oscillators, envelopes), connect each instance
          node.audioNode.toDestination();
          console.log(`✓ Connected voice leaf node ${node.type} (index ${index}) to destination`);
          leafNodesConnected++;
        }
      } else {
        console.log(`  → Skipping node ${index} (${node.type}): hasOutgoing=${hasOutgoingConnection}, isModulator=${isModulator}`);
      }
    });

    console.log(`Total leaf nodes connected to destination: ${leafNodesConnected}`);

    return { nodes: voiceNodes };
  }

  /**
   * Steal (stop) the oldest active voice
   * Used when max voices is reached
   */
  stealOldestVoice() {
    let oldestVoiceId = null;
    let oldestTime = Infinity;

    this.activeVoices.forEach((voice, voiceId) => {
      if (voice.startTime < oldestTime) {
        oldestTime = voice.startTime;
        oldestVoiceId = voiceId;
      }
    });

    if (oldestVoiceId) {
      this.stopVoice(oldestVoiceId);
    }
  }

  /**
   * Stop all active voices
   */
  stopAllVoices() {
    const voiceIds = Array.from(this.activeVoices.keys());
    voiceIds.forEach(voiceId => this.stopVoice(voiceId));
  }

  /**
   * Get number of active voices
   */
  getActiveVoiceCount() {
    return this.activeVoices.size;
  }

  /**
   * Update a parameter on all active voices using a specific template
   * This enables live parameter control during playback
   *
   * @param {string} templateId - Template ID to target
   * @param {string} nodeType - Type of node to update (e.g., 'filterNode')
   * @param {string} paramName - Parameter name (e.g., 'frequency', 'type')
   * @param {*} paramValue - New parameter value
   */
  updateActiveVoiceParameter(templateId, nodeType, paramName, paramValue) {
    let updateCount = 0;

    this.activeVoices.forEach((voice) => {
      // Only update voices using this template
      if (voice.templateId !== templateId) {
        return;
      }

      // Find nodes of the matching type in this voice
      voice.nodes.forEach((node) => {
        if (node.type === nodeType && node.audioNode) {
          // Update the parameter based on node type
          if (nodeType === 'filterNode') {
            if (paramName === 'frequency' && node.audioNode.frequency) {
              node.audioNode.frequency.value = paramValue;
              updateCount++;
            } else if (paramName === 'type') {
              node.audioNode.type = paramValue;
              updateCount++;
            }
          }
          // Add more node types as needed
        }
      });
    });

    if (updateCount > 0) {
      console.log(`Updated ${paramName} to ${paramValue} on ${updateCount} active voice nodes`);
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.stopAllVoices();
    this.voiceTemplates.clear();
  }
}

// Export singleton instance
export const voiceManager = new VoiceManager();
