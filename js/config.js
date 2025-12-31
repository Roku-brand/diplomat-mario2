/**
 * Core configuration and constants
 */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width, H = canvas.height;
const TILE = 36;
const GRAVITY = 0.75;
const MAX_FALL = 18;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Screen shake effect
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

function triggerScreenShake(intensity = 5, duration = 10) {
  screenShake.intensity = intensity;
  screenShake.duration = duration;
}

function updateScreenShake() {
  if (screenShake.duration > 0) {
    screenShake.x = (Math.random() - 0.5) * 2 * screenShake.intensity;
    screenShake.y = (Math.random() - 0.5) * 2 * screenShake.intensity;
    screenShake.duration--;
    screenShake.intensity *= 0.9; // Decay
  } else {
    screenShake.x = 0;
    screenShake.y = 0;
  }
}

// Particle system
const particles = [];

function createParticles(x, y, type, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 3;
    
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 40 + Math.random() * 20,
      maxLife: 60,
      type: type,
      size: 3 + Math.random() * 4,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // gravity
    p.vx *= 0.98; // friction
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    
    if (p.type === "coin") {
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "connection") {
      ctx.fillStyle = `rgba(74, 144, 217, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "success") {
      ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "fail") {
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    } else if (p.type === "boss") {
      const colors = ["#ffd700", "#ff6b6b", "#4ecdc4", "#ff69b4"];
      ctx.fillStyle = colors[Math.floor(p.life) % colors.length];
      ctx.globalAlpha = alpha;
      ctx.font = `${p.size * 3}px sans-serif`;
      ctx.fillText("✨", p.x, p.y);
      ctx.globalAlpha = 1;
    } else if (p.type === "damage") {
      ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
  }
}
