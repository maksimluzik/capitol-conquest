import test from 'node:test';
import assert from 'node:assert/strict';

import { GameManager } from '../src/GameManager.js';

function createHex({ piece = null, blocked = false } = {}) {
  return { data: { values: { piece, blocked } } };
}

function createBoard(hexEntries) {
  const map = new Map();
  hexEntries.forEach(([key, piece, blocked]) => {
    map.set(key, createHex({ piece, blocked }));
  });
  return {
    hexMap: map,
    forEachHex(cb) { map.forEach(cb); }
  };
}

test('boardFull detects all playable hexes occupied', () => {
  const board = createBoard([
    ['0,0', {} , false]
  ]);
  const ui = {};
  const scene = { add: { layer: () => ({}) } };
  const gm = new GameManager(board, ui, scene);
  assert.equal(gm.boardFull(), true);
});

test('boardFull detects remaining empty hexes', () => {
  const board = createBoard([
    ['0,0', {} , false],
    ['0,1', null, false]
  ]);
  const ui = {};
  const scene = { add: { layer: () => ({}) } };
  const gm = new GameManager(board, ui, scene);
  assert.equal(gm.boardFull(), false);
});

test('getWinner returns player with higher score', () => {
  const board = createBoard([]);
  const ui = {};
  const scene = { add: { layer: () => ({}) } };
  const gm = new GameManager(board, ui, scene);
  gm.players[1].score = 5;
  gm.players[2].score = 3;
  assert.equal(gm.getWinner().id, 1);
});
