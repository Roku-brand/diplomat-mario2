/**
 * Stage data and map generators
 */

function rect(map, x, y, w, v) {
  for (let i=0;i<w;i++) map[y][x+i]=v;
}

// Tile types:
// 0 = empty, 1 = solid ground, 2 = hazard, 3 = goal, 4 = breakable, 5 = negotiation gate

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

  // hazards: 競合エリア（入ると信頼が下がる）
  for (let x=34; x<=38; x++) m[11][x] = 2;
  for (let x=73; x<=78; x++) m[11][x] = 2;

  // 交渉ゲート（交渉しないと進めない壁）- tile type 5
  m[10][55] = 5;
  m[11][55] = 5;

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

  // 古いオフィスの床（壊れやすい）
  for (let x=34; x<=37; x++) m[6][x] = 4;

  // 監視ゾーン（コンプライアンス監査エリア）
  for (let x=27; x<=31; x++) m[11][x] = 2;
  for (let x=52; x<=56; x++) m[11][x] = 2;

  // 交渉ゲート
  m[10][42] = 5;
  m[11][42] = 5;

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

  // 税関エリア（監視ゾーン）
  for (let x=41; x<=46; x++) m[11][x] = 2;

  // 交渉ゲート（税関ゲート）
  m[10][35] = 5;
  m[11][35] = 5;
  m[10][70] = 5;
  m[11][70] = 5;

  // goal: 輸出ゲート
  m[11][87] = 3; m[10][87] = 3;
  return m;
}

// コレクティブル（コインと人脈ポイント）の配置を定義
function getCollectibles_Market() {
  return [
    { type: "coin", x: 8*TILE, y: 10*TILE },
    { type: "coin", x: 20*TILE, y: 10*TILE },
    { type: "connection", x: 28*TILE, y: 8*TILE },
    { type: "coin", x: 45*TILE, y: 7*TILE },
    { type: "coin", x: 60*TILE, y: 6*TILE },
    { type: "connection", x: 75*TILE, y: 10*TILE },
    { type: "coin", x: 85*TILE, y: 7*TILE },
    { type: "connection", x: 95*TILE, y: 6*TILE },
  ];
}

function getCollectibles_Office() {
  return [
    { type: "coin", x: 5*TILE, y: 10*TILE },
    { type: "connection", x: 18*TILE, y: 7*TILE },
    { type: "coin", x: 35*TILE, y: 5*TILE },
    { type: "connection", x: 50*TILE, y: 7*TILE },
    { type: "coin", x: 65*TILE, y: 10*TILE },
    { type: "coin", x: 70*TILE, y: 6*TILE },
    { type: "connection", x: 80*TILE, y: 7*TILE },
  ];
}

function getCollectibles_Port() {
  return [
    { type: "coin", x: 6*TILE, y: 10*TILE },
    { type: "coin", x: 15*TILE, y: 10*TILE },
    { type: "connection", x: 22*TILE, y: 8*TILE },
    { type: "coin", x: 38*TILE, y: 7*TILE },
    { type: "connection", x: 48*TILE, y: 10*TILE },
    { type: "coin", x: 58*TILE, y: 8*TILE },
    { type: "coin", x: 75*TILE, y: 7*TILE },
    { type: "connection", x: 82*TILE, y: 10*TILE },
  ];
}

const STAGES = [
  {
    id: "market",
    title: "国際展示会：初めての大型案件",
    palette: { sky:"#1a2535", far:"#1f3045", mid:"#2a4055", ground:"#4a6a7a", accent:"#f0d090" },
    intro: [
      "商社マン・鈴木拓海。入社3年目、初の海外案件を任された。",
      "国際展示会で新規顧客を開拓し、契約を取り付けろ。",
      "競合も狙っている。お金💰と人脈👤を集めて、有利な交渉を！",
      "【ボス】海外バイヤー長との大型契約がゴールだ。"
    ],
    map: makeStageMap_Market(),
    collectibles: getCollectibles_Market(),
    enemySpawns: [
      { x: 22*TILE, y: 8*TILE, type:"competitor" },
      { x: 44*TILE, y: 8*TILE, type:"competitor" },
      { x: 56*TILE, y: 7*TILE, type:"gatekeeper" }, // 交渉必須ゲート
      { x: 63*TILE, y: 7*TILE, type:"buyer" },
      { x: 88*TILE, y: 8*TILE, type:"competitor" },
    ],
    bossSpawn: { x: 102*TILE, y: 8*TILE, type:"boss_market" }, // ステージボス
    npcNotes: [
      "競合は『先行優位』を主張する。価格か独自性で勝負。",
      "バイヤーは『実績』と『コスト』を重視。具体的な数字を準備せよ。"
    ],
  },
  {
    id: "office",
    title: "本社ビル：重役との交渉",
    palette: { sky:"#0d1520", far:"#152030", mid:"#1a2840", ground:"#3a4a5a", accent:"#90c0f0" },
    intro: [
      "展示会での成功を受け、大企業との本格交渉が始まった。",
      "本社ビルで重役と直接対話。ここで失敗すれば全てが水の泡。",
      "ブローカーの誘惑に注意。人脈を活用して信頼を勝ち取れ！",
      "【ボス】CEOとの最終合意を取り付けろ。"
    ],
    map: makeStageMap_Office(),
    collectibles: getCollectibles_Office(),
    enemySpawns: [
      { x: 18*TILE, y: 7*TILE, type:"broker" },
      { x: 37*TILE, y: 6*TILE, type:"broker" },
      { x: 43*TILE, y: 7*TILE, type:"gatekeeper" }, // 交渉必須ゲート
      { x: 55*TILE, y: 7*TILE, type:"executive" },
      { x: 73*TILE, y: 7*TILE, type:"broker" },
    ],
    bossSpawn: { x: 87*TILE, y: 7*TILE, type:"boss_office" }, // ステージボス
    npcNotes: [
      "ブローカーは手数料目当て。直接ルートの方が利益率が高い。",
      "重役は数字と論理で動く。感情論は逆効果。"
    ],
  },
  {
    id: "port",
    title: "港湾物流：輸出入の難関",
    palette: { sky:"#101820", far:"#152535", mid:"#1a3040", ground:"#2a4050", accent:"#70b0d0" },
    intro: [
      "契約は成立した。だが、物流が止まれば意味がない。",
      "港湾で労働組合と政府官僚の壁が立ちはだかる。",
      "お金だけでは解決しない。人脈と誠意で道を切り開け！",
      "【ボス】通関局長の最終承認を得て、輸出を完了させろ。"
    ],
    map: makeStageMap_Port(),
    collectibles: getCollectibles_Port(),
    enemySpawns: [
      { x: 20*TILE, y: 8*TILE, type:"union" },
      { x: 36*TILE, y: 7*TILE, type:"gatekeeper" }, // 税関ゲート
      { x: 40*TILE, y: 8*TILE, type:"government" },
      { x: 58*TILE, y: 8*TILE, type:"media" }, // 交渉不可
      { x: 71*TILE, y: 7*TILE, type:"gatekeeper" }, // 最終ゲート
      { x: 76*TILE, y: 8*TILE, type:"government" },
    ],
    bossSpawn: { x: 82*TILE, y: 7*TILE, type:"boss_port" }, // ステージボス
    npcNotes: [
      "官僚は『手続き』と『書類』で動く。正規ルートを示せ。",
      "メディア記者は交渉不可。スキャンダルを避けてルート設計を。"
    ],
  }
];
