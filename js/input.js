/**
 * Input handling
 */
const keys = new Map();
const justPressed = new Set();

window.addEventListener("keydown", (e) => {
  if (!keys.get(e.key)) justPressed.add(e.key);
  keys.set(e.key, true);
  // Prevent page scroll on arrows/space
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
}, { passive:false });

window.addEventListener("keyup", (e) => {
  keys.set(e.key, false);
});

const isDown = (k) => !!keys.get(k);
const pressed = (k) => justPressed.has(k);
