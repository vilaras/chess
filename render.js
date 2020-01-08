const W = 600, H = 600;
const BLOCK_W = W / COLS, 
      BLOCK_H = H / ROWS;

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset');
const clearButton = document.getElementById('clear');

let lastPiece = EM, lastIcon;
let dragok = false;
let lastMove = {
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0 
};

const WPIcon = new Image(),
BPIcon = new Image(),
WNIcon = new Image(),
BNIcon = new Image(),
WBIcon = new Image(),
BBIcon = new Image(),
WQIcon = new Image(),
BQIcon = new Image(),
WKIcon = new Image(),
BKIcon = new Image(),
WRIcon = new Image(),
BRIcon = new Image();

WPIcon.src = 'images/Chess_plt45.svg';
BPIcon.src = 'images/Chess_pdt45.svg';
WNIcon.src = 'images/Chess_nlt45.svg';
BNIcon.src = 'images/Chess_ndt45.svg';
WBIcon.src = 'images/Chess_blt45.svg';
BBIcon.src = 'images/Chess_bdt45.svg';
WQIcon.src = 'images/Chess_qlt45.svg';
BQIcon.src = 'images/Chess_qdt45.svg';
WKIcon.src = 'images/Chess_klt45.svg';
BKIcon.src = 'images/Chess_kdt45.svg';
WRIcon.src = 'images/Chess_rlt45.svg';
BRIcon.src = 'images/Chess_rdt45.svg';

const iconSelector = {
    "whitepawn": WPIcon,
    "whiterook": WRIcon,
    "whiteknight": WNIcon,
    "whitebishop": WBIcon,
    "whitequeen": WQIcon,
    "whiteking": WKIcon,
    "blackpawn": BPIcon,
    "blackrook": BRIcon,
    "blackknight": BNIcon,
    "blackbishop": BBIcon,
    "blackqueen": BQIcon,
    "blackking": BKIcon
};

function modelToView(x, y) {
    return {
        x: x * BLOCK_W, 
        y: y * BLOCK_H
    };
}

function viewToModel(x, y) {
    return {
        x: Math.floor(x / BLOCK_W), 
        y: Math.floor(y / BLOCK_H)
    };
}


function selectIcon(x, y) {
    return iconSelector[board[y][x].color + board[y][x].piece];
}

function renderPiece(x, y) {
    let viewCoords = modelToView(x, y);
    
    pieceIcon = selectIcon(x, y);
    ctx.drawImage(pieceIcon, viewCoords.x, viewCoords.y, BLOCK_W, BLOCK_H);
}

function renderBlock(x, y) {
    viewCoords = modelToView(x, y);

    ctx.strokeStyle = 'black';
    if ((x + y) % 2){
        ctx.fillStyle = '#994d00';
    } else { 
        ctx.fillStyle = '#ffe066';
    }

    ctx.fillRect(viewCoords.x, viewCoords.y, BLOCK_W, BLOCK_H);
    ctx.strokeRect(viewCoords.x, viewCoords.y, BLOCK_W, BLOCK_H);

    if(board[y][x] != EM) {
        renderPiece(x, y);
    }
}

function render() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            renderBlock(x, y);
        }
    }
}

function mouseDown(x, y) {
    modelCoords = viewToModel(x, y);

    dragok = true;
    canvas.onmousemove = mouseMove;

    lastPiece = board[modelCoords.y][modelCoords.x];
    lastIcon = selectIcon(modelCoords.x, modelCoords.y);
    board[modelCoords.y][modelCoords.x] = EM;
}


function mouseMove(){
    if (dragok){
        x = event.pageX - canvas.offsetLeft - BLOCK_H / 2; 
        y = event.pageY - canvas.offsetTop - BLOCK_W / 2; 

        render();
        ctx.drawImage(lastIcon, x, y, BLOCK_W, BLOCK_H);
    }
}

function mouseUp(x, y) {
    dragok = false;
    canvas.onmousemove = null;

    const modelCoords = viewToModel(x, y);

    board[modelCoords.y][modelCoords.x] = lastPiece;
    render();
}


BRIcon.onload = function () {
    render();
}