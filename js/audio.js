/**
 * Audio system using Web Audio API
 * Generates synthesized sound effects and music for the game
 */

// Audio context (initialized on first user interaction)
let audioCtx = null;
let audioInitialized = false;

// Master volume controls
const MASTER_VOLUME = 0.4;
const MUSIC_VOLUME = 0.25;
const SFX_VOLUME = 0.5;

// Music state
let musicOscillators = [];
let musicGain = null;
let isMusicPlaying = false;

/**
 * Initialize audio context on user interaction
 */
function initAudio() {
  if (audioInitialized) return;
  
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
    console.log("Audio system initialized");
  } catch (e) {
    console.warn("Web Audio API not supported:", e);
  }
}

/**
 * Play a simple synthesized sound effect
 */
function playSFX(type) {
  if (!audioCtx || !audioInitialized) return;
  
  try {
    switch (type) {
      case "jump":
        playTone(300, 0.08, "square", 0.3, 600); // Rising pitch
        break;
      case "doubleJump":
        playTone(400, 0.06, "square", 0.25, 800);
        setTimeout(() => playTone(500, 0.06, "square", 0.2, 900), 40);
        break;
      case "coin":
        playTone(880, 0.08, "sine", 0.35);
        setTimeout(() => playTone(1100, 0.12, "sine", 0.3), 60);
        break;
      case "connection":
        playTone(440, 0.1, "sine", 0.3);
        setTimeout(() => playTone(550, 0.1, "sine", 0.25), 80);
        setTimeout(() => playTone(660, 0.15, "sine", 0.2), 160);
        break;
      case "negoStart":
        playTone(330, 0.15, "triangle", 0.25);
        setTimeout(() => playTone(440, 0.15, "triangle", 0.2), 100);
        break;
      case "negoSuccess":
        playChord([523, 659, 784], 0.3, "sine", 0.3); // C major chord
        setTimeout(() => playChord([587, 740, 880], 0.4, "sine", 0.25), 200); // D major
        break;
      case "negoFail":
        playTone(200, 0.2, "sawtooth", 0.25, 100);
        setTimeout(() => playTone(150, 0.3, "sawtooth", 0.2, 80), 150);
        break;
      case "select":
        playTone(600, 0.05, "square", 0.2);
        break;
      case "confirm":
        playTone(500, 0.06, "square", 0.25);
        setTimeout(() => playTone(700, 0.08, "square", 0.2), 50);
        break;
      case "damage":
        playNoise(0.15, 0.35);
        playTone(150, 0.2, "sawtooth", 0.3, 80);
        break;
      case "bossAppear":
        playTone(100, 0.4, "sawtooth", 0.3, 200);
        setTimeout(() => playTone(150, 0.3, "sawtooth", 0.25), 300);
        setTimeout(() => playTone(200, 0.5, "sawtooth", 0.2), 500);
        break;
      case "bossDefeat":
        for (let i = 0; i < 6; i++) {
          setTimeout(() => playTone(300 + i * 100, 0.15, "sine", 0.25 - i * 0.03), i * 100);
        }
        setTimeout(() => playChord([523, 659, 784, 1047], 0.8, "sine", 0.35), 600);
        break;
      case "levelUp":
        playTone(400, 0.1, "sine", 0.3);
        setTimeout(() => playTone(500, 0.1, "sine", 0.28), 100);
        setTimeout(() => playTone(600, 0.1, "sine", 0.26), 200);
        setTimeout(() => playTone(800, 0.2, "sine", 0.3), 300);
        break;
      case "stageClear":
        const notes = [523, 587, 659, 784, 880, 1047];
        notes.forEach((freq, i) => {
          setTimeout(() => playTone(freq, 0.2, "sine", 0.3 - i * 0.04), i * 120);
        });
        setTimeout(() => playChord([523, 659, 784, 1047], 1.0, "sine", 0.35), 800);
        break;
      case "gameOver":
        playTone(400, 0.3, "sawtooth", 0.3, 200);
        setTimeout(() => playTone(300, 0.3, "sawtooth", 0.25, 150), 300);
        setTimeout(() => playTone(200, 0.5, "sawtooth", 0.2, 100), 600);
        break;
      case "walk":
        playTone(100 + Math.random() * 50, 0.03, "triangle", 0.1);
        break;
      case "dash":
        playNoise(0.05, 0.15);
        playTone(200, 0.08, "square", 0.15, 400);
        break;
      default:
        // Default beep
        playTone(440, 0.1, "sine", 0.2);
    }
  } catch (e) {
    console.warn("Error playing sound:", e);
  }
}

/**
 * Play a single tone
 */
function playTone(frequency, duration, waveType = "sine", volume = 0.3, endFreq = null) {
  if (!audioCtx) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  if (endFreq !== null) {
    oscillator.frequency.linearRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
  }
  
  gainNode.gain.setValueAtTime(volume * SFX_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

/**
 * Play a chord (multiple tones at once)
 */
function playChord(frequencies, duration, waveType = "sine", volume = 0.2) {
  if (!audioCtx) return;
  
  frequencies.forEach(freq => {
    playTone(freq, duration, waveType, volume / frequencies.length);
  });
}

/**
 * Play white noise (for impact/explosion effects)
 */
function playNoise(duration, volume = 0.2) {
  if (!audioCtx) return;
  
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  
  source.buffer = buffer;
  gainNode.gain.setValueAtTime(volume * SFX_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  source.start();
}

/**
 * Start background music
 */
function startMusic(theme = "menu") {
  if (!audioCtx || isMusicPlaying) return;
  
  stopMusic();
  
  try {
    musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(MUSIC_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
    musicGain.connect(audioCtx.destination);
    
    isMusicPlaying = true;
    
    if (theme === "menu") {
      playMenuMusic();
    } else if (theme === "play") {
      playGameMusic();
    } else if (theme === "boss") {
      playBossMusic();
    }
  } catch (e) {
    console.warn("Error starting music:", e);
  }
}

/**
 * Stop background music
 */
function stopMusic() {
  musicOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {}
  });
  musicOscillators = [];
  isMusicPlaying = false;
}

/**
 * Menu music - calm, ambient
 */
function playMenuMusic() {
  if (!audioCtx || !musicGain) return;
  
  const bassNotes = [130.81, 146.83, 164.81, 146.83]; // C3, D3, E3, D3
  const melodyNotes = [261.63, 329.63, 392.00, 329.63]; // C4, E4, G4, E4
  
  let noteIndex = 0;
  
  function playNextNote() {
    if (!isMusicPlaying) return;
    
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(bassNotes[noteIndex % bassNotes.length], audioCtx.currentTime);
    bassGain.gain.setValueAtTime(0.15 * MUSIC_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    bassOsc.connect(bassGain);
    bassGain.connect(audioCtx.destination);
    bassOsc.start();
    bassOsc.stop(audioCtx.currentTime + 0.8);
    
    const melodyOsc = audioCtx.createOscillator();
    const melodyGain = audioCtx.createGain();
    melodyOsc.type = "triangle";
    melodyOsc.frequency.setValueAtTime(melodyNotes[noteIndex % melodyNotes.length], audioCtx.currentTime);
    melodyGain.gain.setValueAtTime(0.08 * MUSIC_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
    melodyGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    melodyOsc.connect(melodyGain);
    melodyGain.connect(audioCtx.destination);
    melodyOsc.start();
    melodyOsc.stop(audioCtx.currentTime + 0.6);
    
    noteIndex++;
    
    if (isMusicPlaying) {
      setTimeout(playNextNote, 800);
    }
  }
  
  playNextNote();
}

/**
 * Game music - upbeat, motivating
 */
function playGameMusic() {
  if (!audioCtx || !musicGain) return;
  
  const bassLine = [130.81, 130.81, 146.83, 164.81, 146.83, 130.81, 110, 130.81];
  const rhythm = [true, false, true, false, true, true, false, true];
  
  let noteIndex = 0;
  
  function playNextBeat() {
    if (!isMusicPlaying) return;
    
    if (rhythm[noteIndex % rhythm.length]) {
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bassOsc.type = "square";
      bassOsc.frequency.setValueAtTime(bassLine[noteIndex % bassLine.length], audioCtx.currentTime);
      bassGain.gain.setValueAtTime(0.12 * MUSIC_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      bassOsc.connect(bassGain);
      bassGain.connect(audioCtx.destination);
      bassOsc.start();
      bassOsc.stop(audioCtx.currentTime + 0.15);
    }
    
    // Occasional melody note
    if (noteIndex % 4 === 0) {
      const melodyNotes = [392, 440, 494, 523];
      const melodyOsc = audioCtx.createOscillator();
      const melodyGain = audioCtx.createGain();
      melodyOsc.type = "sine";
      melodyOsc.frequency.setValueAtTime(melodyNotes[Math.floor(noteIndex / 4) % melodyNotes.length], audioCtx.currentTime);
      melodyGain.gain.setValueAtTime(0.06 * MUSIC_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
      melodyGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      melodyOsc.connect(melodyGain);
      melodyGain.connect(audioCtx.destination);
      melodyOsc.start();
      melodyOsc.stop(audioCtx.currentTime + 0.3);
    }
    
    noteIndex++;
    
    if (isMusicPlaying) {
      setTimeout(playNextBeat, 180);
    }
  }
  
  playNextBeat();
}

/**
 * Boss music - intense, dramatic
 */
function playBossMusic() {
  if (!audioCtx || !musicGain) return;
  
  const bassLine = [82.41, 82.41, 98, 82.41, 73.42, 73.42, 82.41, 98];
  
  let noteIndex = 0;
  
  function playNextBeat() {
    if (!isMusicPlaying) return;
    
    // Heavy bass
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(bassLine[noteIndex % bassLine.length], audioCtx.currentTime);
    bassGain.gain.setValueAtTime(0.15 * MUSIC_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    bassOsc.connect(bassGain);
    bassGain.connect(audioCtx.destination);
    bassOsc.start();
    bassOsc.stop(audioCtx.currentTime + 0.12);
    
    // Tension note every other beat
    if (noteIndex % 2 === 0) {
      const tensionOsc = audioCtx.createOscillator();
      const tensionGain = audioCtx.createGain();
      tensionOsc.type = "triangle";
      tensionOsc.frequency.setValueAtTime(bassLine[noteIndex % bassLine.length] * 3, audioCtx.currentTime);
      tensionGain.gain.setValueAtTime(0.04 * MUSIC_VOLUME * MASTER_VOLUME, audioCtx.currentTime);
      tensionGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      tensionOsc.connect(tensionGain);
      tensionGain.connect(audioCtx.destination);
      tensionOsc.start();
      tensionOsc.stop(audioCtx.currentTime + 0.08);
    }
    
    noteIndex++;
    
    if (isMusicPlaying) {
      setTimeout(playNextBeat, 150);
    }
  }
  
  playNextBeat();
}

// Initialize audio on first user interaction
document.addEventListener("keydown", initAudio, { once: false });
document.addEventListener("click", initAudio, { once: false });
document.addEventListener("touchstart", initAudio, { once: false });
