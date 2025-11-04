let size = 1800;
let node_color = "black";
let edge_color = "black";

let center = size / 2;
let radius = size / 4;
const node_size = 40;
const edge_size = 40;
let count = 8;

let canvas;
let currentLetter = "";
let currentMatrix;

let rotationAngle = 0;
let rotationSpeed = 0;
let isSpinning = false;

let nodeOffsets = [];    
let targetOffsets = []; 
let scatterStd = radius / 15; 
let lerpSpeed = 0.1;

function toBinary(char) {
  const code = char.charCodeAt(0);
  return code.toString(2).padStart(count, "0");
}

function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function addMatrices(a, b) {
  return a.map((row, i) =>
    row.map((val, j) => val + b[i][j])
  );
}

function bin_to_mat(binary) {
  const bin_array = binary.split('').map(bit => parseInt(bit));
  const binary_stack = Array(count).fill().map(() => [...bin_array]);
  const transposed = transpose(binary_stack);
  const added = addMatrices(binary_stack, transposed);
  return added;
}

function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function setup() {
  canvas = createCanvas(size, size);
  canvas.parent("graphed");
  frameRate(60);

  const initialBin = toBinary("A");
  currentMatrix = bin_to_mat(initialBin);
  currentLetter = "A";

  for (let i = 0; i < count; i++) {
    nodeOffsets[i] = { x: 0, y: 0 };
    targetOffsets[i] = { x: 0, y: 0 };
  }
}

function draw() {
  clear();
  background(0, 0);
  translate(center, center);
  rotate(rotationAngle);

  const spacing = TWO_PI / count;

  let nodePositions = [];
  for (let i = 0; i < count; i++) {
    nodeOffsets[i].x = lerp(nodeOffsets[i].x, targetOffsets[i].x, lerpSpeed);
    nodeOffsets[i].y = lerp(nodeOffsets[i].y, targetOffsets[i].y, lerpSpeed);

    const baseX = radius * cos(spacing * i);
    const baseY = radius * sin(spacing * i);
    nodePositions[i] = {
      x: baseX + nodeOffsets[i].x,
      y: baseY + nodeOffsets[i].y
    };
  }

  stroke(edge_color);
  strokeWeight(edge_size);
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < i; j++) {
      if (currentMatrix[i][j] > 0 && currentMatrix[i][j] < 2) {
        line(
          nodePositions[i].x, nodePositions[i].y,
          nodePositions[j].x, nodePositions[j].y
        );
      }
    }
  }

  noStroke();
  fill(node_color);
  for (let i = 0; i < count; i++) {
    circle(nodePositions[i].x, nodePositions[i].y, node_size);
  }
}

function updateGraph(word) {
  if (!word || word.length < 1) return;
  const letter = word[0].toUpperCase();
  const binary = toBinary(letter);
  currentMatrix = bin_to_mat(binary);
  currentLetter = letter;

  for (let i = 0; i < count; i++) {
    targetOffsets[i] = {
      x: gaussianRandom() * scatterStd,
      y: gaussianRandom() * scatterStd
    };
  }

}