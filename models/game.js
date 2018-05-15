const GamesDB = require('../db/gamesDB.js');
const Piece = require('../models/chess_pieces/piece.js');
const Pawn = require('../models/chess_pieces/pawn.js');
const Rook = require('../models/chess_pieces/rook.js');
const Bishop = require('../models/chess_pieces/bishop.js');
const Knight = require('../models/chess_pieces/knight.js');
const Queen = require('../models/chess_pieces/queen.js');
const King = require('../models/chess_pieces/king.js');

const gamesDB = new GamesDB();

class Game {

    /**
     * A Game instance representing a record the details reflected in the
     * database. This Game class will handle the transaction required in updating
     * any record pertaining to this instance of the game.
     * @param {Object} gameData An object of representing a record joined between games and game_users
     * belonging to a certain game ID.
     * @param {Array} gamePiecesRecords An array of objects where each object is a record joined
     * from the pieces and game_pieces table from a certain game ID.
     */
    constructor (gameData, gamePiecesRecords) {
        this.gameId = gameData.gameid;
        this.hostId = gameData.userid;
        this.opponentId = gameData.opponentid;
        this.turn = gameData.turn;
        this.gamePiecesRecords = gamePiecesRecords;
        this.gamePieces = this.__setupGamePieces(gamePiecesRecords);
        this.chessboard = this.__setupChessboard(this.gamePieces);
    }

    /**
     * Set up an array of Pieces.
     * @param {Array} gamePiecesRecords Array of objects where each object represents a record that
     * was joined between game and game_users table of a certain game.
     */
    __setupGamePieces(gamePiecesRecords) {
        const gamePieces = [];

        for (let idx = 0; idx < gamePiecesRecords.length; idx++ ) {
            const gamePieceRecord = gamePiecesRecords[idx];
            const gamePieceName = gamePieceRecord.name;
            /** @type {Piece} */
            let gamePieceObject = undefined;
            
            if (gamePieceName == 'pawn') {
                gamePieceObject = new Pawn(gamePieceRecord);
            } else if (gamePieceName == 'rook') {
                gamePieceObject = new Rook(gamePieceRecord);
            } else if (gamePieceName == 'knight') {
                gamePieceObject = new Knight(gamePieceRecord);
            } else if (gamePieceName == 'bishop') {
                gamePieceObject = new Bishop(gamePieceRecord);
            } else if (gamePieceName == 'queen') {
                gamePieceObject = new Queen(gamePieceRecord);
            } else if (gamePieceName == 'king') {
                gamePieceObject = new King(gamePieceRecord);
            } else {
                throw new TypeError(`Error: cannot instantiate ${gamePieceName}`);
            }

            gamePieces.push(gamePieceObject);
        }

        return gamePieces;
    }

    /**
     * Set up the chessboard with Pieces at their respective cell locations.
     * @param {Array} gamePieces Array of Piece objects.
     * @param {Number} dimension Optional dimension size of height and width of this chessboard.
     */
    __setupChessboard(gamePieces, dimension = 8) {
        const chessboard = [];

        for (let idx = 0; idx < dimension; idx++ ) {
            chessboard[idx] = [];
        }

        if (gamePieces) {
            for (let idx = 0; idx < gamePieces.length; idx++ ) {
                /** @type {Piece} */
                const piece = gamePieces[idx];
                const cbx = Piece.coordinateXConversion(piece.coordinate_x);
                const cby = Piece.coordinateYConversion(piece.coordinate_y);

                chessboard[cbx][cby] = piece;
            }
        }

        return chessboard;
    }

    __getGamePiece(convertedX, convertedY) {
        for (let idx = 0; this.gamePieces.length; idx++) {
            const gamePiece = this.gamePieces[idx];
            const x = gamePiece.coordinate_x;
            const y = gamePiece.coordinate_y;

            if (x == convertedX && y == convertedY) {
                return gamePiece;
            }
        }
    }

    /**
     * Set the opponent ID of this game instance. Note that a successful callback must be passed
     * as the game_users database table should reflect the most up to date information.
     * @param {Number} opponentId 
     * @param {Function} successCB Callback to run after success database update.
     * @param {Function} failureCB Optional failure callback.
     */
    setOpponentID(opponentId, successCB, failureCB) {
        gamesDB.setGameOpponent(opponentId, this.gameId, () => {
            this.opponentId = opponentId;
            successCB();
        }, 
        () => {
            if (typeof failureCB === 'function') {
                failureCB();
            }
        });
    }

    movePieceToPosition(pieceId, coordinate_x, coordinate_y, destination_x, destination_y, optionalData) {
        //pieceId, coordinate_x, coordinate_y, newX, newY)

        // Check if move is valid
        /*
            1. Is move out of bounds? Instant reject if so. 
            2. Is move even possible by the selected piece?
                3. Is there an intercepting piece disallowing the movement then?
                4. Is there an ally piece at the destination?
            5. Is this current player's king in check?
            6.      Yes: does this new move avoids the capture?
            7. Move the piece to destination... 
        */
        const result = {result: false, message: ""};
        const cbx = Piece.coordinateXConversion(coordinate_x);
        const cby = Piece.coordinateYConversion(coordinate_y);
        const dbx = Piece.coordinateXConversion(destination_x);
        const dby = Piece.coordinateYConversion(destination_y);
        const piece = this.__getGamePiece(cbx, cby);

        if (dbx >= 8 || dby >= 8) {
            result.result = false;
            result.message = `Positions {${destination_x}, ${destination_y}} are out of bounds!`;
            return result;
        }

        if (!piece) {
            result.result = false;
            result.message = `Selected piece does not exist at positions {${coordinate_x}, ${coordinate_y}}!`;
            return result;
        }

        if (!piece.isValidMovement(dbx, dby, this.chessboard)) {
            result.result = false;
            result.message = `Invalid movement to {${destination_x}, ${destination_y}}!`;
            return result;
        }

        // Pseudo code.
        // TODO: Checks if king is currently checked now, if the newly made move will save it, or is the King itself.
        if (!this.__isPlayerInKingCheck(playerId, pieceId ));
        
    }

}

module.exports = Game;