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
  player.canDoubleJump = true;
  
  // スキル状態リセット
  player.activeSkill = null;
  player.skillTimer = 0;
  player.speedBoost = false;
  player.jumpBoost = false;
  player.invincible = false;
  player.magnetActive = false;
  
  // Apply career level bonuses
  player.coins = 0;
  player.connections = 0;
  if (playerGlobal.careerLevel >= 3) player.coins += 2;
  if (playerGlobal.careerLevel >= 4) player.connections += 1;

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
  
  // パワーアップアイテム
  powerUps = [];
  
  // アイテムボックス状態リセット
  itemBoxes.clear();

  // breakable tiles
  breakTiles.clear();
  for (let y=0; y<game.mapH; y++) {
    for (let x=0; x<game.mapW; x++) {
      if (game.map[y][x] === 4) breakTiles.set(`${x},${y}`, 120);
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
      playSFX("select");
    }
    if (pressed("ArrowRight") || pressed("d") || pressed("D")) {
      game.topMenuSelection = (game.topMenuSelection + 1) % 4;
      playSFX("select");
    }
    // Also support up/down for accessibility
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.topMenuSelection = (game.topMenuSelection - 1 + 4) % 4;
      playSFX("select");
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.topMenuSelection = (game.topMenuSelection + 1) % 4;
      playSFX("select");
    }
    // Select location
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      playSFX("confirm");
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
        // Show tutorial on first stage if not already shown
        if (!game.tutorialShown && game.stageIndex === 0) {
          game.showTutorial = true;
          game.tutorialStep = 0;
        }
        say("ゲームスタート！💰と👤を集めてゴールを目指せ！", 150);
      }
    }
    return;
  }

  if (game.state === "gameover") {
    if (pressed("r") || pressed("R")) loadStage(game.stageIndex);
    return;
  }

  // Handle tutorial overlay
  if (game.showTutorial) {
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      game.tutorialStep++;
      playSFX("select");
      if (game.tutorialStep >= 5) {
        game.showTutorial = false;
        game.tutorialShown = true;
      }
    }
    if (pressed("Escape") || pressed("Backspace")) {
      game.showTutorial = false;
      game.tutorialShown = true;
    }
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
    player.dashCD = 10;
    playSFX("dash");
  }

  // スピードアップスキルの効果
  let moveSpeed = player.dashT > 0 ? 6.2 : 3.2;
  if (player.speedBoost) moveSpeed *= 1.5;

  if (left && !right) { player.vx = -moveSpeed; player.face = -1; }
  else if (right && !left) { player.vx = moveSpeed; player.face = 1; }
  else player.vx = lerp(player.vx, 0, 0.4);

  // Jump and Double Jump logic
  // ジャンプ力アップスキルの効果
  const jumpPower = player.jumpBoost ? -15.5 : -13.2;
  const doubleJumpPower = player.jumpBoost ? -14.0 : -12.0;
  
  if (jump) {
    if (player.onGround) {
      player.vy = jumpPower;
      player.onGround = false;
      playSFX("jump");
    } else if (player.canDoubleJump) {
      player.vy = doubleJumpPower;
      player.canDoubleJump = false;
      playSFX("doubleJump");
    }
  }

  // Reset double jump ability when landing
  if (player.onGround) {
    player.canDoubleJump = true;
  }

  // gravity
  player.vy = clamp(player.vy + GRAVITY, -999, MAX_FALL);

  // apply movement/collision
  resolveCollisions(player);

  // スキルタイマー更新
  updateSkillTimer();

  // Collect coins and connection points
  updateCollectibles();
  
  // パワーアップアイテムの更新
  updatePowerUps();

  // hazards: trust drains
  if (hazardTouch(player)) {
    player.trust = clamp(player.trust - 0.35, 0, 100);
  }

  // breakable tiles
  updateBreakablesUnderPlayer();

  // goal - requires boss to be defeated first (if stage has a boss)
  if (goalTouch(player)) {
    const hasBoss = game.stage.bossSpawn !== undefined;
    if (!hasBoss || game.bossDefeated) {
      game.state = "clear";
      playSFX("stageClear");
      say("ステージクリア！次のステージへ", 120);
    } else {
      say("ボスを倒さないと進めない！ボスを踏み付けて倒せ！", 120);
    }
  }

  // enemy updates and interactions (踏み付け攻撃)
  updateEnemies();
  
  // Update defeat effects
  updateDefeatEffects();

  // fail conditions
  if (player.y > game.mapH*TILE + 220) {
    player.hp = 0;
    die("落下：穴に落ちてしまった…");
  }
  if (player.trust <= 0) {
    die("評判が地に落ちた：ゲームオーバー。");
  }
  if (player.hp <= 0) {
    die("体力の限界：ゲームオーバー。");
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
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    
    // 倒された敵は削除
    if (e.defeated && !e.isBoss) {
      enemies.splice(i, 1);
      continue;
    }

    // patrol
    const patrolLeft = e.originX - e.patrol;
    const patrolRight = e.originX + e.patrol;

    let speed = e.vx;

    // normal patrol
    e.vx = e.dir * speed * 0.85;
    if (e.x < patrolLeft) e.dir = 1;
    if (e.x > patrolRight) e.dir = -1;

    // gravity for non-drones
    if (e.type !== "drone") {
      e.vy = clamp(e.vy + GRAVITY, -999, MAX_FALL);
    } else {
      e.vy = 0;
    }

    resolveCollisions(e);

    // 敵との衝突判定
    if (e.hostile && !e.defeated && aabb(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
      // プレイヤーが上から落下中かどうか判定（踏み付け攻撃）
      const playerBottom = player.y + player.h;
      const enemyTop = e.y;
      const playerFalling = player.vy > 0;
      const stompZone = playerBottom <= enemyTop + 15 && playerBottom >= enemyTop - 5;
      
      if (playerFalling && stompZone && !e.unstompable) {
        // 踏み付け成功！
        const stomped = stompEnemy(e);
        if (stomped) {
          // プレイヤーを上にバウンド
          player.vy = -10;
          player.canDoubleJump = true;
        }
      } else {
        // 横から当たった場合はダメージ
        playerTakeDamage(e);
      }
    }
  }
}

function updateCollectibles() {
  const collectW = 24;
  const collectH = 24;
  
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    if (c.collected) continue;
    
    // アイテムボックスから出たアイテムは物理挙動
    if (c.fromBox && c.vy !== undefined) {
      c.vy += 0.3;
      c.y += c.vy;
      
      // 地面で止まる
      const ty = Math.floor((c.y + collectH) / TILE);
      const tx = Math.floor((c.x + collectW/2) / TILE);
      if (tileAt(tx, ty) === 1 || tileAt(tx, ty) === 4) {
        c.y = ty * TILE - collectH;
        c.vy = 0;
      }
      
      // 画面外に落ちたら削除
      if (c.y > game.mapH * TILE + 100) {
        collectibles.splice(i, 1);
        continue;
      }
    }
    
    // アイテム吸引スキルの効果
    if (player.magnetActive) {
      const dx = (player.x + player.w/2) - (c.x + collectW/2);
      const dy = (player.y + player.h/2) - (c.y + collectH/2);
      const dist = Math.hypot(dx, dy);
      
      if (dist < 150 && dist > 5) {
        // 吸引
        c.x += dx / dist * 4;
        c.y += dy / dist * 4;
      }
    }
    
    // Check collision with player
    if (aabb(player.x, player.y, player.w, player.h, c.x, c.y, collectW, collectH)) {
      c.collected = true;
      if (c.type === "coin") {
        player.coins++;
        playSFX("coin");
        createParticles(c.x + collectW/2, c.y + collectH/2, "coin", 8);
        say("💰 コイン+1！", 50);
      } else if (c.type === "connection") {
        player.connections++;
        playSFX("connection");
        createParticles(c.x + collectW/2, c.y + collectH/2, "connection", 10);
        say("👤 人脈+1！", 50);
      }
    }
  }
}

function die(reason) {
  game.state = "gameover";
  playSFX("gameOver");
  say(reason + "　Rで再開。", 999999);
}
