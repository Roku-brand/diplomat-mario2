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
