# Synth Academy - Deep Dive Study Plan

A structured plan to re-familiarize yourself with the codebase before your Suno interview.

---

## Phase 1: Core Mental Model (45 min)

Start here to rebuild your high-level understanding.

### 1.1 The Two Core Classes

Your synth has two brains. Understand their responsibilities first:

| Class | File | Responsibility |
|-------|------|----------------|
| `AudioGraph` | `src/AudioGraph.js` | Manages connections between nodes, syncs canvas to audio routing |
| `VoiceManager` | `src/VoiceManager.js` | Creates/destroys voice instances, handles polyphony, note on/off |

**Study task:** Read the class-level comments and constructor of each. Draw a diagram showing how they interact.

### 1.2 The Signal Flow

```
[Piano/Sequencer]
       ↓ (noteOn with frequency)
[VoiceManager] → creates voice instance from template
       ↓
[Oscillator(s)] → [Filter] → [Envelope] → [Effects] → [Output]
       ↓                         ↑
    [LFO] ──── modulation ───────┘
```

**Key insight:** Oscillators are created per-voice. Effects are shared (canvas nodes).

---

## Phase 2: Audio Graph Deep Dive (1 hour)

### 2.1 Node Registration

**File:** `src/AudioGraph.js`

**Read these methods:**
- `registerNode()` - How nodes get added to the graph
- `connect()` / `disconnect()` - Audio routing
- `syncConnections()` - Keeps canvas edges in sync with audio connections

**Question to answer:** What's stored in `audioNodes` Map vs `connections` Map vs `nodeMetadata` Map?

### 2.2 Template Detection Algorithm

**File:** `src/AudioGraph.js` - `buildVoiceTemplateFromOutput()`

This is your most sophisticated algorithm. Study it carefully:

1. Starts at OutputNode, traverses backward
2. Uses BFS to find all connected nodes
3. Topological sort to order them source→destination
4. Detects modulation targets based on connection handles

**Question to answer:** How does it know if an envelope should modulate volume vs filter vs pitch?

**Tradeoff to articulate:** Why dynamic detection instead of explicit user configuration?

### 2.3 Canvas Nodes vs Voice Nodes

**Key distinction:**
- **Voice nodes** (oscillators, envelopes): Created fresh for each note
- **Canvas nodes** (filters, effects): Shared across all voices

**Find in code:** Look for `isCanvasNode` or similar logic in template building.

**Tradeoff to articulate:** CPU efficiency vs per-voice flexibility

---

## Phase 3: Voice Manager Deep Dive (1 hour)

### 3.1 Voice Lifecycle

**File:** `src/VoiceManager.js`

**Trace through:**
1. `startVoice(templateId, frequency, velocity)` - What gets created?
2. `stopVoice(voiceId)` - What's the cleanup sequence?

**Critical timing code:** Look at how release time is calculated and why there's a cleanup delay.

### 3.2 Polyphony & Voice Stealing

**Find answers to:**
- What's `maxVoices` set to? (8)
- What happens when you exceed it? (LRU voice stealing)
- How are active voices tracked?

**Question to answer:** Why 8 voices? What would break at 16? 32?

### 3.3 Unison Implementation

**Find the unison code** - multiple oscillators per voice with detune spread.

**Understand:**
- How detune is distributed across unison voices
- Volume compensation formula: `-3dB * log2(voices)`
- Why compensation matters (prevents clipping)

---

## Phase 4: Envelope System (45 min)

### 4.1 DAHDSR Stages

**File:** `src/components/EnvelopeNode.jsx`

**The 6 stages:**
- **D**elay - Wait before starting
- **A**ttack - Rise to peak
- **H**old - Stay at peak
- **D**ecay - Fall to sustain
- **S**ustain - Level while held
- **R**elease - Fade after note-off

**Study:** How curve parameters (-1 to +1) map to Tone.js curve types.

### 4.2 Modulation Routing

**Three modes:**
1. Volume envelope (amplitude modulation)
2. Filter modulation (cutoff frequency)
3. Pitch modulation (oscillator frequency)

**Find in code:** How does AudioGraph detect which mode to use?

**Key insight:** It's based on what the envelope connects TO, not a user setting.

---

## Phase 5: Effects Chain (30 min)

### 5.1 Available Effects

Skim each effect node in `src/components/`:
- `ReverbNode.jsx` - Note the async `.ready` promise
- `DelayNode.jsx` - Feedback loop
- `DistortionNode.jsx` - Oversample parameter
- `ChorusNode.jsx`, `PhaserNode.jsx`, `VibratoNode.jsx`
- `PitchShiftNode.jsx` - FFT window size tradeoff

### 5.2 Wet/Dry Architecture

**Question to answer:** How is wet/dry mix handled? Is it per-effect or global?

---

## Phase 6: Timing & Scheduling (45 min)

### 6.1 Why Not setInterval?

**Prepare to explain:**
- JavaScript timing is imprecise (event loop delays)
- Audio needs sample-accurate scheduling
- `Tone.now()` uses AudioContext time, not wall clock
- `Tone.Transport` for sequencer timing

### 6.2 Sequencer Implementation

**File:** `src/components/PianoRollNode.jsx`

**Study:**
- How notes are snapped to grid (beat divisions)
- How `Tone.Part` schedules note events
- Loop handling

### 6.3 Voice Cleanup Timing

**Critical section in VoiceManager:**
```javascript
// Why wait maxReleaseTime + 100ms before cleanup?
// What would happen if we cleaned up immediately?
```

**Bug potential:** This is where click/pop bugs live. The 100ms buffer suggests real debugging happened here.

---

## Phase 7: Performance Considerations (30 min)

### 7.1 What You Optimized For

- **Canvas node sharing** - Effects not duplicated per voice
- **Volume ramping** - 20ms ramps prevent clicks
- **Voice limit** - 8 voices prevents CPU overload
- **Lazy cleanup** - Disposal happens after audio fades

### 7.2 Known Bottlenecks

- Template rebuild on every canvas change
- PianoRoll canvas rendering
- Unison with 8 voices = 8 oscillators per note

### 7.3 Latency Sources

- Reverb convolution (async initialization)
- PitchShift FFT window size
- Browser audio buffer (not configurable via Tone.js)

---

## Phase 8: Tradeoffs to Articulate (30 min)

Prepare clear answers for these:

### Tone.js vs Raw Web Audio

**Chose Tone.js because:**
- Higher-level abstractions (Envelope, Transport, Effects)
- Handles browser quirks
- Faster development

**Tradeoff:**
- Less control over buffer sizes
- Dependency on library updates
- Some overhead vs raw API

### Dynamic Template Detection vs Explicit Patches

**Chose dynamic because:**
- More intuitive for visual modular synth
- User doesn't need to "save patch" - just connect nodes
- Supports arbitrary routing

**Tradeoff:**
- Rebuild cost on every change
- Complex detection algorithm
- Harder to serialize/share patches

### Polyphony Limit (8 voices)

**Why 8:**
- CPU budget for real-time audio
- Each voice = multiple oscillators + envelope + routing
- With unison, could be 64 actual oscillators

**What would break higher:**
- Audio dropouts/glitches
- Latency spikes
- Battery drain on laptops

### Canvas Node Sharing

**Why shared:**
- Reverb is expensive (convolution)
- Effects should sound consistent across notes
- Memory efficiency

**Tradeoff:**
- Can't have per-note effect settings
- All voices go through same effect chain

---

## Phase 9: Potential Bug Stories (20 min)

Think back - did you encounter any of these?

### Click/Pop on Note Off
- **Symptom:** Audible click when releasing key
- **Cause:** Oscillator stopped abruptly, no volume ramp
- **Fix:** Added `volume.rampTo(-Infinity, 0.02)` before stop

### Voice Cutoff During Release
- **Symptom:** Long release notes cut off early
- **Cause:** Cleanup happened before release envelope finished
- **Fix:** Calculate max release time, add safety buffer

### Unison Volume Explosion
- **Symptom:** Unison sounds much louder than single osc
- **Cause:** Summing 8 oscillators = ~8x volume
- **Fix:** Volume compensation: `-3dB * log2(voices)`

### Filter Modulation Not Working
- **Symptom:** Envelope connected to filter does nothing
- **Cause:** Modulation target detection failed
- **Fix:** Check connection handle names, fix topology detection

### Reverb Not Ready
- **Symptom:** First notes have no reverb
- **Cause:** Reverb impulse response loads async
- **Fix:** Wait for `.ready` promise before playing

---

## Phase 10: Interview Prep (30 min)

### Your 2-Minute Pitch

Practice explaining the project in 2 minutes:
> "This is a browser-based modular synthesizer built with React and Tone.js. Users connect visual nodes to build synth patches - oscillators, filters, envelopes, effects. The interesting technical challenges were [pick 2-3]: voice polyphony management, dynamic routing detection, and real-time performance optimization..."

### Anticipated Questions

1. "Walk me through what happens when a user presses a key"
2. "How do you handle polyphony?"
3. "Why Tone.js instead of raw Web Audio?"
4. "What was the hardest bug you fixed?"
5. "How would you add MIDI input?"
6. "What would you do differently if starting over?"

### Code Sections to Know Cold

- `VoiceManager.startVoice()` and `stopVoice()`
- `AudioGraph.buildVoiceTemplateFromOutput()`
- Envelope trigger logic
- Unison oscillator creation

---

## Suggested Study Schedule

| Day | Focus | Time |
|-----|-------|------|
| Day 1 | Phases 1-2 (Mental model + AudioGraph) | 2 hours |
| Day 2 | Phases 3-4 (VoiceManager + Envelopes) | 2 hours |
| Day 3 | Phases 5-6 (Effects + Timing) | 1.5 hours |
| Day 4 | Phases 7-8 (Performance + Tradeoffs) | 1 hour |
| Day 5 | Phases 9-10 (Bug stories + Interview prep) | 1 hour |

---

## Quick Reference: Key Files

| File | Lines | What It Does |
|------|-------|--------------|
| `src/AudioGraph.js` | ~650 | Node registration, connection routing, template detection |
| `src/VoiceManager.js` | ~990 | Voice creation, polyphony, note on/off, cleanup |
| `src/App.jsx` | ~1500 | Main UI, canvas state, audio level monitoring |
| `src/components/EnvelopeNode.jsx` | - | DAHDSR implementation |
| `src/components/OscNode.jsx` | - | Oscillator with unison |
| `src/components/PianoRollNode.jsx` | - | Sequencer with Tone.Part |

Good luck with your interview! 🎹
