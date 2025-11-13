// Global state
let canvas, ctx;
let currentTool = 'select';
let isDrawing = false;
let startX, startY;
let shapes = [];
let currentUser = {
    id: null,
    color: '#3498db'
};
let otherUsers = new Map();

// Yjs setup
const ydoc = new Y.Doc();
const wsProvider = new WebsocketProvider(
    `ws://${window.location.host}`,
    'drawing-room',
    ydoc
);
const yShapes = ydoc.getArray('shapes');

// WebSocket for cursor tracking
let ws;

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initTools();
    initWebSocket();
    initYjs();
    setupEventListeners();
});

function initCanvas() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');

    // Make canvas responsive to container
    const container = document.querySelector('.canvas-container');
    const rect = container.getBoundingClientRect();
}

function initTools() {
    const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toolButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            updateStatus(`Tool: ${currentTool}`);
        });
    });

    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
}

function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
            type: 'user-joined',
            name: `User ${Math.random().toString(36).substring(7)}`
        }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        } catch (e) {
            // Yjs sync message, ignore
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateStatus('Disconnected - Reconnecting...');
        setTimeout(initWebSocket, 2000);
    };
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'init':
            currentUser.id = data.userId;
            currentUser.color = data.color;
            document.getElementById('userId').textContent = `You: ${data.userId.slice(0, 8)}`;
            updateStatus('Connected');
            break;

        case 'cursor':
            updateOtherUserCursor(data.userId, data.cursor, data.color, data.name);
            break;

        case 'user-joined':
            if (data.user && data.user.id !== currentUser.id) {
                otherUsers.set(data.user.id, data.user);
                updateActiveUsersCount();
            }
            break;

        case 'user-left':
            removeUserCursor(data.userId);
            otherUsers.delete(data.userId);
            updateActiveUsersCount();
            break;

        case 'existing-users':
            data.users.forEach(user => {
                if (user.id !== currentUser.id) {
                    otherUsers.set(user.id, user);
                }
            });
            updateActiveUsersCount();
            break;
    }
}

function initYjs() {
    // Listen for remote changes
    yShapes.observe(event => {
        redrawCanvas();
    });

    // Load existing shapes
    shapes = yShapes.toArray();
    redrawCanvas();
}

function setupEventListeners() {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Track mouse movement for cursor sync
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'cursor',
                cursor: { x, y },
                color: currentUser.color
            }));
        }
    });
}

function handleMouseDown(e) {
    if (currentTool === 'select') return;

    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
}

function handleMouseMove(e) {
    if (!isDrawing || currentTool === 'select') return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Show preview
    redrawCanvas();
    drawPreview(currentX, currentY);
}

function handleMouseUp(e) {
    if (!isDrawing || currentTool === 'select') return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // Create shape
    const shape = createShape(startX, startY, endX, endY);
    if (shape) {
        // Add to Yjs array (will automatically sync to other clients)
        yShapes.push([shape]);
        shapes.push(shape);
        redrawCanvas();
    }

    isDrawing = false;
}

function createShape(x1, y1, x2, y2) {
    const fillColor = document.getElementById('fillColor').value;
    const strokeColor = document.getElementById('strokeColor').value;
    const strokeWidth = parseInt(document.getElementById('strokeWidth').value);

    const width = x2 - x1;
    const height = y2 - y1;

    if (Math.abs(width) < 2 || Math.abs(height) < 2) return null;

    const shape = {
        id: Date.now() + Math.random(),
        type: currentTool,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(width),
        height: Math.abs(height),
        fillColor,
        strokeColor,
        strokeWidth,
        userId: currentUser.id
    };

    // For square, make it a perfect square
    if (currentTool === 'square') {
        const size = Math.min(Math.abs(width), Math.abs(height));
        shape.width = size;
        shape.height = size;
    }

    return shape;
}

function drawPreview(x2, y2) {
    const fillColor = document.getElementById('fillColor').value;
    const strokeColor = document.getElementById('strokeColor').value;
    const strokeWidth = parseInt(document.getElementById('strokeWidth').value);

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.globalAlpha = 0.5;

    const width = x2 - startX;
    const height = y2 - startY;

    switch (currentTool) {
        case 'rectangle':
            ctx.fillRect(startX, startY, width, height);
            ctx.strokeRect(startX, startY, width, height);
            break;

        case 'square':
            const size = Math.min(Math.abs(width), Math.abs(height));
            const signX = width >= 0 ? 1 : -1;
            const signY = height >= 0 ? 1 : -1;
            ctx.fillRect(startX, startY, size * signX, size * signY);
            ctx.strokeRect(startX, startY, size * signX, size * signY);
            break;

        case 'circle':
            const radiusX = Math.abs(width) / 2;
            const radiusY = Math.abs(height) / 2;
            const centerX = startX + width / 2;
            const centerY = startY + height / 2;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            break;
    }

    ctx.globalAlpha = 1.0;
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach(shape => {
        drawShape(shape);
    });
}

function drawShape(shape) {
    ctx.fillStyle = shape.fillColor;
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;

    switch (shape.type) {
        case 'rectangle':
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            break;

        case 'square':
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            break;

        case 'circle':
            const radiusX = shape.width / 2;
            const radiusY = shape.height / 2;
            const centerX = shape.x + radiusX;
            const centerY = shape.y + radiusY;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            break;
    }
}

function clearCanvas() {
    if (confirm('Clear the entire canvas? This will affect all users.')) {
        // Clear Yjs array
        yShapes.delete(0, yShapes.length);
        shapes = [];
        redrawCanvas();
        updateStatus('Canvas cleared');
    }
}

function updateOtherUserCursor(userId, cursor, color, name) {
    let cursorElement = document.getElementById(`cursor-${userId}`);

    if (!cursorElement) {
        cursorElement = document.createElement('div');
        cursorElement.id = `cursor-${userId}`;
        cursorElement.className = 'cursor';
        cursorElement.style.color = color;
        cursorElement.innerHTML = `
            <div class="cursor-pointer"></div>
            <div class="cursor-label">${name || userId.slice(0, 6)}</div>
        `;
        document.getElementById('cursorsLayer').appendChild(cursorElement);
    }

    const rect = canvas.getBoundingClientRect();
    cursorElement.style.left = `${rect.left + cursor.x}px`;
    cursorElement.style.top = `${rect.top + cursor.y}px`;
}

function removeUserCursor(userId) {
    const cursorElement = document.getElementById(`cursor-${userId}`);
    if (cursorElement) {
        cursorElement.remove();
    }
}

function updateActiveUsersCount() {
    const count = otherUsers.size + 1; // +1 for current user
    document.getElementById('activeUsers').textContent = `Users: ${count}`;
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}
