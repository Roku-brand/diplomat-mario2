/**
 * Jump input tuning.
 * Adds a small input buffer and coyote window so double jumps feel responsive.
 */
(function () {
  "use strict";

  const baseUpdate = window.update;
  const JUMP_KEYS = [" ", "ArrowUp", "w", "W"];
  const JUMP_BUFFER_FRAMES = 9;
  const COYOTE_FRAMES = 7;
  const AIR_HOLD_ASSIST_FRAMES = 3;

  let jumpBuffer = 0;
  let coyote = 0;
  let airFrames = 0;
  let jumpWasDown = false;
  let jumpHoldFrames = 0;
  let requireReleaseForHoldAssist = false;
  let holdAssistUsed = false;

  window.update = function update() {
    if (game.state !== "play" || game.showTutorial) {
      resetAssistIfGrounded();
      jumpWasDown = jumpDown();
      baseUpdate();
      return;
    }

    const wasGrounded = player.onGround;
    const down = jumpDown();
    const justJumped = jumpPressed() || (down && !jumpWasDown);
    const groundPressThisFrame = wasGrounded && justJumped;

    if (wasGrounded) {
      coyote = COYOTE_FRAMES;
      airFrames = 0;
      holdAssistUsed = false;
      requireReleaseForHoldAssist = down;
    } else {
      coyote = Math.max(0, coyote - 1);
      airFrames++;
    }

    if (!down) {
      requireReleaseForHoldAssist = false;
      jumpHoldFrames = 0;
    } else {
      jumpHoldFrames++;
    }

    if (justJumped) jumpBuffer = JUMP_BUFFER_FRAMES;
    else if (jumpBuffer > 0) jumpBuffer--;

    if (!wasGrounded && jumpBuffer > 0) {
      if (coyote > 0 && player.vy >= -1) {
        player.onGround = true;
        player.canDoubleJump = true;
        justPressed.add(" ");
        jumpBuffer = 0;
      } else if (player.canDoubleJump && airFrames > 2) {
        justPressed.add(" ");
        jumpBuffer = 0;
      }
    } else if (
      !wasGrounded &&
      player.canDoubleJump &&
      down &&
      !requireReleaseForHoldAssist &&
      !holdAssistUsed &&
      airFrames > 6 &&
      jumpHoldFrames >= AIR_HOLD_ASSIST_FRAMES
    ) {
      justPressed.add(" ");
      holdAssistUsed = true;
      jumpBuffer = 0;
    }

    baseUpdate();

    if (groundPressThisFrame) {
      jumpBuffer = 0;
      requireReleaseForHoldAssist = true;
    }

    if (player.onGround) {
      coyote = COYOTE_FRAMES;
      airFrames = 0;
      holdAssistUsed = false;
    }

    jumpWasDown = down;
  };

  function jumpDown() {
    return JUMP_KEYS.some(key => isDown(key));
  }

  function jumpPressed() {
    return JUMP_KEYS.some(key => pressed(key));
  }

  function resetAssistIfGrounded() {
    if (!player || player.onGround) {
      jumpBuffer = 0;
      coyote = COYOTE_FRAMES;
      airFrames = 0;
      holdAssistUsed = false;
      requireReleaseForHoldAssist = false;
    }
  }
}());
