const ROWS = 8,
  COLS = 8;
const WP = { color: "white", type: "pawn" },
  WR = { color: "white", type: "rook" },
  WN = { color: "white", type: "knight" },
  WB = { color: "white", type: "bishop" },
  WQ = { color: "white", type: "queen" },
  WK = { color: "white", type: "king" };

const BP = { color: "black", type: "pawn" },
  BR = { color: "black", type: "rook" },
  BN = { color: "black", type: "knight" },
  BB = { color: "black", type: "bishop" },
  BQ = { color: "black", type: "queen" },
  BK = { color: "black", type: "king" };

const EM = { color: "empty", type: "empty" };

let oldBoard = [];
let turn = "white";
let playing = true;
let superMode = false;
let moveNumber = 1;
let halfMoves = 0;
let board = [];
let positions = {
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": 1,
};
let whiteCanShortCastle = true,
  blackCanShortCastle = true;
let whiteCanLongCastle = true,
  blackCanLongCastle = true;
let epSquare = {
  x: -1,
  y: -1,
};
let whiteKingPos = {
  x: 4,
  y: 7,
};
let blackKingPos = {
  x: 4,
  y: 0,
};
let lastMove = {
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  piece: EM,
  isCapture: false,
  isShortCastle: false,
  isLongCastle: false,
  isPromotion: false,
  isCheck: false,
  isCheckMate: false,
  isStaleMate: false,
  drawRule: false,
};

function oppositeTurn(_turn) {
  if (_turn == "white") return "black";

  return "white";
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS;
}

function resetPosition() {
  init();
  resetScoresheet();
  resetPgn();
  render();
}

function clearPosition() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      board[y][x] = EM;
    }
  }

  resetScoresheet();
  resetPgn();
  render();
}

//  tries to commit the move to check if it's legal,
//  without changing the global state variables
function pseudoCommitMove(fromX, fromY, toX, toY, myBoard) {
  let color = myBoard[fromY][fromX].color,
    _isEnPassant;

  if (isShortCastle(fromX, fromY, toX, toY, myBoard)) {
    if (myBoard[fromY][fromX].color == "white") {
      myBoard[7][7] = EM;
      myBoard[7][5] = WR;
    } else {
      myBoard[0][7] = EM;
      myBoard[0][5] = BR;
    }
  }

  if (isLongCastle(fromX, fromY, toX, toY, myBoard)) {
    if (myBoard[fromY][fromX].color == "white") {
      myBoard[7][0] = EM;
      myBoard[7][3] = WR;
    } else {
      myBoard[0][0] = EM;
      myBoard[0][3] = BR;
    }
  }

  _isEnPassant = isEnPassant(fromX, fromY, toX, toY, color, myBoard);

  if (_isEnPassant) {
    myBoard[lastMove.toY][lastMove.toX] = EM;
  }

  myBoard[toY][toX] = myBoard[fromY][fromX];
  myBoard[fromY][fromX] = EM;
}

function isCapture(fromX, fromY, toX, toY, myBoard) {
  return (
    myBoard[toY][toX].color != myBoard[fromY][fromX].color &&
    myBoard[toY][toX].color != "empty" &&
    myBoard[fromY][fromX].color != "empty"
  );
}

async function commitMove(fromX, fromY, toX, toY) {
  let color = board[fromY][fromX].color,
    _isEnPassant,
    _isPromotion,
    _isCheck;
  oldBoard = board.map((L) => L.slice());

  if (isShortCastle(fromX, fromY, toX, toY, board)) {
    if (color == "white") {
      board[7][7] = EM;
      board[7][5] = WR;
      lastMove.isShortCastle = true;
    } else {
      board[0][7] = EM;
      board[0][5] = BR;
      lastMove.isShortCastle = true;
    }
  } else {
    lastMove.isShortCastle = false;
  }

  if (isLongCastle(fromX, fromY, toX, toY, board)) {
    if (color == "white") {
      board[7][0] = EM;
      board[7][3] = WR;
      lastMove.isLongCastle = true;
    } else {
      board[0][0] = EM;
      board[0][3] = BR;
      lastMove.isLongCastle = true;
    }
  } else {
    lastMove.isLongCastle = false;
  }

  if (board[fromY][fromX].type == "king") {
    if (turn == "white") {
      whiteCanLongCastle = false;
      whiteCanShortCastle = false;
    } else {
      blackCanLongCastle = false;
      blackCanShortCastle = false;
    }
  }

  if (board[fromY][fromX].type == "pawn" && Math.abs(fromY - toY) == 2) {
    epSquare = {
      x: fromX,
      y: toY + (turn == "white" ? 1 : -1),
    };
  } else {
    epSquare = {
      x: -1,
      y: -1,
    };
  }

  _isEnPassant = isEnPassant(fromX, fromY, toX, toY, color, board);
  _isPromotion = isPromotion(fromX, fromY, toX, toY, color, board);
  _isCapture = isCapture(fromX, fromY, toX, toY, board);

  if (fromY == 0 && fromX == 0) blackCanLongCastle = false;
  else if (fromY == 0 && fromX == 7) blackCanShortCastle = false;
  else if (fromY == 7 && fromX == 0) whiteCanLongCastle = false;
  else if (fromY == 7 && fromX == 7) whiteCanShortCastle = false;

  if (board[fromY][fromX] == WK) {
    whiteCanLongCastle = false;
    whiteCanLongCastle = false;
    whiteKingPos.x = toX;
    whiteKingPos.y = toY;
  } else if (board[fromY][fromX] == BK) {
    blackCanLongCastle = false;
    blackCanShortCastle = false;
    blackKingPos.x = toX;
    blackKingPos.y = toY;
  }

  if (_isEnPassant) board[lastMove.toY][lastMove.toX] = EM;

  if (_isPromotion) {
    selection = await renderPromotionMenu(fromX, fromY);
    board[toY][toX] = selection;
  } else {
    board[toY][toX] = board[fromY][fromX];
  }

  lastMove.fromX = fromX;
  lastMove.fromY = fromY;
  lastMove.toX = toX;
  lastMove.toY = toY;
  lastMove.piece = board[fromY][fromX];
  lastMove.isCapture = _isCapture || _isEnPassant;
  lastMove.isEnPassant = _isEnPassant;
  lastMove.isPromotion = _isPromotion;
  lastMove.isCheck = _isCheck;

  board[fromY][fromX] = EM;

  let testBoard = board.map((L) => L.slice());
  _isCheck = inCheck(oppositeTurn(turn), testBoard);

  if (!hasMoves(oppositeTurn(turn), true, board)) {
    if (_isCheck) {
      lastMove.isCheckMate = true;
      Swal.fire({
        title: capitalizeFirstLetter(turn) + " won!",
        text: capitalizeFirstLetter(turn) + " won by checkmate",
        icon: "",
        confirmButtonText: "OK",
      });
    } else {
      lastMove.isStaleMate = true;
      Swal.fire({
        title: "Draw",
        text: "Game drawn by Stalemate",
        icon: "",
        confirmButtonText: "OK",
      });
    }

    playing = false;
  }

  if (lastMove.isCapture || lastMove.piece.type == "pawn") {
    halfMoves = 0;
  } else {
    halfMoves++;
  }

  if (halfMoves >= 100) {
    Swal.fire({
      title: "Draw",
      text: "Game drawn because of the 50 move rule",
      icon: "",
      confirmButtonText: "OK",
    });
    lastMove.drawRule = true;
    playing = false;
  }

  if (insuficientMaterial()) {
    Swal.fire({
      title: "Draw",
      text: "Game drawn because of insuficient material",
      icon: "",
      confirmButtonText: "OK",
    });
    lastMove.drawRule = true;
    playing = false;
  }

  if (threefoldRepetition()) {
    Swal.fire({
      title: "Draw",
      text: "Game drawn because of threefold repetition",
      icon: "",
      confirmButtonText: "OK",
    });
    lastMove.drawRule = true;
    playing = false;
  }

  renderScoresheet(lastMove, moveNumber);
  addToPgn(lastMove, moveNumber);

  turn = oppositeTurn(turn);

  if (turn == "white") {
    moveNumber++;
  }
}

function insuficientMaterial() {
  let whiteKnights = 0,
    blackKnights = 0,
    whiteBishops = 0,
    blackBishops = 0;

  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (whiteBishops >= 2 || blackBishops >= 2) {
        return false;
      } else if (whiteBishops == 1 && whiteKnights >= 1) {
        return false;
      } else if (blackBishops == 1 && blackKnights >= 1) {
        return false;
      } else {
        let piece = board[y][x];

        switch (piece.type) {
          case "empty":
            continue;

          case "king":
            continue;

          case "bishop":
            if (piece.color == "white") whiteBishops++;
            else blackBishops++;
            break;

          case "knight":
            if (piece.color == "white") whiteKnights++;
            else blackKnights++;
            break;

          default:
            return false;
        }
      }
    }
  }

  return true;
}

function threefoldRepetition() {
  let fen = generateFen().split(" ").slice(0, 4).join(" ");

  positions[fen] = fen in positions ? positions[fen] + 1 : 1;

  return positions[fen] >= 3;
}

// Hacky way to figure out direction, must change
function isBlocked(fromX, fromY, toX, toY, movement, myBoard) {
  let dx, dy;
  let tempY = fromY,
    tempX = fromX;
  let color = myBoard[fromY][fromX].color;

  switch (movement) {
    case "diagonal":
      (dx = 1 - 2 * (toX < fromX)), (dy = 1 - 2 * (toY < fromY));

      for (let i = 0; i < Math.abs(fromX - toX) - 1; ++i) {
        tempX += dx;
        tempY += dy;

        if (myBoard[tempY][tempX] != EM) return true;
      }

      return color == myBoard[toY][toX].color;

    case "straight":
      if (fromY != toY) {
        dy = 1 - 2 * (fromY > toY);

        for (let i = 0; i < Math.abs(fromY - toY) - 1; ++i) {
          tempY += dy;

          if (myBoard[tempY][tempX] != EM) return true;
        }

        return color == myBoard[toY][toX].color;
      } else {
        dx = 1 - 2 * (fromX > toX);

        for (let i = 0; i < Math.abs(fromX - toX) - 1; ++i) {
          tempX += dx;

          if (myBoard[tempY][tempX] != EM) return true;
        }

        return color == myBoard[toY][toX].color;
      }

    case "knight":
      return color == myBoard[toY][toX].color;

    case "unit":
      return color == myBoard[toY][toX].color;

    default:
      return false;
  }
}

function isInTurn(color) {
  return color == turn;
}

function isMoving(fromX, fromY, toX, toY) {
  return fromX != toX || fromY != toY;
}

function isDiagonalMove(fromX, fromY, toX, toY) {
  return Math.abs(fromX - toX) == Math.abs(fromY - toY);
}

function isStraightMove(fromX, fromY, toX, toY) {
  return fromX == toX || fromY == toY;
}

function isKnightMove(fromX, fromY, toX, toY) {
  return (
    (Math.abs(fromX - toX) == 2 && Math.abs(fromY - toY) == 1) ||
    (Math.abs(fromY - toY) == 2 && Math.abs(fromX - toX) == 1)
  );
}

function isKingMove(fromX, fromY, toX, toY) {
  return Math.abs(fromX - toX) <= 1 && Math.abs(fromY - toY) <= 1;
}

function inCheckDiagonal(color, myBoard) {
  let enemyBishop, enemyQueen, kingX, kingY;
  let dirsX = [1, -1, 1, -1],
    dirsY = [1, 1, -1, -1];

  if (color == "white") {
    kingX = whiteKingPos.x;
    kingY = whiteKingPos.y;
    enemyBishop = BB;
    enemyQueen = BQ;
  } else {
    kingX = blackKingPos.x;
    kingY = blackKingPos.y;
    enemyBishop = WB;
    enemyQueen = WQ;
  }

  for (let i = 0; i < dirsX.length; ++i) {
    for (
      let tempX = kingX + dirsX[i], tempY = kingY + dirsY[i];
      inBounds(tempX, tempY);
      tempX += dirsX[i], tempY += dirsY[i]
    ) {
      piece = myBoard[tempY][tempX];
      if (piece == EM) continue;
      else if (piece == enemyBishop || piece == enemyQueen) return true;
      else break;
    }
  }

  return false;
}

function inCheckStraight(color, myBoard) {
  let kingX, kingY, enemyRook, enemyQueen;
  let dirsX = [1, -1, 0, 0],
    dirsY = [0, 0, -1, 1];

  if (color == "white") {
    enemyRook = BR;
    enemyQueen = BQ;
    kingX = whiteKingPos.x;
    kingY = whiteKingPos.y;
  } else {
    enemyRook = WR;
    enemyQueen = WQ;
    kingX = blackKingPos.x;
    kingY = blackKingPos.y;
  }

  for (let i = 0; i < dirsX.length; ++i) {
    for (
      let tempX = kingX + dirsX[i], tempY = kingY + dirsY[i];
      inBounds(tempX, tempY);
      tempX += dirsX[i], tempY += dirsY[i]
    ) {
      piece = myBoard[tempY][tempX];
      if (piece == EM) continue;
      else if (piece == enemyRook || piece == enemyQueen) return true;
      else break;
    }
  }

  return false;
}

function inCheckKing(color, myBoard) {
  let enemyKing, kingX, kingY;

  if (color == "white") {
    kingX = whiteKingPos.x;
    kingY = whiteKingPos.y;
    enemyKing = BK;
  } else {
    enemyKing = WK;
    kingX = blackKingPos.x;
    kingY = blackKingPos.y;
  }

  for (let dx = -1; dx <= 1; ++dx) {
    for (let dy = -1; dy <= 1; ++dy) {
      if (dx != 0 || dy != 0) {
        if (
          inBounds(kingX + dx, kingY + dy) &&
          myBoard[kingY + dy][kingX + dx] == enemyKing
        )
          return true;
      }
    }
  }

  return false;
}

function inCheckKnight(color, myBoard) {
  let kingX, kingY;
  let dirsX = [2, 2, -2, -2, 1, 1, -1, -1],
    dirsY = [1, -1, 1, -1, 2, -2, 2, -2];

  if (color == "white") {
    enemyKnight = BN;
    kingX = whiteKingPos.x;
    kingY = whiteKingPos.y;
  } else {
    enemyKnight = WN;
    kingX = blackKingPos.x;
    kingY = blackKingPos.y;
  }

  for (let i = 0; i < dirsX.length; ++i) {
    if (
      inBounds(kingX + dirsX[i], kingY + dirsY[i]) &&
      myBoard[kingY + dirsY[i]][kingX + dirsX[i]] == enemyKnight
    ) {
      return true;
    }
  }

  return false;
}

function inCheckPawn(color, myBoard) {
  let kingX, kingY;

  if (color == "white") {
    kingX = whiteKingPos.x;
    kingY = whiteKingPos.y;

    return (
      (inBounds(kingX - 1, kingY - 1) && myBoard[kingY - 1][kingX - 1] == BP) ||
      (inBounds(kingX + 1, kingY - 1) && myBoard[kingY - 1][kingX + 1] == BP)
    );
  } else {
    kingX = blackKingPos.x;
    kingY = blackKingPos.y;

    return (
      (inBounds(kingX + 1, kingY + 1) && myBoard[kingY + 1][kingX + 1] == WP) ||
      (inBounds(kingX - 1, kingY + 1) && myBoard[kingY + 1][kingX - 1] == WP)
    );
  }
}

function inCheck(color, myBoard) {
  return (
    inCheckStraight(color, myBoard) ||
    inCheckDiagonal(color, myBoard) ||
    inCheckKnight(color, myBoard) ||
    inCheckPawn(color, myBoard) ||
    inCheckKing(color, myBoard)
  );
}

function isEnPassant(fromX, fromY, toX, toY, color) {
  if (board[fromY][fromX].type == "pawn") {
    if (color == "white") {
      return (
        lastMove.piece == BP &&
        lastMove.toY - lastMove.fromY == 2 &&
        lastMove.fromX == lastMove.toX &&
        lastMove.toY == toY + 1 &&
        Math.abs(lastMove.toX - fromX) == 1
      );
    } else {
      return (
        lastMove.piece == WP &&
        lastMove.fromY - lastMove.toY == 2 &&
        lastMove.fromX == lastMove.toX &&
        lastMove.toY == toY - 1 &&
        Math.abs(lastMove.toX - fromX) == 1
      );
    }
  }
}

function isPromotion(fromX, fromY, toX, toY, color, myBoard) {
  if (myBoard[fromY][fromX].type == "pawn") {
    if (color == "white") {
      return toY == 0;
    } else {
      return toY == 7;
    }
  }
}

function isPawnMove(fromX, fromY, toX, toY, color, myBoard) {
  if (color == "white") {
    return (
      (myBoard[toY][toX] == EM &&
        ((fromX == toX && toY == fromY - 1) ||
          (fromX == toX && toY == fromY - 2 && fromY == 6))) || // straight move
      (myBoard[toY][toX].color == "black" &&
        Math.abs(fromX - toX) == 1 &&
        toY == fromY - 1) || // capture
      isEnPassant(fromX, fromY, toX, toY, color, myBoard)
    ); // en-passant
  } else {
    return (
      (myBoard[toY][toX] == EM &&
        ((fromX == toX && toY == fromY + 1) ||
          (fromX == toX && toY == fromY + 2 && fromY == 1))) || // straight move
      (myBoard[toY][toX].color == "white" &&
        Math.abs(fromX - toX) == 1 &&
        toY == fromY + 1) || // capture
      isEnPassant(fromX, fromY, toX, toY, color, myBoard)
    ); // en-passant
  }
}

function isShortCastle(fromX, fromY, toX, toY, myBoard) {
  let isInCheck, oldKingPos;

  if (myBoard[fromY][fromX].color == "white") {
    if (
      whiteCanShortCastle &&
      fromX == 4 &&
      fromY == 7 &&
      toX == 6 &&
      toY == 7 &&
      myBoard[7][7] == WR
    ) {
      const testBoard = myBoard.map((L) => L.slice());
      pseudoCommitMove(fromX, fromY, fromX + 1, fromY, testBoard);
      let oldKingPos = Object.assign({}, whiteKingPos);
      whiteKingPos.x = fromX + 1;
      whiteKingPos.y = fromY;

      isInCheck = inCheck("white", testBoard);
      whiteKingPos = Object.assign({}, oldKingPos);

      return !isInCheck;
    }
  } else {
    if (
      blackCanShortCastle &&
      fromX == 4 &&
      fromY == 0 &&
      toX == 6 &&
      toY == 0 &&
      myBoard[0][7] == BR
    ) {
      const testBoard = myBoard.map((L) => L.slice());
      pseudoCommitMove(fromX, fromY, toX + 1, fromY, testBoard);
      let oldKingPos = Object.assign({}, blackKingPos);
      blackKingPos.x = fromX + 1;
      blackKingPos.y = fromY;

      isInCheck = inCheck("black", testBoard);
      blackKingPos = Object.assign({}, oldKingPos);

      return !isInCheck;
    }
  }
}

function isLongCastle(fromX, fromY, toX, toY, myBoard) {
  if (myBoard[fromY][fromX].color == "white") {
    if (
      whiteCanLongCastle &&
      fromX == 4 &&
      fromY == 7 &&
      toX == 2 &&
      toY == 7 &&
      myBoard[7][0] == WR
    ) {
      const testBoard = myBoard.map((L) => L.slice());
      pseudoCommitMove(fromX, fromY, fromX + 1, fromY, testBoard);
      let oldKingPos = Object.assign({}, whiteKingPos);
      whiteKingPos.x = fromX - 1;
      whiteKingPos.y = fromY;

      isInCheck = inCheck("white", testBoard);
      whiteKingPos = Object.assign({}, oldKingPos);

      return !isInCheck;
    }
  } else {
    if (
      blackCanLongCastle &&
      fromX == 4 &&
      fromY == 0 &&
      toX == 2 &&
      toY == 0 &&
      myBoard[0][0] == BR
    ) {
      const testBoard = myBoard.map((L) => L.slice());
      pseudoCommitMove(fromX, fromY, toX + 1, fromY, testBoard);
      let oldKingPos = Object.assign({}, blackKingPos);
      blackKingPos.x = fromX - 1;
      blackKingPos.y = fromY;

      isInCheck = inCheck("black", testBoard);
      blackKingPos = Object.assign({}, oldKingPos);

      return !isInCheck;
    }
  }
}

function generateKnightMoves(fromX, fromY, color, myBoard) {
  let moves = [];
  let dirsX = [2, 2, -2, -2, 1, 1, -1, -1],
    dirsY = [1, -1, 1, -1, 2, -2, 2, -2];

  for (let i = 0; i < dirsX.length; ++i) {
    if (
      isLegalMove(
        fromX,
        fromY,
        fromX + dirsX[i],
        fromY + dirsY[i],
        "knight",
        color,
        myBoard
      )
    ) {
      moves.push({
        fromX: fromX,
        fromY: fromY,
        toX: fromX + dirsX[i],
        toY: fromY + dirsY[i],
        piece: myBoard[fromY][fromX],
      });
    }
  }

  return moves;
}

function generateStraightMoves(fromX, fromY, color, myBoard) {
  let moves = [];
  let type = myBoard[fromY][fromX].type;
  let dirsX = [1, -1, 0, 0],
    dirsY = [0, 0, -1, 1];

  for (let i = 0; i < dirsX.length; ++i) {
    for (
      let tempX = fromX + dirsX[i], tempY = fromY + dirsY[i];
      inBounds(tempX, tempY);
      tempX += dirsX[i], tempY += dirsY[i]
    ) {
      if (isLegalMove(fromX, fromY, tempX, tempY, type, color, myBoard)) {
        moves.push({
          fromX: fromX,
          fromY: fromY,
          toX: tempX,
          toY: tempY,
          piece: myBoard[fromY][fromX],
        });
      }
    }
  }

  return moves;
}

function generateDiagonalMoves(fromX, fromY, color, myBoard) {
  let moves = [];
  let type = myBoard[fromY][fromX].type;
  let dirsX = [1, -1, 1, -1],
    dirsY = [1, 1, -1, -1];

  for (let i = 0; i < dirsX.length; ++i) {
    for (
      let tempX = fromX + dirsX[i], tempY = fromY + dirsY[i];
      inBounds(tempX, tempY);
      tempX += dirsX[i], tempY += dirsY[i]
    ) {
      if (isLegalMove(fromX, fromY, tempX, tempY, type, color, myBoard)) {
        moves.push({
          fromX: fromX,
          fromY: fromY,
          toX: tempX,
          toY: tempY,
          piece: myBoard[fromY][fromX],
        });
      }
    }
  }

  return moves;
}

function generatePawnMoves(fromX, fromY, color, myBoard) {
  let moves = [];

  if (color == "white") {
    let dirsX = [0, 0, -1, 1],
      dirsY = [-1, -2, -1, -1];

    for (let i = 0; i < dirsX.length; ++i) {
      if (
        isLegalMove(
          fromX,
          fromY,
          fromX + dirsX[i],
          fromY + dirsY[i],
          "pawn",
          "white",
          myBoard
        )
      ) {
        moves.push({
          fromX: fromX,
          fromY: fromY,
          toX: fromX + dirsX[i],
          toY: fromY + dirsY[i],
          piece: myBoard[fromY][fromX],
        });
      }
    }
  } else {
    let dirsX = [0, 0, -1, 1],
      dirsY = [1, 2, 1, 1];

    for (let i = 0; i < dirsX.length; ++i) {
      if (
        isLegalMove(
          fromX,
          fromY,
          fromX + dirsX[i],
          fromY + dirsY[i],
          "pawn",
          "black",
          myBoard
        )
      ) {
        moves.push({
          fromX: fromX,
          fromY: fromY,
          toX: fromX + dirsX[i],
          toY: fromY + dirsY[i],
          piece: myBoard[fromY][fromX],
        });
      }
    }
  }

  return moves;
}

function generateKingMoves(fromX, fromY, color, myBoard) {
  let moves = [];

  for (let dx = -1; dx <= 1; ++dx) {
    for (let dy = -1; dy <= 1; ++dy) {
      if (dx != 0 || dy != 0) {
        if (
          isLegalMove(
            fromX,
            fromY,
            fromX + dx,
            fromY + dy,
            "king",
            color,
            myBoard
          )
        ) {
          moves.push({
            fromX: fromX,
            fromY: fromY,
            toX: fromX + dx,
            toY: fromY + dy,
            piece: myBoard[fromY][fromX],
          });
        }
      }
    }
  }

  return moves;
}

function generateMoves(color, existance, myBoard) {
  let moves = [];

  for (let x = 0; x < ROWS; x++) {
    for (let y = 0; y < COLS; y++) {
      if (existance && moves.length > 0) return moves; // Optimization that works if we care only about the existance of moves

      c = myBoard[y][x].color;

      if (c == color) {
        type = myBoard[y][x].type;
        switch (type) {
          case "pawn":
            moves = moves.concat(generatePawnMoves(x, y, color, myBoard));
            break;
          case "bishop":
            moves = moves.concat(generateDiagonalMoves(x, y, color, myBoard));
            break;
          case "knight":
            moves = moves.concat(generateKnightMoves(x, y, color, myBoard));
            break;
          case "rook":
            moves = moves.concat(generateStraightMoves(x, y, color, myBoard));
            break;
          case "queen":
            moves = moves.concat(generateDiagonalMoves(x, y, color, myBoard));
            moves = moves.concat(generateStraightMoves(x, y, color, myBoard));
            break;
          case "king":
            moves = moves.concat(generateKingMoves(x, y, color, myBoard));
            break;
        }
      }
    }
  }

  return moves;
}

function hasMoves(color, existance, myBoard) {
  return generateMoves(color, existance, myBoard).length > 0;
}

function isLegalMove(fromX, fromY, toX, toY, type, color, myBoard) {
  let isLegal = false,
    isInCheck = false,
    kingX,
    kingY;

  if (isMoving(fromX, fromY, toX, toY) && inBounds(toX, toY)) {
    switch (type) {
      case "pawn":
        isLegal = isPawnMove(fromX, fromY, toX, toY, color, myBoard);
        if (fromX == toX)
          isLegal &= !isBlocked(fromX, fromY, toX, toY, "straight", myBoard);
        else isLegal &= !isBlocked(fromX, fromY, toX, toY, "diagonal", myBoard);

        break;
      case "bishop":
        isLegal =
          isDiagonalMove(fromX, fromY, toX, toY) &&
          !isBlocked(fromX, fromY, toX, toY, "diagonal", myBoard);
        break;
      case "knight":
        isLegal =
          isKnightMove(fromX, fromY, toX, toY) &&
          !isBlocked(fromX, fromY, toX, toY, "knight", myBoard);
        break;
      case "rook":
        isLegal =
          isStraightMove(fromX, fromY, toX, toY) &&
          !isBlocked(fromX, fromY, toX, toY, "straight", myBoard);
        break;
      case "queen":
        isLegal =
          (isStraightMove(fromX, fromY, toX, toY) &&
            !isBlocked(fromX, fromY, toX, toY, "straight", myBoard)) ||
          (isDiagonalMove(fromX, fromY, toX, toY) &&
            !isBlocked(fromX, fromY, toX, toY, "diagonal", myBoard));
        break;
      case "king":
        isLegal =
          (isKingMove(fromX, fromY, toX, toY) &&
            !isBlocked(fromX, fromY, toX, toY, "unit", myBoard)) ||
          (isShortCastle(fromX, fromY, toX, toY, myBoard) &&
            !isBlocked(fromX, fromY, toX, toY, "straight", myBoard)) ||
          (isLongCastle(fromX, fromY, toX, toY, myBoard) &&
            !isBlocked(fromX, fromY, toX, toY, "straight", myBoard));
        break;
    }
  }

  if (isLegal) {
    if (color == "white") {
      let oldKingPos = Object.assign({}, whiteKingPos);
      if (type == "king") {
        whiteKingPos.x = toX;
        whiteKingPos.y = toY;
      }

      const testBoard = myBoard.map((L) => L.slice());
      pseudoCommitMove(fromX, fromY, toX, toY, testBoard);
      isInCheck = inCheck(color, testBoard);
      whiteKingPos = Object.assign({}, oldKingPos);

      return !isInCheck;
    } else {
      let oldKingPos = Object.assign({}, blackKingPos);
      if (type == "king") {
        blackKingPos.x = toX;
        blackKingPos.y = toY;
      }

      const testBoard = myBoard.map((L) => L.slice());
      pseudoCommitMove(fromX, fromY, toX, toY, testBoard);
      isInCheck = inCheck(color, testBoard);
      blackKingPos = Object.assign({}, oldKingPos);

      return !isInCheck;
    }
  }

  return false;
}

async function movePiece(fromX, fromY, toX, toY) {
  if (superMode) {
    board[toY][toX] = board[fromY][fromX];
    board[fromY][fromX] = EM;
    renderScoresheet(lastMove, moveNumber);
  } else if (playing) {
    if (
      isInTurn(board[fromY][fromX].color) &&
      isLegalMove(
        fromX,
        fromY,
        toX,
        toY,
        board[fromY][fromX].type,
        board[fromY][fromX].color,
        board
      )
    ) {
      await commitMove(fromX, fromY, toX, toY, board);
    }

    render();
  }
}

function init() {
  board = [
    [BR, BN, BB, BQ, BK, BB, BN, BR],
    [BP, BP, BP, BP, BP, BP, BP, BP],
    [EM, EM, EM, EM, EM, EM, EM, EM],
    [EM, EM, EM, EM, EM, EM, EM, EM],
    [EM, EM, EM, EM, EM, EM, EM, EM],
    [EM, EM, EM, EM, EM, EM, EM, EM],
    [WP, WP, WP, WP, WP, WP, WP, WP],
    [WR, WN, WB, WQ, WK, WB, WN, WR],
  ];

  turn = "white";
  playing = true;
  moveNumber = 1;
  halfMoves = 0;
  positions = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": 1,
  };
  (whiteCanShortCastle = true), (blackCanShortCastle = true);
  (whiteCanLongCastle = true), (blackCanLongCastle = true);
  lastMove = {
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    piece: EM,
    isCapture: false,
    isShortCastle: false,
    isLongCastle: false,
    isPromotion: false,
    isCheckMate: false,
    isStaleMate: false,
    drawRule: false,
  };
  whiteKingPos = {
    x: 4,
    y: 7,
  };
  blackKingPos = {
    x: 4,
    y: 0,
  };
}

init();
