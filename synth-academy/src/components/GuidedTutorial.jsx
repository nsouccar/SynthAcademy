import React, { useState, useEffect, useMemo } from 'react';
import { soundPresets } from '../soundPresets';

export function GuidedTutorial({ nodes, edges, onClose }) {
    const [selectedSound, setSelectedSound] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Load the poker face bass preset
    useEffect(() => {
        setSelectedSound(soundPresets['poker-face-bass']);
    }, []);

    // Calculate validation state using useMemo to avoid infinite loops
    const validationResult = useMemo(() => {
        if (!selectedSound) return { validationState: {}, allCorrect: false };

        const currentStep = selectedSound.steps[currentStepIndex];
        const newValidation = {};
        let allCorrect = true;

        // Check required nodes
        if (currentStep.requiredNodes) {
            currentStep.requiredNodes.forEach(reqNode => {
                const foundNode = nodes.find(n => n.type === reqNode.type);
                if (foundNode) {
                    newValidation[foundNode.id] = 'correct';
                } else {
                    allCorrect = false;
                }
            });
        }

        // Check required parameters
        if (currentStep.requiredParams) {
            Object.keys(currentStep.requiredParams).forEach(nodeType => {
                const matchingNodes = nodes.filter(n => n.type.includes(nodeType.split('-')[0]));

                matchingNodes.forEach(node => {
                    const requiredParams = currentStep.requiredParams[nodeType];
                    let nodeCorrect = true;

                    Object.keys(requiredParams).forEach(param => {
                        const requiredValue = requiredParams[param];
                        const actualValue = node.data?.[param];
                        const tolerance = selectedSound.tolerance?.[param] || 0;

                        if (actualValue === undefined) {
                            nodeCorrect = false;
                        } else if (Math.abs(actualValue - requiredValue) > tolerance) {
                            nodeCorrect = false;
                        }
                    });

                    newValidation[node.id] = nodeCorrect ? 'correct' : 'incorrect';
                    if (!nodeCorrect) allCorrect = false;
                });
            });
        }

        return { validationState: newValidation, allCorrect };
    }, [nodes, currentStepIndex, selectedSound]);

    if (!selectedSound) {
        return null;
    }

    const currentStep = selectedSound.steps[currentStepIndex];
    const isLastStep = currentStepIndex === selectedSound.steps.length - 1;
    const { validationState: currentValidationState, allCorrect: allStepsCorrect } = validationResult;

    const handleNext = () => {
        if (allStepsCorrect) {
            if (!isLastStep) {
                setCurrentStepIndex(prev => prev + 1);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const getPhaseColor = (phase) => {
        switch (phase) {
            case 'color': return '#4a9eff';
            case 'shape': return '#ff4a9e';
            case 'gradient': return '#4aff4a';
            case 'effects': return '#ffa500';
            case 'routing': return '#9e4aff';
            default: return '#666';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            width: 350,
            background: '#222',
            border: '2px solid #444',
            borderRadius: 8,
            padding: 20,
            color: 'white',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
            {/* Header */}
            <div style={{ marginBottom: 15, borderBottom: '1px solid #444', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#0af' }}>{selectedSound.name}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            fontSize: '1.5em',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
                <div style={{ fontSize: '0.85em', color: '#888', marginTop: 5 }}>
                    {selectedSound.artist}
                </div>
            </div>

            {/* Phase indicator */}
            <div style={{
                background: '#333',
                padding: 8,
                borderRadius: 4,
                marginBottom: 15,
                textAlign: 'center',
                border: `2px solid ${getPhaseColor(currentStep.phase)}`,
            }}>
                <div style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase', marginBottom: 3 }}>
                    Phase: {currentStep.phase}
                </div>
                <div style={{ fontSize: '0.85em', color: getPhaseColor(currentStep.phase), fontWeight: 'bold' }}>
                    {currentStep.phase === 'color' && 'Color - Oscillators & Filters'}
                    {currentStep.phase === 'shape' && 'Shape - Amplitude Envelope'}
                    {currentStep.phase === 'gradient' && 'Gradient - Modulation'}
                    {currentStep.phase === 'effects' && 'Effects - Reverb, Delay, etc.'}
                    {currentStep.phase === 'routing' && 'Routing - Connect Everything'}
                </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 15 }}>
                <div style={{ fontSize: '0.75em', color: '#888', marginBottom: 5 }}>
                    Step {currentStepIndex + 1} of {selectedSound.steps.length}
                </div>
                <div style={{ background: '#333', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                        width: `${((currentStepIndex + 1) / selectedSound.steps.length) * 100}%`,
                        height: '100%',
                        background: getPhaseColor(currentStep.phase),
                        transition: 'width 0.3s',
                    }} />
                </div>
            </div>

            {/* Question */}
            <div style={{
                background: '#2a2a2a',
                padding: 12,
                borderRadius: 6,
                marginBottom: 15,
                border: '1px solid #444',
            }}>
                <div style={{ fontSize: '0.85em', color: '#0af', marginBottom: 8, fontWeight: 'bold' }}>
                    Question:
                </div>
                <div style={{ fontSize: '0.95em', lineHeight: 1.4 }}>
                    {currentStep.question}
                </div>
            </div>

            {/* Instruction */}
            <div style={{
                background: '#1a1a1a',
                padding: 12,
                borderRadius: 6,
                marginBottom: 15,
                border: '1px solid #444',
            }}>
                <div style={{ fontSize: '0.85em', color: '#4aff4a', marginBottom: 8, fontWeight: 'bold' }}>
                    What to do:
                </div>
                <div style={{ fontSize: '0.9em', lineHeight: 1.4 }}>
                    {currentStep.instruction}
                </div>
            </div>

            {/* Validation feedback */}
            {Object.keys(currentValidationState).length > 0 && (
                <div style={{
                    padding: 10,
                    borderRadius: 6,
                    marginBottom: 15,
                    background: allStepsCorrect ? 'rgba(74, 255, 74, 0.1)' : 'rgba(255, 74, 74, 0.1)',
                    border: `1px solid ${allStepsCorrect ? '#4aff4a' : '#ff4a4a'}`,
                }}>
                    <div style={{
                        fontSize: '0.85em',
                        fontWeight: 'bold',
                        color: allStepsCorrect ? '#4aff4a' : '#ff4a4a',
                    }}>
                        {allStepsCorrect ? '✓ Correct! Ready to continue.' : '✗ Not quite right. Keep adjusting!'}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                    style={{
                        flex: 1,
                        padding: '10px 15px',
                        background: currentStepIndex === 0 ? '#333' : '#444',
                        border: '1px solid #666',
                        borderRadius: 4,
                        color: currentStepIndex === 0 ? '#666' : 'white',
                        cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.9em',
                        fontWeight: 'bold',
                    }}
                >
                    ← Previous
                </button>
                <button
                    onClick={handleNext}
                    disabled={!allStepsCorrect}
                    style={{
                        flex: 1,
                        padding: '10px 15px',
                        background: allStepsCorrect ? getPhaseColor(currentStep.phase) : '#333',
                        border: '1px solid #666',
                        borderRadius: 4,
                        color: allStepsCorrect ? 'white' : '#666',
                        cursor: allStepsCorrect ? 'pointer' : 'not-allowed',
                        fontSize: '0.9em',
                        fontWeight: 'bold',
                    }}
                >
                    {isLastStep ? 'Finish ✓' : 'Next →'}
                </button>
            </div>

            {/* Hint */}
            <div style={{
                marginTop: 15,
                fontSize: '0.75em',
                color: '#666',
                textAlign: 'center',
                fontStyle: 'italic',
            }}>
                {currentStep.highlightToolbar && 'Look for highlighted buttons in the toolbar'}
                {currentStep.highlightNodes && 'Adjust the highlighted parameters on the node'}
            </div>
        </div>
    );
}
