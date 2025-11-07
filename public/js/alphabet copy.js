const colors = {
    black: "#0D0D0D",
    grey: "#D9D9D9",
    orange: "#FF6B35",
    purple: "#8377D1",
    green: "#4F772D"
};

const pieces = {
    "1,0,0,0": [{ flip: 1, rotation: 90 }, null, null, null],
    "0,1,0,0": [null, { flip: 1, rotation: 180 }, null, null],
    "0,0,1,0": [null, null, { flip: 1, rotation: 0 }, null],
    "0,0,0,1": [null, null, null, { flip: 1, rotation: -90 }],

    "0,1,1,1": [{ flip: -1, rotation: -90 }, null, null, null],
    "1,0,1,1": [null, { flip: -1, rotation: 0 }, null, null],
    "1,1,0,1": [null, null, { flip: -1, rotation: 180 }, null],
    "1,1,1,0": [null, null, null, { flip: -1, rotation: 90 }],

    "1,0,0,1": [null, { flip: -1, rotation: 0 }, { flip: -1, rotation: 180 }, null],
    "0,1,1,0": [{ flip: -1, rotation: -90 }, null, null, { flip: -1, rotation: 90 }],

    "1,1,0,0": [null, null, null, null],
    "1,0,1,0": [null, null, null, null],
    "0,0,1,1": [null, null, null, null],
    "0,1,0,1": [null, null, null, null],

    "1,1,1,1": [null, null, null, null],
    "0,0,0,0": [null, null, null, null]
};

const charToMatrix = c => {
    const bits = c.charCodeAt(0).toString(2).padStart(8, "0").split("").map(Number);
    const mat = bits.map(() => [...bits])
        .map((r, i, a) => r.map((v, j) => (v + a[j][i]) % 2));
    return mat.flatMap(r => {
        const d = r.flatMap(v => [v, v, v, v, v]);
        return [d, d, d, d, [...d]];
    });
};

const bezierMap = (size, radius, kernel, x, y, fillHex, strokeHex = "#0D0D0D", strokeWidth = 0.5) => {
    const key = kernel.flat().join(","), piece = pieces[key];
    if (!piece) return null;

    const ns = "http://www.w3.org/2000/svg", g = document.createElementNS(ns, "g");

    const bezier = (s, rFactor, rotDeg) => {
        const mx = s / 2, my = s / 2;
        const offset = (s / 2) * rFactor;
        const a = rotDeg * Math.PI / 180;
        const rot = (px, py) => {
            const dx = px - mx, dy = py - my;
            return [
                dx * Math.cos(a) - dy * Math.sin(a) + mx,
                dx * Math.sin(a) + dy * Math.cos(a) + my
            ];
        };
        const [cx, cy] = rot(mx + offset, my - offset);
        const [x1, y1] = rot(0, 0), [x2, y2] = rot(s, s), [x3, y3] = rot(0, s);
        const p = document.createElementNS(ns, "path");
        p.setAttribute("d", `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2} L${x3} ${y3} Z`);
        p.setAttribute("fill", fillHex);
        if (strokeHex) {
            p.setAttribute("stroke", strokeHex);
            p.setAttribute("stroke-width", strokeWidth);
        }
        return p;
    };

    for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++)
            if (piece[i * 2 + j]) {
                const path = bezier(size, radius * piece[i * 2 + j].flip, piece[i * 2 + j].rotation);
                path.setAttribute("transform", `translate(${j * size},${i * size})`);
                g.appendChild(path);
            }

    g.setAttribute("transform", `translate(${x},${y})`);
    return g;
};

// MATRIX RENDER WITH BACKGROUND COLOR
function render(char, size = 10, radius = 1, colorName = "black", backgroundName = "grey", stroke = "#000000FF", strokeWidth = 0.5, buffer = 2) {
    const hex = colors[colorName] || colorName;
    const bgHex = colors[backgroundName] || backgroundName;
    const ns = "http://www.w3.org/2000/svg";
    const mat = charToMatrix(char);

    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[i].length; j++) {
            if (mat[i][j]) {
                if (i < minRow) minRow = i;
                if (i > maxRow) maxRow = i;
                if (j < minCol) minCol = j;
                if (j > maxCol) maxCol = j;
            }
        }
    }
    if (minRow === Infinity) {
        minRow = 0; maxRow = 0; minCol = 0; maxCol = 0;
    }

    minRow = Math.max(0, minRow - buffer);
    minCol = Math.max(0, minCol - buffer);
    maxRow = Math.min(mat.length - 1, maxRow + buffer);
    maxCol = Math.min(mat[0].length - 1, maxCol + buffer);

    const w = (maxCol - minCol + 1) * size;
    const h = (maxRow - minRow + 1) * size;

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);

    // background rectangle
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("x", 0);
    bg.setAttribute("y", 0);
    bg.setAttribute("width", w);
    bg.setAttribute("height", h);
    bg.setAttribute("fill", bgHex);
    svg.appendChild(bg);

    const covered = mat.map(r => r.map(() => false));

    for (let i = minRow; i < maxRow; i++)
        for (let j = minCol; j < maxCol; j++) {
            const k = [[mat[i][j] || 0, mat[i][j + 1] || 0], [mat[i + 1]?.[j] || 0, mat[i + 1]?.[j + 1] || 0]];
            const g = bezierMap(size, radius, k, (j - minCol) * size, (i - minRow) * size, hex, hex, strokeWidth);
            if (g) {
                svg.appendChild(g);
                const piece = pieces[k.flat().join(",")];
                if (piece) for (let di = 0; di < 2; di++) for (let dj = 0; dj < 2; dj++) if (piece[di * 2 + dj]) covered[i + di][j + dj] = true;
            }
        }

    for (let i = minRow; i <= maxRow; i++)
        for (let j = minCol; j <= maxCol; j++)
            if (mat[i][j] && !covered[i][j]) {
                const r = document.createElementNS(ns, "rect");
                r.setAttribute("x", (j - minCol) * size);
                r.setAttribute("y", (i - minRow) * size);
                r.setAttribute("width", size);
                r.setAttribute("height", size);
                r.setAttribute("fill", hex);
                if (stroke) {
                    r.setAttribute("stroke", hex);
                    r.setAttribute("stroke-width", strokeWidth);
                }
                svg.appendChild(r);
            }

    return svg;
};

window.addEventListener("load", () => {
    const things = document.querySelectorAll("div.adj");
    things.forEach(d => {
        const svg = render(
            d.textContent,
            parseInt(d.getAttribute("data-size")) || 2.25,
            parseFloat(d.getAttribute("data-radius")) || 1,
            d.getAttribute("data-color") || "black",
            d.getAttribute("data-bg") || "grey"
        );

        d.innerHTML = "";
        d.appendChild(svg);
    });
});

// ---- GRAPH RENDER UNCHANGED ----

const unstackedCharToMatrix = (c) => {
    const bits = c.charCodeAt(0).toString(2).padStart(8, "0").split("").map(Number);
    const mat = bits.map(() => [...bits])
        .map((r, i, a) => r.map((v, j) => (v + a[j][i]) % 2));
    return mat;
};

const generatePositions = (n, cx, cy, radius) => {
    const positions = [];
    for (let i = 0; i < n; i++) {
        const angle = 2 * Math.PI * i / n - Math.PI / 2;
        positions.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    return positions;
};

function render(char, size = 10, radius = 1, colorName = "black", backgroundName = "grey", stroke = "#000000FF", strokeWidth = 2, buffer = 5) {
    const hex = colors[colorName] || colorName;
    const bgHex = colors[backgroundName] || backgroundName;
    const ns = "http://www.w3.org/2000/svg";
    const mat = charToMatrix(char);

    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[i].length; j++) {
            if (mat[i][j]) {
                if (i < minRow) minRow = i;
                if (i > maxRow) maxRow = i;
                if (j < minCol) minCol = j;
                if (j > maxCol) maxCol = j;
            }
        }
    }
    if (minRow === Infinity) {
        minRow = 0; maxRow = 0; minCol = 0; maxCol = 0;
    }

    // Add buffer
    minRow = Math.max(-5, minRow - buffer);
    minCol = Math.max(-5, minCol - buffer);
    maxRow = Math.min(mat.length + 5, maxRow + buffer);
    maxCol = Math.min(mat[0].length + 5, maxCol + buffer);

    const w = (maxCol - minCol + 1) * size;
    const h = (maxRow - minRow + 1) * size;

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);

    // background rectangle
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("x", 0);
    bg.setAttribute("y", 0);
    bg.setAttribute("width", w);
    bg.setAttribute("height", h);
    bg.setAttribute("fill", bgHex);
    svg.appendChild(bg);

    const covered = mat.map(r => r.map(() => false));

    for (let i = minRow; i <= maxRow; i++) {
        for (let j = minCol; j <= maxCol; j++) {
            const k = [
                [mat[i]?.[j] || 0, mat[i]?.[j + 1] || 0],
                [mat[i + 1]?.[j] || 0, mat[i + 1]?.[j + 1] || 0]
            ];
            const g = bezierMap(size, radius, k, (j - minCol) * size, (i - minRow) * size, hex, hex, strokeWidth);
            if (g) {
                svg.appendChild(g);
                const piece = pieces[k.flat().join(",")];
                if (piece) for (let di = 0; di < 2; di++) for (let dj = 0; dj < 2; dj++) if (piece[di * 2 + dj]) covered[i + di][j + dj] = true;
            }
        }
    }

    // fallback squares
    for (let i = minRow; i <= maxRow; i++)
        for (let j = minCol; j <= maxCol; j++)
            if (mat[i]?.[j] && !covered[i][j]) {
                const r = document.createElementNS(ns, "rect");
                r.setAttribute("x", (j - minCol) * size);
                r.setAttribute("y", (i - minRow) * size);
                r.setAttribute("width", size);
                r.setAttribute("height", size);
                r.setAttribute("fill", hex);
                if (stroke) {
                    r.setAttribute("stroke", hex);
                    r.setAttribute("stroke-width", strokeWidth);
                }
                svg.appendChild(r);
            }

    return svg;
}
function renderGraph(char, colorName = "black", node_r = 5, edge_r = 5, size = 200, backgroundName = "grey") {
    const hex = colors[colorName] || colorName;
    const bgHex = colors[backgroundName] || backgroundName;
    const ns = "http://www.w3.org/2000/svg";
    const mat = unstackedCharToMatrix(char);
    const n = mat.length;
    const svg = document.createElementNS(ns, "svg");

    svg.setAttribute("width", size);
    svg.setAttribute("height", size);

    // background rectangle
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("x", 0);
    bg.setAttribute("y", 0);
    bg.setAttribute("width", size);
    bg.setAttribute("height", size);
    bg.setAttribute("fill", bgHex);
    svg.appendChild(bg);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - edge_r * node_r;
    const positions = generatePositions(n, cx, cy, radius);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    positions.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });

    const offsetX = cx - (minX + maxX) / 2;
    const offsetY = cy - (minY + maxY) / 2;

    // draw edges
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (mat[i][j]) {
                const [x1, y1] = positions[i];
                const [x2, y2] = positions[j];
                const line = document.createElementNS(ns, "line");
                line.setAttribute("x1", x1 + offsetX);
                line.setAttribute("y1", y1 + offsetY);
                line.setAttribute("x2", x2 + offsetX);
                line.setAttribute("y2", y2 + offsetY);
                line.setAttribute("stroke", hex);
                line.setAttribute("stroke-width", Math.max(1, edge_r * size / 200));
                svg.appendChild(line);
            }
        }
    }

    // draw nodes
    positions.forEach(([x, y]) => {
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", x + offsetX);
        circle.setAttribute("cy", y + offsetY);
        circle.setAttribute("r", node_r * size / 200);
        circle.setAttribute("fill", hex);
        svg.appendChild(circle);
    });

    return svg;
}

// window.addEventListener("load", () => {
//     const glyphs = document.querySelectorAll("div.glyph");

//     glyphs.forEach(d => {
//         const char = d.textContent.trim().charAt(0) || "A";
//         const type = d.getAttribute("data-type") || "adj"; // default to matrix/adj
//         const color = d.getAttribute("data-color") || "black";
//         const bg = d.getAttribute("data-bg") || "grey";
//         const radius = parseFloat(d.getAttribute("data-radius")) || 1;
//         const node = parseInt(d.getAttribute("data-node")) || 3;
//         const edge = parseInt(d.getAttribute("data-edge")) || 6;

//         // Render at a base resolution
//         const baseSize = 10;
//         let svg;
//         if (type === "graph") {
//             svg = renderGraph(char, color, node, edge, baseSize * 20, bg);
//         } else {
//             svg = render(char, baseSize, radius, color, bg);
//         }

//         // Append temporarily to measure
//         d.innerHTML = "";
//         d.appendChild(svg);

//         // Fit to parent div size
//         const parentRect = d.getBoundingClientRect();
//         const svgRect = svg.getBBox();

//         svg.setAttribute("viewBox", `${svgRect.x} ${svgRect.y} ${svgRect.width} ${svgRect.height}`);
//         svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
//         svg.style.width = "100%";
//         svg.style.height = "100%";
//         svg.style.display = "block";

   
//     });
// });

function renderAllGlyphs(scope = document) {
  const glyphs = scope.querySelectorAll("div.glyph");

  glyphs.forEach(d => {
    const char = d.getAttribute("data-char")?.trim().charAt(0) || "A";
    const type = d.getAttribute("data-type") || "adj";
    const color = d.getAttribute("data-color") || "black";
    const bg = d.getAttribute("data-bg") || "grey";
    const radius = parseFloat(d.getAttribute("data-radius")) || 1;
    const node = parseInt(d.getAttribute("data-node")) || 3;
    const edge = parseInt(d.getAttribute("data-edge")) || 6;

    const baseSize = 10;
    let svg;

    if (type === "graph") {
      svg = renderGraph(char, color, node, edge, baseSize * 20, bg);
    } else {
      svg = render(char, baseSize, radius, color, bg);
    }

    d.innerHTML = "";
    d.appendChild(svg);

    const svgRect = svg.getBBox();
    svg.setAttribute("viewBox", `${svgRect.x} ${svgRect.y} ${svgRect.width} ${svgRect.height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";

    // Mark as rendered so we don’t double-render
    // d.dataset.rendered = "true";
  });
}

// Run once when the page is fully loaded
window.addEventListener("load", () => renderAllGlyphs());