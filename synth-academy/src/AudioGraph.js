import * as Tone from 'tone';

/**
 * AudioGraph manages the audio routing between nodes
 * It keeps track of all audio nodes and their connections
 */
class AudioGraph {
  constructor() {
    // Map of node IDs to their Tone.js audio objects
    this.audioNodes = new Map();

    // Map of node IDs to their output connections (for tracking)
    this.connections = new Map();

    // Map of node IDs to their node type and metadata
    this.nodeMetadata = new Map();

    // Map of controller IDs to arrays of controlled node IDs
    this.controlConnections = new Map();
  }

  /**
   * Register a new audio node
   * @param {string} nodeId - ReactFlow node ID
   * @param {object} audioNode - Tone.js audio object (Oscillator, Filter, etc.)
   * @param {object} metadata - Node metadata (type, isController, etc.)
   */
  registerNode(nodeId, audioNode, metadata = {}) {
    this.audioNodes.set(nodeId, audioNode);
    this.connections.set(nodeId, new Set());
    this.nodeMetadata.set(nodeId, metadata);

    if (metadata.isController) {
      this.controlConnections.set(nodeId, []);
    }
  }

  /**
   * Unregister and cleanup an audio node
   * @param {string} nodeId - ReactFlow node ID
   */
  unregisterNode(nodeId) {
    const audioNode = this.audioNodes.get(nodeId);

    if (audioNode) {
      // Disconnect from everything
      audioNode.disconnect();

      // If it's a source (like Oscillator), stop it
      if (audioNode.stop) {
        audioNode.stop();
      }

      // Dispose of the audio node
      if (audioNode.dispose) {
        audioNode.dispose();
      }
    }

    // Remove from tracking
    this.audioNodes.delete(nodeId);
    this.connections.delete(nodeId);
    this.nodeMetadata.delete(nodeId);
    this.controlConnections.delete(nodeId);

    // Remove any connections pointing to this node
    this.connections.forEach((targetSet) => {
      targetSet.delete(nodeId);
    });

    // Remove any control connections pointing to this node
    this.controlConnections.forEach((targets) => {
      const index = targets.indexOf(nodeId);
      if (index > -1) {
        targets.splice(index, 1);
      }
    });
  }

  /**
   * Connect two nodes (audio or control)
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   */
  connect(sourceId, targetId) {
    const sourceMetadata = this.nodeMetadata.get(sourceId);
    const source = this.audioNodes.get(sourceId);
    const target = this.audioNodes.get(targetId);

    // Handle control connections (e.g., Piano -> Oscillator)
    if (sourceMetadata?.isController) {
      if (!this.controlConnections.has(sourceId)) {
        this.controlConnections.set(sourceId, []);
      }
      this.controlConnections.get(sourceId).push(targetId);
      console.log(`Control connection: ${sourceId} -> ${targetId}`);
      return;
    }

    // Handle audio connections
    if (!source || !target) {
      console.warn(`Cannot connect: source=${!!source}, target=${!!target}`);
      return;
    }

    // Disconnect from destination if this is the first connection
    if (this.connections.get(sourceId).size === 0) {
      try {
        source.disconnect();
      } catch (e) {
        // Ignore if already disconnected
      }
    }

    // Connect source to target
    source.connect(target);

    // Track the connection
    this.connections.get(sourceId).add(targetId);

    console.log(`Audio connection: ${sourceId} -> ${targetId}`);
  }

  /**
   * Disconnect two nodes (audio or control)
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID (optional, disconnects all if not provided)
   */
  disconnect(sourceId, targetId = null) {
    const sourceMetadata = this.nodeMetadata.get(sourceId);

    // Handle control disconnections
    if (sourceMetadata?.isController) {
      if (targetId) {
        const controlTargets = this.controlConnections.get(sourceId) || [];
        const index = controlTargets.indexOf(targetId);
        if (index > -1) {
          controlTargets.splice(index, 1);
          console.log(`Control disconnection: ${sourceId} -> ${targetId}`);
        }
      } else {
        this.controlConnections.set(sourceId, []);
        console.log(`${sourceId} disconnected from all controlled nodes`);
      }
      return;
    }

    // Handle audio disconnections
    const source = this.audioNodes.get(sourceId);

    if (!source) {
      console.warn(`Cannot disconnect: source node ${sourceId} not found`);
      return;
    }

    if (targetId) {
      const target = this.audioNodes.get(targetId);

      if (target) {
        source.disconnect(target);
        this.connections.get(sourceId).delete(targetId);
        console.log(`Audio disconnection: ${sourceId} -> ${targetId}`);
      }

      // If no more connections, connect back to destination
      if (this.connections.get(sourceId).size === 0) {
        source.toDestination();
        console.log(`${sourceId} reconnected to destination (no outputs)`);
      }
    } else {
      // Disconnect all
      source.disconnect();
      this.connections.get(sourceId).clear();
      source.toDestination();
      console.log(`${sourceId} disconnected from all and reconnected to destination`);
    }
  }

  /**
   * Get the audio node for a given ID
   * @param {string} nodeId - ReactFlow node ID
   * @returns {object|null} - Tone.js audio object
   */
  getAudioNode(nodeId) {
    return this.audioNodes.get(nodeId) || null;
  }

  /**
   * Get controlled nodes for a controller
   * @param {string} controllerId - Controller node ID
   * @returns {Array} - Array of controlled node IDs
   */
  getControlledNodes(controllerId) {
    return this.controlConnections.get(controllerId) || [];
  }

  /**
   * Trigger note on controlled oscillators
   * @param {string} controllerId - Controller node ID
   * @param {number} frequency - Frequency to trigger
   */
  triggerControlledNodes(controllerId, frequency) {
    const controlledNodes = this.getControlledNodes(controllerId);

    controlledNodes.forEach(nodeId => {
      const audioNode = this.audioNodes.get(nodeId);
      if (audioNode && audioNode.frequency) {
        // Set frequency for oscillators
        audioNode.frequency.setValueAtTime(frequency, audioNode.context.currentTime);

        // Unmute the oscillator
        if (audioNode.volume) {
          audioNode.volume.rampTo(-10, 0.02);
        }
      }
    });
  }

  /**
   * Release note on controlled oscillators
   * @param {string} controllerId - Controller node ID
   */
  releaseControlledNodes(controllerId) {
    const controlledNodes = this.getControlledNodes(controllerId);

    controlledNodes.forEach(nodeId => {
      const audioNode = this.audioNodes.get(nodeId);
      if (audioNode && audioNode.volume) {
        // Mute the oscillator completely
        audioNode.volume.rampTo(-Infinity, 0.2);
      }
    });
  }

  /**
   * Sync connections based on ReactFlow edges
   * @param {Array} edges - ReactFlow edges array
   */
  syncConnections(edges) {
    // Build a set of current edge connections
    const currentEdges = new Set(
      edges.map(edge => `${edge.source}->${edge.target}`)
    );

    // Build a set of audio graph connections
    const audioConnections = new Set();
    this.connections.forEach((targets, sourceId) => {
      targets.forEach(targetId => {
        audioConnections.add(`${sourceId}->${targetId}`);
      });
    });

    // Find edges to add
    currentEdges.forEach(edgeKey => {
      if (!audioConnections.has(edgeKey)) {
        const [source, target] = edgeKey.split('->');
        this.connect(source, target);
      }
    });

    // Find edges to remove
    audioConnections.forEach(edgeKey => {
      if (!currentEdges.has(edgeKey)) {
        const [source, target] = edgeKey.split('->');
        this.disconnect(source, target);
      }
    });
  }

  /**
   * Cleanup all audio nodes
   */
  cleanup() {
    this.audioNodes.forEach((audioNode, nodeId) => {
      this.unregisterNode(nodeId);
    });
  }
}

// Export a singleton instance
export const audioGraph = new AudioGraph();
