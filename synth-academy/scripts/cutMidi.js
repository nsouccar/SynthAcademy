// Script to cut a MIDI file at a specific bar
import pkg from '@tonejs/midi';
const { Midi } = pkg;
import fs from 'fs';

const inputPath = '/Users/noasouccar/Downloads/Van_Halen_-_Jump.mid';
const outputPath = '/Users/noasouccar/Desktop/FractalProjects/SynthAcademy/synth-academy/public/midi/jump.mid';

// Read the MIDI file
const midiData = fs.readFileSync(inputPath);
const midi = new Midi(midiData);

console.log('Original MIDI info:');
console.log('  Name:', midi.name);
console.log('  Duration:', midi.duration, 'seconds');
console.log('  Tracks:', midi.tracks.length);
console.log('  PPQ:', midi.header.ppq);
console.log('  Time signatures:', midi.header.timeSignatures);
console.log('  Tempos:', midi.header.tempos);

// Get time signature (default 4/4 if not specified)
const timeSignature = midi.header.timeSignatures[0] || { timeSignature: [4, 4] };
const beatsPerBar = timeSignature.timeSignature ? timeSignature.timeSignature[0] : 4;

// Get tempo (default 120 BPM if not specified)
const tempo = midi.header.tempos[0]?.bpm || 120;
const secondsPerBeat = 60 / tempo;
const secondsPerBar = secondsPerBeat * beatsPerBar;

// Calculate cutoff time (end of bar 8)
const cutoffBar = 8;
const cutoffTime = cutoffBar * secondsPerBar;

console.log('\nCutting at bar', cutoffBar);
console.log('  Beats per bar:', beatsPerBar);
console.log('  Tempo:', tempo, 'BPM');
console.log('  Seconds per bar:', secondsPerBar);
console.log('  Cutoff time:', cutoffTime, 'seconds');

// Filter notes in each track
midi.tracks.forEach((track, i) => {
  const originalNoteCount = track.notes.length;

  // Filter notes that start before the cutoff
  track.notes = track.notes.filter(note => note.time < cutoffTime);

  // Truncate notes that extend past the cutoff
  track.notes.forEach(note => {
    if (note.time + note.duration > cutoffTime) {
      note.duration = cutoffTime - note.time;
    }
  });

  console.log(`  Track ${i} (${track.name}): ${originalNoteCount} -> ${track.notes.length} notes`);
});

// Ensure output directory exists
const outputDir = '/Users/noasouccar/Desktop/FractalProjects/SynthAcademy/synth-academy/public/midi';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the new MIDI file
fs.writeFileSync(outputPath, Buffer.from(midi.toArray()));

console.log('\nSaved cut MIDI to:', outputPath);
console.log('New duration:', cutoffTime, 'seconds');
