import * as Tone from 'tone';

// We'll set this reference after VoiceManager is imported
let voiceManagerInstance = null;

export function setVoiceManager(vm) {
  voiceManagerInstance = vm;
}

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

    console.log(`Audio connection: ${sourceId} -> ${targetId}`);
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
   * Scan the canvas for voice templates and register them with VoiceManager
   * This is called whenever the canvas changes
   *
   * @param {Array} nodes - ReactFlow nodes array
   * @param {Array} edges - ReactFlow edges array
   */
  scanForVoiceTemplates(nodes, edges) {
    // Safety check
    if (!nodes || !edges) {
      return;
    }

    // Check if voiceManager is available
    if (!voiceManagerInstance) {
      console.warn('VoiceManager not initialized yet');
      return;
    }

    // Find all OutputNodes
    const outputNodes = nodes.filter(node => node.type === 'outputNode');

    console.log(`Found ${outputNodes.length} output nodes`);

    // Track which outputs have valid templates
    const validOutputIds = [];

    // For each OutputNode, trace back to build a voice template
    outputNodes.forEach(outputNode => {
      const template = this.buildVoiceTemplateFromOutput(outputNode.id, nodes, edges);

      if (template && template.nodes.length > 0) {
        console.log(`Registering voice template for output ${outputNode.id}:`, template);
        console.log('Template details:', {
          nodeCount: template.nodes.length,
          nodeTypes: template.nodes.map(n => n.type),
          connectionCount: template.connections.length,
          connections: template.connections
        });

        // Log envelope node data specifically
        const envelopeNodes = template.nodes.filter(n => n.type === 'envelopeNode');
        envelopeNodes.forEach(envNode => {
          console.log(`Envelope node in template:`, {
            id: envNode.canvasNodeId,
            attack: envNode.data.attack,
            decay: envNode.data.decay,
            sustain: envNode.data.sustain,
            release: envNode.data.release
          });
        });

        // Stop any active voices using the old template before updating
        voiceManagerInstance.stopVoicesForTemplate(outputNode.id);

        voiceManagerInstance.registerVoiceTemplate(outputNode.id, template);

        // Track this as a valid output
        validOutputIds.push(outputNode.id);
      } else {
        // Template is empty (broken chain) - unregister to prevent stale playback
        console.log(`Unregistering voice template for output ${outputNode.id} (empty chain)`);
        voiceManagerInstance.unregisterVoiceTemplate(outputNode.id);
      }
    });

    // Store the first VALID output node ID for piano to use
    if (validOutputIds.length > 0) {
      this.primaryVoiceTemplateId = validOutputIds[0];
    } else {
      this.primaryVoiceTemplateId = null;
    }
  }

  /**
   * Build a voice template by tracing backwards from an OutputNode
   *
   * @param {string} outputNodeId - The OutputNode to trace from
   * @param {Array} nodes - ReactFlow nodes
   * @param {Array} edges - ReactFlow edges
   * @returns {object} Voice template { nodes: [...], connections: [...] }
   */
  buildVoiceTemplateFromOutput(outputNodeId, nodes, edges) {
    const chainNodeIds = [];
    const chainEdges = [];
    const expandedNodes = []; // Track expanded group nodes
    const groupIdToNodeIds = new Map(); // Map group ID to its internal node IDs

    // Trace backwards from output
    const visited = new Set();
    const queue = [outputNodeId];

    while (queue.length > 0) {
      const currentNodeId = queue.shift();

      if (visited.has(currentNodeId)) continue;
      visited.add(currentNodeId);

      // Don't include OutputNode itself in template (it's just a marker)
      const currentNode = nodes.find(n => n.id === currentNodeId);

      // If this is a GroupNode, expand it
      if (currentNode && currentNode.type === 'groupNode') {
        const collapsedNodes = currentNode.data.collapsedNodes || [];
        const collapsedEdges = currentNode.data.collapsedEdges || [];

        // Add all collapsed nodes to the chain
        collapsedNodes.forEach(node => {
          chainNodeIds.push(node.id);
          expandedNodes.push(node);
          groupIdToNodeIds.set(currentNodeId, collapsedNodes.map(n => n.id));
        });

        // Add internal edges
        chainEdges.push(...collapsedEdges);

        // Find input nodes of the group and continue tracing from them
        const inputNodeIds = currentNode.data.inputNodeIds || [];
        inputNodeIds.forEach(inputId => {
          // Find edges that connect TO this input node (from outside the group)
          const incomingEdges = edges.filter(e => e.target === currentNodeId);
          incomingEdges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.type !== 'pianoNode') {
              // Create virtual edge from external source to internal input node
              chainEdges.push({
                source: edge.source,
                target: inputId
              });
              queue.push(edge.source);
            }
          });
        });
      } else if (currentNode && currentNode.type !== 'outputNode') {
        chainNodeIds.push(currentNodeId);
      }

      // Find edges that connect TO this node
      const incomingEdges = edges.filter(e => e.target === currentNodeId);

      incomingEdges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);

        // Skip piano nodes (they're controllers, not part of the voice)
        // Skip modulation connections (they're not part of the main audio chain)
        const isModulationConnection = edge.targetHandle === 'modulation-in';

        if (sourceNode && sourceNode.type !== 'pianoNode') {
          // Add all edges (audio and modulation)
          chainEdges.push(edge);

          if (!isModulationConnection) {
            // For audio connections, continue traversing backwards
            queue.push(edge.source);
          } else {
            // For modulation connections, we still need to include the modulator node
            // but we don't traverse further back from it (it's a leaf in the audio graph)
            if (!visited.has(edge.source)) {
              chainNodeIds.push(edge.source);
              visited.add(edge.source);
            }
          }
        }
      });
    }

    // We have all nodes in the chain - order doesn't matter because
    // VoiceManager uses two-pass processing: create all nodes first, then connect them

    // Convert to template format
    const template = {
      nodes: chainNodeIds.map(nodeId => {
        // Check if this node came from an expanded group
        const expandedNode = expandedNodes.find(n => n.id === nodeId);
        const node = expandedNode || nodes.find(n => n.id === nodeId);

        // For envelope and LFO nodes, detect what they're connected to
        let modulationTarget = null;
        if (node.type === 'envelopeNode') {
          // First, check if audio is flowing INTO the envelope (incoming connection)
          const incomingEdge = chainEdges.find(e => e.target === nodeId);
          let hasIncomingAudio = false;

          if (incomingEdge) {
            const sourceNode = nodes.find(n => n.id === incomingEdge.source) ||
                              expandedNodes.find(n => n.id === incomingEdge.source);
            // Audio sources: oscillators, filters, or other envelopes (in audio path)
            if (sourceNode && (
              sourceNode.type === 'oscNode' ||
              sourceNode.type === 'pulseOscNode' ||
              sourceNode.type === 'sineOscNode' ||
              sourceNode.type === 'squareOscNode' ||
              sourceNode.type === 'sawtoothOscNode' ||
              sourceNode.type === 'triangleOscNode' ||
              sourceNode.type === 'noiseOscNode' ||
              sourceNode.type === 'filterNode' ||
              sourceNode.type === 'envelopeNode'
            )) {
              hasIncomingAudio = true;
            }
          }

          if (hasIncomingAudio) {
            // Audio is flowing through this envelope = VOLUME envelope (in audio path)
            modulationTarget = 'volume';
            console.log(`Envelope ${nodeId}: VOLUME envelope (audio flowing through)`);
          } else {
            // No incoming audio, check what it connects TO
            const outgoingEdge = chainEdges.find(e => e.source === nodeId);
            if (outgoingEdge) {
              const targetNode = nodes.find(n => n.id === outgoingEdge.target) ||
                                expandedNodes.find(n => n.id === outgoingEdge.target);

              // Check which handle the envelope is connected to
              const targetHandle = outgoingEdge.targetHandle;

              if (targetNode) {
                if (targetNode.type === 'filterNode' && targetHandle === 'modulation-in') {
                  // Envelope connected to filter's modulation input = FILTER modulation
                  modulationTarget = 'filter';
                  console.log(`Envelope ${nodeId}: FILTER modulation (connected to modulation input)`);
                } else if ((targetNode.type === 'oscNode' || targetNode.type === 'pulseOscNode' || targetNode.type === 'sineOscNode' || targetNode.type === 'squareOscNode' || targetNode.type === 'sawtoothOscNode' || targetNode.type === 'triangleOscNode' || targetNode.type === 'noiseOscNode') && targetHandle === 'modulation-in') {
                  // Envelope connected to oscillator's modulation input = PITCH modulation
                  modulationTarget = 'pitch';
                  console.log(`Envelope ${nodeId}: PITCH modulation (connected to modulation input)`);
                } else if (targetNode.type === 'filterNode') {
                  // Envelope with no specific handle connecting to filter = assume FILTER modulation
                  modulationTarget = 'filter';
                  console.log(`Envelope ${nodeId}: FILTER modulation (no audio input)`);
                } else if (targetNode.type === 'oscNode' || targetNode.type === 'pulseOscNode' || targetNode.type === 'sineOscNode' || targetNode.type === 'squareOscNode' || targetNode.type === 'sawtoothOscNode' || targetNode.type === 'triangleOscNode' || targetNode.type === 'noiseOscNode') {
                  // Envelope with no specific handle connecting to oscillator = assume PITCH modulation
                  modulationTarget = 'pitch';
                  console.log(`Envelope ${nodeId}: PITCH modulation (no audio input)`);
                }
              }
            }
          }
        } else if (node.type === 'lfoNode') {
          // LFO nodes are always modulators - detect what they're connected to
          const outgoingEdge = chainEdges.find(e => e.source === nodeId);
          if (outgoingEdge) {
            const targetNode = nodes.find(n => n.id === outgoingEdge.target) ||
                              expandedNodes.find(n => n.id === outgoingEdge.target);
            const targetHandle = outgoingEdge.targetHandle;

            if (targetNode) {
              if (targetNode.type === 'filterNode' && targetHandle === 'modulation-in') {
                modulationTarget = 'filter';
                console.log(`LFO ${nodeId}: FILTER modulation`);
              } else if ((targetNode.type === 'oscNode' || targetNode.type === 'pulseOscNode' || targetNode.type === 'sineOscNode' || targetNode.type === 'squareOscNode' || targetNode.type === 'sawtoothOscNode' || targetNode.type === 'triangleOscNode' || targetNode.type === 'noiseOscNode') && targetHandle === 'modulation-in') {
                modulationTarget = 'pitch';
                console.log(`LFO ${nodeId}: PITCH modulation`);
              } else if (targetNode.type === 'filterNode') {
                modulationTarget = 'filter';
              } else if (targetNode.type === 'oscNode' || targetNode.type === 'pulseOscNode' || targetNode.type === 'sineOscNode' || targetNode.type === 'squareOscNode' || targetNode.type === 'sawtoothOscNode' || targetNode.type === 'triangleOscNode' || targetNode.type === 'noiseOscNode') {
                modulationTarget = 'pitch';
              }
            }
          }
        }

        return {
          type: node.type,
          data: node.data || {},
          canvasNodeId: nodeId,  // Store the canvas node ID for voice routing
          modulationTarget: modulationTarget  // For envelopes and LFOs: what they modulate
        };
      }),
      connections: []
    };

    // Build connections array with indices instead of IDs
    chainEdges.forEach(edge => {
      const sourceIndex = chainNodeIds.indexOf(edge.source);
      const targetIndex = chainNodeIds.indexOf(edge.target);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        template.connections.push({
          from: sourceIndex,
          to: targetIndex
        });
      }
    });

    return template;
  }

  /**
   * Get the primary voice template ID for piano to use
   */
  getPrimaryVoiceTemplateId() {
    return this.primaryVoiceTemplateId;
  }

  /**
   * Notify that a node parameter has changed
   * This updates both the template and active voices
   *
   * @param {string} nodeId - Node ID that changed
   * @param {string} nodeType - Type of node (e.g., 'filterNode')
   * @param {string} paramName - Parameter name (e.g., 'frequency')
   * @param {*} paramValue - New parameter value
   */
  notifyParameterChange(nodeId, nodeType, paramName, paramValue) {
    // Find which template(s) this node belongs to
    if (!voiceManagerInstance) {
      return;
    }

    // Update all templates that contain this node
    // For now, update all templates (simple approach)
    // In a more complex system, you'd track which nodes belong to which templates
    const templateId = this.primaryVoiceTemplateId;

    if (templateId) {
      voiceManagerInstance.updateActiveVoiceParameter(
        templateId,
        nodeType,
        paramName,
        paramValue
      );
    }
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
