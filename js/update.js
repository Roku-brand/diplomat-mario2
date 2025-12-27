/**
 * Game loop update logic
 */

function loadStage(idx) {
  game.stageIndex = idx;
  game.stage = STAGES[idx];
  game.map = game.stage.map;
  game.mapH = game.map.length;
  game.mapW = game.map[0].length;
  game.cameraX = 0; game.cameraY = 0;
  game.time = 0;
  game.state = "intro";
  game.introLine = 0;
  game.alert = 0;
  game.message = "";
  game.messageT = 0;
  game.bossDefeated = false;
  game.bossPhase = 0;
  game.defeatEffects = [];

  // reset player
  player.x = 2*TILE; player.y = 6*TILE;
  player.vx = 0; player.vy = 0;
  player.onGround = false; player.face = 1;
  player.trust = 100;
  player.hp = 3;
  player.dashT = 0;
  player.dashCD = 0;
  player.negotiating = null;
  player.negoProgress = 0;
  player.canDoubleJump = true;
  
  // Apply career level bonuses
  player.coins = 0;
  player.connections = 0;
  if (playerGlobal.careerLevel >= 3) player.coins += 2; // 課長ボーナス
  if (playerGlobal.careerLevel >= 4) player.connections += 1; // 部長ボーナス

  // enemies
  enemies = [];
  for (const s of game.stage.enemySpawns) {
    const e = enemyTemplate(s.type);
    e.x = s.x; e.y = s.y;
    e.originX = e.x;
    enemies.push(e);
  }
  
  // Add boss if stage has one
  if (game.stage.bossSpawn) {
    const boss = enemyTemplate(game.stage.bossSpawn.type);
    boss.x = game.stage.bossSpawn.x;
    boss.y = game.stage.bossSpawn.y;
    boss.originX = boss.x;
    enemies.push(boss);
  }

  // collectibles (コインと人脈ポイント)
  collectibles = [];
  if (game.stage.collectibles) {
    for (const c of game.stage.collectibles) {
      collectibles.push({ ...c, collected: false });
    }
  }

  // breakable tiles
  breakTiles.clear();
  for (let y=0; y<game.mapH; y++) {
    for (let x=0; x<game.mapW; x++) {
      if (game.map[y][x] === 4) breakTiles.set(`${x},${y}`, 120); // durability frames
    }
  }
}

function update() {
  game.time++;

  if (game.messageT > 0) game.messageT--;

  // Top menu (RPG style hub)
  if (game.state === "topmenu") {
    // Navigation (horizontal layout - left/right)
    if (pressed("ArrowLeft") || pressed("a") || pressed("A")) {
      game.topMenuSelection = (game.topMenuSelection - 1 + 4) % 4;
    }
    if (pressed("ArrowRight") || pressed("d") || pressed("D")) {
      game.topMenuSelection = (game.topMenuSelection + 1) % 4;
    }
    // Also support up/down for accessibility
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.topMenuSelection = (game.topMenuSelection - 1 + 4) % 4;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.topMenuSelection = (game.topMenuSelection + 1) % 4;
    }
    // Select location
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      if (game.topMenuSelection === 0) {
        game.state = "headquarters"; // 本社
        game.headquartersSelection = 0;
      } else if (game.topMenuSelection === 1) {
        game.state = "branch"; // 支社
        game.branchSelection = 0;
      } else if (game.topMenuSelection === 2) {
        game.state = "dictionary"; // 人脈図鑑
        game.dictionaryPage = 0;
      } else {
        game.state = "select"; // 交通センター（ステージ選択）
      }
    }
    return;
  }

  // Headquarters menu (settings, outfit)
  if (game.state === "headquarters") {
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.headquartersSelection = (game.headquartersSelection - 1 + 3) % 3;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.headquartersSelection = (game.headquartersSelection + 1) % 3;
    }
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      if (game.headquartersSelection === 0) {
        // Change outfit (cycle through unlocked outfits)
        const startOutfit = playerGlobal.outfit;
        let nextOutfit = (playerGlobal.outfit + 1) % playerGlobal.outfitsUnlocked.length;
        let loopCount = 0;
        const maxLoops = playerGlobal.outfitsUnlocked.length;
        while (!playerGlobal.outfitsUnlocked[nextOutfit] && loopCount < maxLoops) {
          nextOutfit = (nextOutfit + 1) % playerGlobal.outfitsUnlocked.length;
          loopCount++;
        }
        if (playerGlobal.outfitsUnlocked[nextOutfit]) {
          playerGlobal.outfit = nextOutfit;
          say("スタイル変更: スタイル " + (playerGlobal.outfit + 1), 90);
        } else {
          say("他に解放済みのスタイルがありません", 90);
        }
      } else if (game.headquartersSelection === 1) {
        // Unlock outfit (costs savings)
        const nextUnlock = playerGlobal.outfitsUnlocked.findIndex((v, i) => !v && i > 0);
        if (nextUnlock !== -1 && playerGlobal.savings >= 10) {
          playerGlobal.savings -= 10;
          playerGlobal.outfitsUnlocked[nextUnlock] = true;
          say("新スタイル解放！", 90);
        } else if (nextUnlock === -1) {
          say("全てのスタイルを解放済み", 90);
        } else {
          say("貯金が足りない（必要: 10💰）", 90);
        }
      } else {
        game.state = "topmenu"; // Back
      }
    }
    if (pressed("Escape") || pressed("Backspace")) {
      game.state = "topmenu";
    }
    return;
  }

  // Branch office menu (savings, connections)
  if (game.state === "branch") {
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.branchSelection = (game.branchSelection - 1 + 4) % 4;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.branchSelection = (game.branchSelection + 1) % 4;
    }
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      if (game.branchSelection === 0) {
        // Add to savings from stage earnings (simulated for now)
        say("貯金は各ステージクリア後に増加します", 120);
      } else if (game.branchSelection === 1) {
        // Invest savings to get starting coins
        if (playerGlobal.savings >= 5) {
          playerGlobal.savings -= 5;
          player.coins += 3;
          say("投資成功！次のステージで💰+3", 90);
        } else {
          say("貯金が足りない（必要: 5💰）", 90);
        }
      } else if (game.branchSelection === 2) {
        // Build connections
        if (playerGlobal.savings >= 8) {
          playerGlobal.savings -= 8;
          playerGlobal.networkTotal += 1;
          player.connections += 1;
          say("人脈拡大！👤+1", 90);
        } else {
          say("貯金が足りない（必要: 8💰）", 90);
        }
      } else {
        game.state = "topmenu"; // Back
      }
    }
    if (pressed("Escape") || pressed("Backspace")) {
      game.state = "topmenu";
    }
    return;
  }

  // Connection dictionary screen (人脈図鑑)
  if (game.state === "dictionary") {
    const connectionTypes = Object.keys(CONNECTION_TYPES);
    const totalPages = Math.ceil(connectionTypes.length / 4); // 4 entries per page
    
    if (pressed("ArrowLeft") || pressed("a") || pressed("A")) {
      game.dictionaryPage = (game.dictionaryPage - 1 + totalPages) % totalPages;
    }
    if (pressed("ArrowRight") || pressed("d") || pressed("D")) {
      game.dictionaryPage = (game.dictionaryPage + 1) % totalPages;
    }
    if (pressed("Escape") || pressed("Backspace") || pressed("Enter") || pressed(" ")) {
      game.state = "topmenu";
    }
    return;
  }

  // Stage selection screen
  if (game.state === "select") {
    // Navigation
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.selectedStage = (game.selectedStage - 1 + STAGES.length) % STAGES.length;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.selectedStage = (game.selectedStage + 1) % STAGES.length;
    }
    // Select stage
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      loadStage(game.selectedStage);
    }
    // Back to top menu
    if (pressed("Escape") || pressed("Backspace")) {
      game.state = "topmenu";
    }
    return;
  }

  if (game.state === "intro") {
    // Advance intro with Enter or E or Space
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      game.introLine++;
      if (game.introLine >= game.stage.intro.length) {
        game.state = "play";
        say("交渉開始！お金💰と人脈👤を集めて契約を取れ！", 150);
      }
    }
    return;
  }

  if (game.state === "gameover") {
    if (pressed("r") || pressed("R")) loadStage(game.stageIndex);
    return;
  }

  if (game.state === "clear") {
    // Add rewards to global savings
    const stageReward = 5 + game.stageIndex * 3; // Increasing rewards per stage
    const bonusCoins = player.coins; // Remaining coins become savings
    const bonusConnections = player.connections; // Remaining connections add to network
    playerGlobal.savings += stageReward + bonusCoins;
    playerGlobal.networkTotal += bonusConnections;
    
    // Mark stage as cleared
    playerGlobal.stagesCleared[game.stageIndex] = true;
    
    // Add career exp for clearing stage
    const stageExp = 10 + game.stageIndex * 5;
    addCareerExp(stageExp);
    
    // Increment total contracts
    playerGlobal.totalContracts++;
    
    if (game.stageIndex < STAGES.length - 1) {
      loadStage(game.stageIndex + 1);
    } else {
      // end - return to top menu
      game.state = "topmenu";
      game.topMenuSelection = 0;
      say(`全ステージクリア！貯金+${stageReward + bonusCoins}　人脈+${bonusConnections}　🎉ゲームクリア！`, 300);
    }
    return;
  }

  // =====================================================
  // PLAY state
  // =====================================================
  // Player control
  const left = isDown("ArrowLeft") || isDown("a") || isDown("A");
  const right = isDown("ArrowRight") || isDown("d") || isDown("D");
  const jump = pressed(" ") || pressed("ArrowUp") || pressed("w") || pressed("W");
  const dashHold = isDown("Shift");

  // dash (hold to dash)
  if (player.dashCD > 0) player.dashCD--;
  if (player.dashT > 0) player.dashT--;

  if (dashHold && player.dashCD === 0) {
    player.dashT = 14;
    player.dashCD = 10; // shorter cooldown for continuous dashing while holding
  }

  const moveSpeed = player.dashT > 0 ? 6.2 : 3.2;

  if (left && !right) { player.vx = -moveSpeed; player.face = -1; }
  else if (right && !left) { player.vx = moveSpeed; player.face = 1; }
  else player.vx = lerp(player.vx, 0, 0.4);

  // Jump and Double Jump logic
  if (jump) {
    if (player.onGround) {
      // First jump from ground
      player.vy = -13.2;
      player.onGround = false;
    } else if (player.canDoubleJump) {
      // Double jump in air
      player.vy = -12.0; // slightly weaker than first jump
      player.canDoubleJump = false;
    }
  }

  // Reset double jump ability when landing (handles both: after double-jump and after falling)
  if (player.onGround) {
    player.canDoubleJump = true;
  }

  // gravity
  player.vy = clamp(player.vy + GRAVITY, -999, MAX_FALL);

  // negotiation start/hold
  const eNear = nearestNegotiableEnemy();
  const eKeyHeld = isDown("e") || isDown("E");
  if (eKeyHeld) {
    if (!player.negotiating && eNear) startNegotiation(eNear);
    if (player.negotiating) negotiationTick();
  } else {
    if (player.negotiating) stopNegotiation();
  }

  // apply movement/collision
  resolveCollisions(player);

  // Collect coins and connection points
  updateCollectibles();

  // hazards: trust drains
  if (hazardTouch(player)) {
    player.trust = clamp(player.trust - 0.35, 0, 100);
    // In port hazard also raises alert slowly (税関監視)
    if (game.stage.id === "port" && Math.random() < 0.03) {
      game.alert = clamp(game.alert + 1, 0, 3);
      say("税関の監視が反応した。警戒 +1", 90);
    }
  }

  // breakable tiles: standing on them decreases durability
  updateBreakablesUnderPlayer();

  // goal - requires boss to be defeated first
  if (goalTouch(player)) {
    if (game.bossDefeated) {
      game.state = "clear";
      say("契約成立！次のステージへ", 120);
    } else {
      say("ボスを倒さないと進めない！ステージボスを見つけて交渉しろ！", 120);
    }
  }

  // enemy updates and interactions
  updateEnemies();
  
  // Update defeat effects
  updateDefeatEffects();

  // fail conditions
  if (player.y > game.mapH*TILE + 220) {
    // fell into pit
    player.hp = 0;
    die("落下：契約書を落としてしまった…");
  }
  if (player.trust <= 0) {
    die("評判が地に落ちた：取引先からの信頼を失った。");
  }
  if (player.hp <= 0) {
    die("体力の限界：過労でダウン。");
  }

  // camera
  const targetX = clamp(player.x - W*0.45, 0, game.mapW*TILE - W);
  game.cameraX = lerp(game.cameraX, targetX, 0.12);
  game.cameraY = 0;
}

function updateBreakablesUnderPlayer() {
  // Check tiles just beneath player's feet
  const footY = player.y + player.h + 1;
  const leftX = player.x + 4;
  const rightX = player.x + player.w - 4;

  const a = worldToTile(leftX, footY);
  const b = worldToTile(rightX, footY);

  for (const p of [a,b]) {
    if (tileAt(p.tx, p.ty) === 4) {
      const key = `${p.tx},${p.ty}`;
      const d = breakTiles.get(key) ?? 0;
      const nd = d - 1;
      breakTiles.set(key, nd);
      if (nd === 60) say("床が軋む…", 60);
      if (nd <= 0) {
        // break: set to empty
        game.map[p.ty][p.tx] = 0;
        say("床が崩れた。", 80);
      }
    }
  }
}

function updateEnemies() {
  const alertMul = 1 + game.alert * 0.22;

  for (const e of enemies) {
    // drones hover: ignore ground a bit
    if (e.type === "drone") {
      e.y += Math.sin(game.time * 0.06) * 0.45;
    }

    // allied/neutral don't attack
    const canAttack = e.hostile && e.stance !== "allied";

    // patrol
    const patrolLeft = e.originX - e.patrol;
    const patrolRight = e.originX + e.patrol;

    // aggro movement toward player if close and hostile
    const dx = (player.x + player.w/2) - (e.x + e.w/2);
    const dist = Math.abs(dx);

    let speed = e.vx * alertMul;
    if (e.stance === "neutral") speed *= 0.6;

    if (canAttack && dist < e.aggroRange) {
      e.dir = dx >= 0 ? 1 : -1;
      e.vx = e.dir * speed;
    } else {
      // normal patrol
      e.vx = e.dir * speed * 0.85;
      if (e.x < patrolLeft) e.dir = 1;
      if (e.x > patrolRight) e.dir = -1;
    }

    // gravity for non-drones
    if (e.type !== "drone") {
      e.vy = clamp(e.vy + GRAVITY, -999, MAX_FALL);
    } else {
      e.vy = 0;
    }

    resolveCollisions(e);

    // contact damage if hostile
    if (canAttack && aabb(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
      // If negotiating, break it
      if (player.negotiating) stopNegotiation();
      // damage
      player.hp -= e.contactDamage;
      player.trust = clamp(player.trust - 7, 0, 100);
      say("衝突！商談が台無しに（HP -1 / 評判 -7）", 120);
      // knockback
      player.vx = -e.dir * 5.2;
      player.vy = -7.5;
      // alert rises on clash
      game.alert = clamp(game.alert + 1, 0, 3);
    }
  }
}

function updateCollectibles() {
  const collectW = 24;
  const collectH = 24;
  
  for (const c of collectibles) {
    if (c.collected) continue;
    
    // Check collision with player
    if (aabb(player.x, player.y, player.w, player.h, c.x, c.y, collectW, collectH)) {
      c.collected = true;
      if (c.type === "coin") {
        player.coins++;
        say("💰 お金+1！（交渉材料として使える）", 80);
      } else if (c.type === "connection") {
        player.connections++;
        say("👤 人脈+1！（有力なコネクション獲得）", 80);
      }
    }
  }
}

function die(reason) {
  game.state = "gameover";
  say(reason + "　Rで再開。", 999999);
}
