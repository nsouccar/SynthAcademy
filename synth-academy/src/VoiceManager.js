import * as Tone from 'tone';

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

    // Cleanup all nodes in this voice
    voice.nodes.forEach(node => {
      if (node.audioNode) {
        // Disconnect
        node.audioNode.disconnect();

        // Stop if it's a source
        if (node.audioNode.stop) {
          node.audioNode.stop();
        }

        // Dispose
        if (node.audioNode.dispose) {
          node.audioNode.dispose();
        }
      }
    });

    // Remove from active voices
    this.activeVoices.delete(voiceId);
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
    template.nodes.forEach((nodeTemplate, index) => {
      let audioNode = null;

      switch (nodeTemplate.type) {
        case 'oscNode':
          // Create oscillator
          audioNode = new Tone.Oscillator(frequency, nodeTemplate.data.waveform || 'sine');

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
          // Create filter
          audioNode = new Tone.Filter(
            nodeTemplate.data.frequency || 1000,
            nodeTemplate.data.type || 'lowpass'
          );
          break;

        case 'mixerNode':
          // Create channel (mixer)
          audioNode = new Tone.Channel({
            volume: nodeTemplate.data.volume || 0,
          });
          break;

        default:
          console.warn(`Unknown node type in voice template: ${nodeTemplate.type}`);
      }

      voiceNodes.push({
        type: nodeTemplate.type,
        audioNode,
        data: nodeTemplate.data,
      });
    });

    // Connect nodes according to template connections
    template.connections.forEach(conn => {
      const sourceNode = voiceNodes[conn.from];
      const targetNode = voiceNodes[conn.to];

      if (sourceNode?.audioNode && targetNode?.audioNode) {
        sourceNode.audioNode.connect(targetNode.audioNode);
      }
    });

    // Connect last node to destination
    if (voiceNodes.length > 0) {
      const lastNode = voiceNodes[voiceNodes.length - 1];
      if (lastNode?.audioNode) {
        lastNode.audioNode.toDestination();
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
   * Cleanup all resources
   */
  cleanup() {
    this.stopAllVoices();
    this.voiceTemplates.clear();
  }
}

// Export singleton instance
export const voiceManager = new VoiceManager();
