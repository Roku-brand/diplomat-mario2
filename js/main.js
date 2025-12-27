/**
 * Main entry point and game loop
 */
"use strict";

// Initialize with stage select screen
game.state = "select";
game.selectedStage = 0;

// Main loop
function tick() {
  update();
  draw();
  justPressed.clear(); // Clear at end of frame so input is available during update
  requestAnimationFrame(tick);
}
tick();

// Quick reset / debug
window.addEventListener("keydown", (e) => {
  if ((e.key === "r" || e.key === "R") && game.state === "play") {
    // allow manual restart too
    loadStage(game.stageIndex);
  }
});
