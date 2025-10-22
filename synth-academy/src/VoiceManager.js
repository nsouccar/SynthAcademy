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
            audioNode = new Tone.AmplitudeEnvelope({
              attack: nodeTemplate.data.attack || 0.01,
              attackCurve: getCurveType(nodeTemplate.data.attackCurve),
              decay: nodeTemplate.data.decay || 0.1,
              decayCurve: getCurveType(nodeTemplate.data.decayCurve),
              sustain: nodeTemplate.data.sustain || 0.7,
              release: nodeTemplate.data.release || 1.0,
              releaseCurve: getCurveType(nodeTemplate.data.releaseCurve)
            });

            // Note: Tone.js doesn't support delay/hold in AmplitudeEnvelope
            // We'll handle them manually if needed later

          } else if (modulationTarget === 'filter') {
            // Filter envelope - modulates filter cutoff frequency
            // Use a Gain-like approach: create an Envelope that controls a multiplier
            // The envelope output (0 to 1) will scale the filter's frequency parameter

            audioNode = new Tone.Envelope({
              attack: nodeTemplate.data.attack || 0.01,
              attackCurve: getCurveType(nodeTemplate.data.attackCurve),
              decay: nodeTemplate.data.decay || 0.1,
              decayCurve: getCurveType(nodeTemplate.data.decayCurve),
              sustain: nodeTemplate.data.sustain || 0.7,
              release: nodeTemplate.data.release || 1.0,
              releaseCurve: getCurveType(nodeTemplate.data.releaseCurve)
            });

            // Store a reference to indicate this is a filter envelope
            audioNode._isFilterEnvelope = true;

          } else if (modulationTarget === 'pitch') {
            // Pitch envelope - modulates oscillator frequency
            // Use a regular Envelope that outputs 0-1, will be scaled later
            console.log('Creating PITCH envelope with params:', nodeTemplate.data);
            audioNode = new Tone.Envelope({
              attack: nodeTemplate.data.attack || 0.01,
              attackCurve: getCurveType(nodeTemplate.data.attackCurve),
              decay: nodeTemplate.data.decay || 0.1,
              decayCurve: getCurveType(nodeTemplate.data.decayCurve),
              sustain: nodeTemplate.data.sustain || 0.7,
              release: nodeTemplate.data.release || 1.0,
              releaseCurve: getCurveType(nodeTemplate.data.releaseCurve)
            });

            // Store a reference to indicate this is a pitch envelope
            audioNode._isPitchEnvelope = true;
            console.log('Created pitch envelope:', audioNode);

          } else {
            console.warn(`Envelope with unknown modulation target: ${modulationTarget}`);
            // Default to amplitude envelope
            audioNode = new Tone.AmplitudeEnvelope({
              attack: nodeTemplate.data.attack || 0.01,
              decay: nodeTemplate.data.decay || 0.1,
              sustain: nodeTemplate.data.sustain || 0.7,
              release: nodeTemplate.data.release || 1.0
            });
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
        modulationTarget: nodeTemplate.modulationTarget // For envelopes
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
        } else {
          // Normal audio connection
          sourceNode.audioNode.connect(targetNode.audioNode);
          console.log(`✓ Connected ${sourceNode.type} → ${targetNode.type}${sourceNode.type === 'envelopeNode' ? ' (volume envelope in audio path)' : ''}`);
        }
      }
    });

    // Trigger all envelopes
    voiceNodes.forEach(node => {
      if (node.type === 'envelopeNode' && node.audioNode.triggerAttack) {
        node.audioNode.triggerAttack();
      }
    });

    // Connect last node to destination
    if (voiceNodes.length > 0) {
      const lastNode = voiceNodes[voiceNodes.length - 1];
      if (lastNode?.audioNode) {
        // Special case: Filter envelopes are modulators, don't connect to destination
        // But volume envelopes ARE in the signal path, so they should connect
        if (lastNode.type === 'envelopeNode' && lastNode.modulationTarget === 'filter') {
          // Filter envelope is a modulator, don't connect to destination
          console.log('Filter envelope is a modulator, not connecting to destination');
        } else {
          // All other nodes (including volume envelopes) connect to destination
          lastNode.audioNode.toDestination();
          console.log(`Connected final ${lastNode.type} to destination`);
        }
      }
    }

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
