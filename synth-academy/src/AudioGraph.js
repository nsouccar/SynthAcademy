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
  }

  /**
   * Register a new audio node
   * @param {string} nodeId - ReactFlow node ID
   * @param {object} audioNode - Tone.js audio object (Oscillator, Filter, etc.)
   */
  registerNode(nodeId, audioNode) {
    this.audioNodes.set(nodeId, audioNode);
    this.connections.set(nodeId, new Set());
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

    // Remove any connections pointing to this node
    this.connections.forEach((targetSet) => {
      targetSet.delete(nodeId);
    });
  }

  /**
   * Connect two audio nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   */
  connect(sourceId, targetId) {
    const source = this.audioNodes.get(sourceId);
    const target = this.audioNodes.get(targetId);

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

    console.log(`Connected ${sourceId} -> ${targetId}`);
  }

  /**
   * Disconnect two audio nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID (optional, disconnects all if not provided)
   */
  disconnect(sourceId, targetId = null) {
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
        console.log(`Disconnected ${sourceId} -> ${targetId}`);
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
