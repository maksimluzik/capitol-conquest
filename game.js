class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.boardSize = 8;
        this.hexSize = 30;
        this.board = new Map();
        this.players = {
            1: { color: 0xff0000, name: 'Republicans', score: 0 },
            2: { color: 0x0000ff, name: 'Democrats', score: 0 }
        };
        this.currentPlayer = 1;
        this.selectedPiece = null;
        this.validMoves = [];
    }

    preload() {
        // No assets to preload
    }

    create() {
        this.drawBoard();
        this.placeInitialPieces();
        this.updateScores();
        this.turnText = this.add.text(10, 10, `Turn: ${this.players[this.currentPlayer].name}`, { fontSize: '24px', fill: '#000' });
        this.scoreText = this.add.text(10, 40, '', { fontSize: '24px', fill: '#000' });
        this.updateScoreText();

        this.input.on('gameobjectdown', this.onPieceDown, this);
    }

    drawBoard() {
        const hexHeight = this.hexSize * Math.sqrt(3);
        const hexWidth = this.hexSize * 2;
        const offsetX = this.game.config.width / 2;
        const offsetY = this.game.config.height / 2;

        for (let q = -this.boardSize; q <= this.boardSize; q++) {
            for (let r = -this.boardSize; r <= this.boardSize; r++) {
                if (Math.abs(q + r) > this.boardSize) continue;

                const x = offsetX + this.hexSize * 3 / 2 * q;
                const y = offsetY + hexHeight / 2 * q + hexHeight * r;
                // Phaser's add.polygon expects an explicit point list, not a side count.
                // The previous code passed "6" which produced an invalid Polygon and a runtime error
                // when Phaser tried to access point.x of an undefined element. We build a flat-topped
                // hexagon (pointy corners left/right) using 6 vertices around the center.
                const points = [];
                for (let i = 0; i < 6; i++) {
                    // -30 deg starts flat-top orientation so horizontal width is 2*size
                    const angle = Phaser.Math.DegToRad(60 * i - 30);
                    points.push(this.hexSize * Math.cos(angle), this.hexSize * Math.sin(angle));
                }
                const hex = this.add.polygon(x, y, points, 0xcccccc, 1).setStrokeStyle(1, 0x000000);
                hex.setData({ q, r, piece: null });
                hex.setInteractive();
                this.board.set(`${q},${r}`, hex);

                hex.on('pointerdown', () => this.onHexDown(hex));
            }
        }
    }

    placeInitialPieces() {
        this.addPiece(-this.boardSize, 0, 1);
        this.addPiece(this.boardSize, 0, 2);
        this.addPiece(0, -this.boardSize, 1);
        this.addPiece(0, this.boardSize, 2);
        this.addPiece(-this.boardSize, this.boardSize, 1);
        this.addPiece(this.boardSize, -this.boardSize, 2);
    }

    addPiece(q, r, player) {
        const hex = this.board.get(`${q},${r}`);
        if (hex && hex.x !== undefined && hex.y !== undefined) {
            const piece = this.add.circle(hex.x, hex.y, this.hexSize * 0.5, this.players[player].color);
            piece.setData({ q, r, player });
            piece.setInteractive();
            hex.data.values.piece = piece;
        }
    }

    onPieceDown(pointer, gameObject) {
        if (gameObject.data.values.player === this.currentPlayer) {
            this.selectPiece(gameObject);
        }
    }

    onHexDown(hex) {
        const move = this.validMoves.find(m => m.q === hex.data.values.q && m.r === hex.data.values.r);
        if (move) {
            this.executeMove(move);
        }
    }

    selectPiece(piece) {
        if (this.selectedPiece) {
            this.clearHighlights();
        }
        this.selectedPiece = piece;
        this.highlightValidMoves();
    }

    clearHighlights() {
        this.validMoves.forEach(move => {
            const hex = this.board.get(`${move.q},${move.r}`);
            if (hex) {
                hex.setFillStyle(0xcccccc);
            }
        });
        this.validMoves = [];
    }

    highlightValidMoves() {
        this.clearHighlights();
        const q = this.selectedPiece.data.values.q;
        const r = this.selectedPiece.data.values.r;

        // Jumps (2 hexes away)
        const jumpDirections = [
            [2, 0], [-2, 0], [0, 2], [0, -2], [2, -2], [-2, 2],
            [1, 1], [-1, -1], [1, -2], [-1, 2], [2, -1], [-2, 1]
        ];

        jumpDirections.forEach(dir => {
            const nq = q + dir[0];
            const nr = r + dir[1];
            const hex = this.board.get(`${nq},${nr}`);
            if (hex && !hex.data.values.piece) {
                hex.setFillStyle(0x00ff00);
                this.validMoves.push({ q: nq, r: nr, type: 'jump' });
            }
        });

        // Duplicates (1 hex away)
        const duplicateDirections = [
            [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]
        ];

        duplicateDirections.forEach(dir => {
            const nq = q + dir[0];
            const nr = r + dir[1];
            const hex = this.board.get(`${nq},${nr}`);
            if (hex && !hex.data.values.piece) {
                hex.setFillStyle(0xffff00);
                this.validMoves.push({ q: nq, r: nr, type: 'duplicate' });
            }
        });
    }

    executeMove(move) {
        const oldQ = this.selectedPiece.data.values.q;
        const oldR = this.selectedPiece.data.values.r;
        const player = this.selectedPiece.data.values.player;

        if (move.type === 'jump') {
            const oldHex = this.board.get(`${oldQ},${oldR}`);
            oldHex.data.values.piece = null;
            this.selectedPiece.destroy();
        }

        this.addPiece(move.q, move.r, player);
        this.convertOpponentPieces(move.q, move.r, player);

        this.clearHighlights();
        this.selectedPiece = null;
        this.endTurn();
    }

    convertOpponentPieces(q, r, player) {
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]
        ];

        directions.forEach(dir => {
            const nq = q + dir[0];
            const nr = r + dir[1];
            const hex = this.board.get(`${nq},${nr}`);
            if (hex && hex.data.values.piece && hex.data.values.piece.data.values.player !== player) {
                hex.data.values.piece.destroy();
                this.addPiece(nq, nr, player);
            }
        });
    }

    endTurn() {
        this.updateScores();
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.turnText.setText(`Turn: ${this.players[this.currentPlayer].name}`);
        this.updateScoreText();

        if (this.isGameOver()) {
            this.showGameOver();
        }
    }

    updateScores() {
        this.players[1].score = 0;
        this.players[2].score = 0;
        this.board.forEach(hex => {
            if (hex.data.values.piece) {
                this.players[hex.data.values.piece.data.values.player].score++;
            }
        });
    }

    updateScoreText() {
        this.scoreText.setText(
            `${this.players[1].name}: ${this.players[1].score}\n` +
            `${this.players[2].name}: ${this.players[2].score}`
        );
    }

    isGameOver() {
        // Check if board is full
        let isFull = true;
        this.board.forEach(hex => {
            if (!hex.data.values.piece) {
                isFull = false;
            }
        });
        if (isFull) return true;

        // Check if current player has any valid moves
        for (const hex of this.board.values()) {
            if (hex.data.values.piece && hex.data.values.piece.data.values.player === this.currentPlayer) {
                if (this.hasValidMoves(hex.data.values.piece)) {
                    return false;
                }
            }
        }
        return true;
    }

    hasValidMoves(piece) {
        const q = piece.data.values.q;
        const r = piece.data.values.r;

        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
            [2, 0], [-2, 0], [0, 2], [0, -2], [2, -2], [-2, 2],
            [1, 1], [-1, -1], [1, -2], [-1, 2], [2, -1], [-2, 1]
        ];

        for (const dir of directions) {
            const nq = q + dir[0];
            const nr = r + dir[1];
            const hex = this.board.get(`${nq},${nr}`);
            if (hex && !hex.data.values.piece) {
                return true;
            }
        }
        return false;
    }

    showGameOver() {
        const winner = this.players[1].score > this.players[2].score ? this.players[1] : this.players[2];
        const text = `Game Over!\n${winner.name} wins!`;
        const gameOverText = this.add.text(this.game.config.width / 2, this.game.config.height / 2, text, {
            fontSize: '48px',
            fill: '#000',
            backgroundColor: '#fff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    scene: [GameScene]
};

const game = new Phaser.Game(config);
