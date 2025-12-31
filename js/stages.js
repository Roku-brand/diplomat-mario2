/**
 * Stage data and map generators
 */

function rect(map, x, y, w, v) {
  for (let i=0;i<w;i++) map[y][x+i]=v;
}

// Tile types:
// 0 = empty, 1 = solid ground, 2 = hazard, 3 = goal, 4 = breakable, 5 = gate, 6 = item box

function makeStageMap_Market() {
  // 市場・展示会場：商社マンの戦場
  const h = 15, w = 110;
  const m = Array.from({length:h}, () => Array(w).fill(0));

  // baseline ground with gaps (展示ブースの通路)
  for (let x=0; x<w; x++) {
    const isGap =
      (x>=14 && x<=17) ||
      (x>=31 && x<=33) ||
      (x>=49 && x<=52) ||
      (x>=70 && x<=72) ||
      (x>=97 && x<=99);
    if (!isGap) m[12][x] = 1;
    if (!isGap) m[13][x] = 1;
    if (!isGap) m[14][x] = 1;
  }

  // プラットフォーム（展示ブース、階段など）
  rect(m, 10, 8, 6, 1);
  rect(m, 26, 9, 5, 1);
  rect(m, 40, 8, 7, 1);
  rect(m, 58, 7, 6, 1);
  rect(m, 66, 9, 4, 1);
  rect(m, 82, 8, 6, 1);
  rect(m, 90, 7, 5, 1);

  // アイテムボックス（?ブロック）を追加
  m[7][12] = 6;
  m[8][28] = 6;
  m[6][43] = 6;
  m[5][60] = 6;
  m[8][68] = 6;
  m[6][84] = 6;
  m[5][92] = 6;
  m[10][75] = 6;
  m[10][76] = 6;
  m[10][77] = 6;

  // hazards: 競合エリア（入ると信頼が下がる）
  for (let x=34; x<=38; x++) m[11][x] = 2;
  for (let x=73; x<=78; x++) m[11][x] = 2;

  // goal
  m[11][107] = 3;
  m[10][107] = 3;
  return m;
}

function makeStageMap_Office() {
  // オフィスビル：本社との交渉
  const h = 15, w = 95;
  const m = Array.from({length:h}, () => Array(w).fill(0));

  // ground with gaps (エレベーターホール、吹き抜け)
  for (let x=0; x<w; x++) {
    const isGap =
      (x>=10 && x<=12) ||
      (x>=24 && x<=26) ||
      (x>=45 && x<=46) ||
      (x>=60 && x<=63) ||
      (x>=84 && x<=85);
    if (!isGap) {
      m[12][x] = 1; m[13][x] = 1; m[14][x] = 1;
    }
  }

  // フロア/プラットフォーム
  rect(m, 16, 8, 6, 1);
  rect(m, 32, 7, 7, 1);
  rect(m, 48, 8, 6, 1);
  rect(m, 67, 7, 6, 1);
  rect(m, 78, 8, 5, 1);

  // アイテムボックス追加
  m[6][18] = 6;
  m[5][34] = 6;
  m[5][35] = 6;
  m[5][36] = 6;
  m[6][50] = 6;
  m[5][69] = 6;
  m[6][80] = 6;
  m[10][55] = 6;
  m[10][56] = 6;

  // 古いオフィスの床（壊れやすい）
  for (let x=34; x<=37; x++) m[6][x] = 4;

  // 監視ゾーン（コンプライアンス監査エリア）
  for (let x=27; x<=31; x++) m[11][x] = 2;
  for (let x=52; x<=56; x++) m[11][x] = 2;

  // goal
  m[11][92] = 3; m[10][92] = 3;
  return m;
}

function makeStageMap_Port() {
  // 港湾・物流拠点：輸出入の現場
  const h = 15, w = 90;
  const m = Array.from({length:h}, () => Array(w).fill(0));

  // ground with gaps (船着き場の隙間)
  for (let x=0; x<w; x++) {
    const isGap =
      (x>=12 && x<=13) ||
      (x>=29 && x<=31) ||
      (x>=50 && x<=51) ||
      (x>=66 && x<=68);
    if (!isGap) { m[12][x]=1; m[13][x]=1; m[14][x]=1; }
  }

  // コンテナ/クレーン（プラットフォーム）
  rect(m, 18, 9, 8, 1);
  rect(m, 36, 8, 7, 1);
  rect(m, 55, 9, 8, 1);
  rect(m, 73, 8, 6, 1);

  // アイテムボックス追加
  m[7][20] = 6;
  m[7][21] = 6;
  m[6][38] = 6;
  m[6][39] = 6;
  m[6][40] = 6;
  m[7][57] = 6;
  m[6][75] = 6;
  m[6][76] = 6;
  m[10][45] = 6;
  m[10][46] = 6;
  m[10][47] = 6;

  // 税関エリア（監視ゾーン）
  for (let x=41; x<=46; x++) m[11][x] = 2;

  // goal: 輸出ゲート
  m[11][87] = 3; m[10][87] = 3;
  return m;
}

// コレクティブル（コインと人脈ポイント）の配置を拡充
function getCollectibles_Market() {
  return [
    { type: "coin", x: 5*TILE, y: 10*TILE },
    { type: "coin", x: 8*TILE, y: 10*TILE },
    { type: "coin", x: 12*TILE, y: 6*TILE },
    { type: "coin", x: 20*TILE, y: 10*TILE },
    { type: "connection", x: 28*TILE, y: 8*TILE },
    { type: "coin", x: 35*TILE, y: 10*TILE },
    { type: "coin", x: 42*TILE, y: 6*TILE },
    { type: "coin", x: 45*TILE, y: 7*TILE },
    { type: "connection", x: 52*TILE, y: 10*TILE },
    { type: "coin", x: 60*TILE, y: 6*TILE },
    { type: "coin", x: 65*TILE, y: 10*TILE },
    { type: "connection", x: 70*TILE, y: 8*TILE },
    { type: "connection", x: 75*TILE, y: 10*TILE },
    { type: "coin", x: 80*TILE, y: 10*TILE },
    { type: "coin", x: 85*TILE, y: 7*TILE },
    { type: "connection", x: 95*TILE, y: 6*TILE },
    { type: "coin", x: 100*TILE, y: 10*TILE },
  ];
}

function getCollectibles_Office() {
  return [
    { type: "coin", x: 3*TILE, y: 10*TILE },
    { type: "coin", x: 5*TILE, y: 10*TILE },
    { type: "coin", x: 8*TILE, y: 10*TILE },
    { type: "connection", x: 18*TILE, y: 7*TILE },
    { type: "coin", x: 22*TILE, y: 10*TILE },
    { type: "coin", x: 30*TILE, y: 10*TILE },
    { type: "coin", x: 35*TILE, y: 5*TILE },
    { type: "connection", x: 40*TILE, y: 10*TILE },
    { type: "connection", x: 50*TILE, y: 7*TILE },
    { type: "coin", x: 55*TILE, y: 10*TILE },
    { type: "coin", x: 58*TILE, y: 10*TILE },
    { type: "coin", x: 65*TILE, y: 10*TILE },
    { type: "coin", x: 70*TILE, y: 6*TILE },
    { type: "connection", x: 75*TILE, y: 10*TILE },
    { type: "connection", x: 80*TILE, y: 7*TILE },
    { type: "coin", x: 85*TILE, y: 10*TILE },
  ];
}

function getCollectibles_Port() {
  return [
    { type: "coin", x: 3*TILE, y: 10*TILE },
    { type: "coin", x: 6*TILE, y: 10*TILE },
    { type: "coin", x: 10*TILE, y: 10*TILE },
    { type: "coin", x: 15*TILE, y: 10*TILE },
    { type: "connection", x: 20*TILE, y: 8*TILE },
    { type: "connection", x: 22*TILE, y: 8*TILE },
    { type: "coin", x: 28*TILE, y: 10*TILE },
    { type: "coin", x: 35*TILE, y: 10*TILE },
    { type: "coin", x: 38*TILE, y: 7*TILE },
    { type: "connection", x: 48*TILE, y: 10*TILE },
    { type: "coin", x: 53*TILE, y: 10*TILE },
    { type: "coin", x: 58*TILE, y: 8*TILE },
    { type: "connection", x: 62*TILE, y: 10*TILE },
    { type: "coin", x: 70*TILE, y: 10*TILE },
    { type: "coin", x: 75*TILE, y: 7*TILE },
    { type: "connection", x: 78*TILE, y: 7*TILE },
    { type: "connection", x: 82*TILE, y: 10*TILE },
  ];
}

const STAGES = [
  {
    id: "market",
    title: "国際展示会：アイテム収集チャレンジ",
    palette: { sky:"#1a2535", far:"#1f3045", mid:"#2a4055", ground:"#4a6a7a", accent:"#f0d090" },
    intro: [
      "商社マン・鈴木拓海。入社3年目、初の海外案件を任された。",
      "展示会場でコイン💰と人脈👤を集めよう！",
      "?ブロックを下から叩くとアイテムが出る！",
      "敵は踏み付けて倒せ！【ボス】を3回踏んでステージクリアだ！"
    ],
    map: makeStageMap_Market(),
    collectibles: getCollectibles_Market(),
    enemySpawns: [
      { x: 22*TILE, y: 8*TILE, type:"competitor" },
      { x: 44*TILE, y: 8*TILE, type:"competitor" },
      { x: 56*TILE, y: 7*TILE, type:"buyer" },
      { x: 63*TILE, y: 7*TILE, type:"buyer" },
      { x: 88*TILE, y: 8*TILE, type:"competitor" },
    ],
    bossSpawn: { x: 102*TILE, y: 8*TILE, type:"boss_market" },
    npcNotes: [
      "敵を踏み付けるとアイテムをドロップする！",
      "?ブロックを叩いてパワーアップをゲットしよう！"
    ],
  },
  {
    id: "office",
    title: "本社ビル：パワーアップを使いこなせ",
    palette: { sky:"#0d1520", far:"#152030", mid:"#1a2840", ground:"#3a4a5a", accent:"#90c0f0" },
    intro: [
      "展示会での成功を受け、本社ビルへ乗り込む！",
      "ブローカーを倒すとパワーアップがドロップする！",
      "スピードアップ⚡やジャンプ強化🦘を活用しよう！",
      "【ボス】CEOを3回踏み付けて契約を勝ち取れ！"
    ],
    map: makeStageMap_Office(),
    collectibles: getCollectibles_Office(),
    enemySpawns: [
      { x: 18*TILE, y: 7*TILE, type:"broker" },
      { x: 37*TILE, y: 6*TILE, type:"broker" },
      { x: 50*TILE, y: 7*TILE, type:"gatekeeper" },
      { x: 55*TILE, y: 7*TILE, type:"executive" },
      { x: 73*TILE, y: 7*TILE, type:"broker" },
    ],
    bossSpawn: { x: 87*TILE, y: 7*TILE, type:"boss_office" },
    npcNotes: [
      "ブローカーからはパワーアップがドロップ！",
      "無敵⭐状態では敵に触れても倒せる！"
    ],
  },
  {
    id: "port",
    title: "港湾物流：最終ステージ",
    palette: { sky:"#101820", far:"#152535", mid:"#1a3040", ground:"#2a4050", accent:"#70b0d0" },
    intro: [
      "契約は成立した。あとは物流を完了させるだけ！",
      "メディア記者には注意！踏み付けができない！",
      "アイテム吸引🧲スキルでコインを一気に集めよう！",
      "【ボス】通関局長を倒して輸出を完了させろ！"
    ],
    map: makeStageMap_Port(),
    collectibles: getCollectibles_Port(),
    enemySpawns: [
      { x: 20*TILE, y: 8*TILE, type:"union" },
      { x: 36*TILE, y: 7*TILE, type:"gatekeeper" },
      { x: 40*TILE, y: 8*TILE, type:"government" },
      { x: 58*TILE, y: 8*TILE, type:"media" },
      { x: 71*TILE, y: 7*TILE, type:"gatekeeper" },
      { x: 76*TILE, y: 8*TILE, type:"government" },
    ],
    bossSpawn: { x: 82*TILE, y: 7*TILE, type:"boss_port" },
    npcNotes: [
      "官僚からはパワーアップがドロップ！",
      "メディア記者は踏めない！避けて進もう！"
    ],
  }
];
