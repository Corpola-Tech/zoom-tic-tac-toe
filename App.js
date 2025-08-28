import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// Import haptics with fallback for development
let Haptics;
try {
  Haptics = require("expo-haptics");
} catch (error) {
  // Fallback for development or if haptics is not available
  Haptics = {
    impactAsync: () => Promise.resolve(),
    selectionAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Light: "light" },
    NotificationFeedbackType: { Success: "success", Warning: "warning" },
  };
}

const { width, height } = Dimensions.get("window");
const EMPTY = "";
const X = "X";
const O = "O";

const ZoomTicTacToe = () => {
  const [gameMode, setGameMode] = useState(null); // null, 'player', 'computer'
  const [gameState, setGameState] = useState("menu"); // 'menu', 'playing', 'gameover'
  const [currentPlayer, setCurrentPlayer] = useState(X);
  const [bigBoard, setBigBoard] = useState(Array(9).fill(null));
  const [miniBoards, setMiniBoards] = useState(
    Array(9)
      .fill()
      .map(() => Array(9).fill(EMPTY)),
  );
  const [activeGrid, setActiveGrid] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastWinner, setLastWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameMessage, setGameMessage] = useState("");
  const [scaleAnim] = useState(new Animated.Value(1));
  const [winnerTransition, setWinnerTransition] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  // Check if there's a winner in a 3x3 grid
  const checkWinner = (board) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if (board.every((cell) => cell !== EMPTY)) {
      return "draw";
    }

    return null;
  };

  // Computer AI - Simple but strategic
  const getComputerMove = useCallback((miniBoard) => {
    // Try to win first
    for (let i = 0; i < 9; i++) {
      if (miniBoard[i] === EMPTY) {
        const testBoard = [...miniBoard];
        testBoard[i] = O;
        if (checkWinner(testBoard) === O) {
          return i;
        }
      }
    }

    // Block player from winning
    for (let i = 0; i < 9; i++) {
      if (miniBoard[i] === EMPTY) {
        const testBoard = [...miniBoard];
        testBoard[i] = X;
        if (checkWinner(testBoard) === X) {
          return i;
        }
      }
    }

    // Take center if available
    if (miniBoard[4] === EMPTY) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter((i) => miniBoard[i] === EMPTY);
    if (availableCorners.length > 0) {
      return availableCorners[
        Math.floor(Math.random() * availableCorners.length)
      ];
    }

    // Take any available spot
    const availableSpots = miniBoard
      .map((cell, index) => (cell === EMPTY ? index : null))
      .filter((val) => val !== null);
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
  }, []);

  // Make a move in the mini grid
  const makeMove = useCallback(
    (cellIndex) => {
      if (
        activeGrid === null ||
        miniBoards[activeGrid][cellIndex] !== EMPTY ||
        bigBoard[activeGrid] !== null
      ) {
        return;
      }

      if (Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const newMiniBoards = [...miniBoards];
      newMiniBoards[activeGrid][cellIndex] = currentPlayer;
      setMiniBoards(newMiniBoards);

      // Check if mini grid has a winner
      const miniWinner = checkWinner(newMiniBoards[activeGrid]);
      if (miniWinner) {
        const newBigBoard = [...bigBoard];
        if (miniWinner !== "draw") {
          newBigBoard[activeGrid] = miniWinner;
          setLastWinner(miniWinner);
          setGameMessage(`${miniWinner} wins this grid!`);

          // Update scores
          setScores((prev) => ({
            ...prev,
            [miniWinner]: prev[miniWinner] + 1,
          }));
          if (Haptics.notificationAsync) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          newBigBoard[activeGrid] = "draw";
          setLastWinner("draw");
          setGameMessage("This grid is a draw!");
          setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
          if (Haptics.notificationAsync) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
        setBigBoard(newBigBoard);

        // Check if big board has a winner
        const bigWinner = checkWinner(
          newBigBoard.map((cell) => (cell === "draw" ? EMPTY : cell)),
        );
        if (bigWinner && bigWinner !== "draw") {
          setWinner(bigWinner);
          setGameMessage(`🎉 ${bigWinner} wins the game! 🎉`);
          if (Haptics.notificationAsync) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          // Start winner transition animation
          setWinnerTransition(true);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setGameState("gameover");
            setWinnerTransition(false);
            // Reset animations for next game
            fadeAnim.setValue(1);
            slideAnim.setValue(0);
          });
          return;
        } else if (newBigBoard.every((cell) => cell !== null)) {
          setWinner("draw");
          setGameMessage("It's a draw!");
          if (Haptics.notificationAsync) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          // Start draw transition animation
          setWinnerTransition(true);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setGameState("gameover");
            setWinnerTransition(false);
            // Reset animations for next game
            fadeAnim.setValue(1);
            slideAnim.setValue(0);
          });
          return;
        }

        // Zoom out and let loser choose next grid
        setTimeout(() => {
          setIsTransitioning(true);
          setIsZoomed(false);
          setActiveGrid(null);

          if (miniWinner === "draw") {
            setGameMessage(
              `It's a draw! ${currentPlayer === X ? "O" : "X"} chooses the next grid.`,
            );
          } else {
            const loser = miniWinner === X ? O : X;
            setGameMessage(`${loser} chooses the next grid.`);
          }

          setTimeout(() => {
            setIsTransitioning(false);
            setCurrentPlayer(
              miniWinner === "draw"
                ? currentPlayer === X
                  ? O
                  : X
                : miniWinner === X
                  ? O
                  : X,
            );
          }, 600);
        }, 1500);
      } else {
        setCurrentPlayer(currentPlayer === X ? O : X);
      }
    },
    [activeGrid, miniBoards, bigBoard, currentPlayer],
  );

  // Computer move effect
  useEffect(() => {
    if (
      gameMode === "computer" &&
      currentPlayer === O &&
      activeGrid !== null &&
      !isTransitioning &&
      gameState === "playing"
    ) {
      const timer = setTimeout(() => {
        const move = getComputerMove(miniBoards[activeGrid]);
        if (move !== undefined) {
          makeMove(move);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [
    currentPlayer,
    activeGrid,
    gameMode,
    miniBoards,
    isTransitioning,
    gameState,
    getComputerMove,
    makeMove,
  ]);

  // Select a grid to play in
  const selectGrid = (gridIndex) => {
    if (bigBoard[gridIndex] !== null || isTransitioning) return;

    if (Haptics.selectionAsync) {
      Haptics.selectionAsync();
    }
    setActiveGrid(gridIndex);
    setIsTransitioning(true);
    setIsZoomed(true);
    setGameMessage(
      `Playing in grid ${gridIndex + 1}. ${currentPlayer}'s turn!`,
    );

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  };

  // Start new game
  const startNewGame = (mode) => {
    setGameMode(mode);
    setGameState("playing");
    setCurrentPlayer(X);
    setBigBoard(Array(9).fill(null));
    setMiniBoards(
      Array(9)
        .fill()
        .map(() => Array(9).fill(EMPTY)),
    );
    setActiveGrid(null);
    setIsZoomed(false);
    setWinner(null);
    setLastWinner(null);
    setIsTransitioning(false);
    setWinnerTransition(false);
    setGameMessage("Choose a grid to start playing!");
    // Reset animations
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    if (Haptics.selectionAsync) {
      Haptics.selectionAsync();
    }
  };

  // Reset everything
  const resetGame = () => {
    setGameMode(null);
    setGameState("menu");
    setScores({ X: 0, O: 0, draws: 0 });
    setGameMessage("");
    setWinnerTransition(false);
    // Reset animations
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    if (Haptics.selectionAsync) {
      Haptics.selectionAsync();
    }
  };

  // Render mini grid
  const renderMiniGrid = (gridIndex, isActive = false) => {
    const grid = miniBoards[gridIndex];
    const isClosed = bigBoard[gridIndex] !== null;
    const gridSize = isActive ? width * 0.8 : (width - 80) / 3;

    return (
      <TouchableOpacity
        style={[
          styles.miniGrid,
          {
            width: gridSize,
            height: gridSize,
            opacity: isClosed ? 0.7 : 1,
          },
          isActive && styles.activeGrid,
        ]}
        onPress={() =>
          !isActive && !isClosed && !isZoomed && selectGrid(gridIndex)
        }
        disabled={isActive || isClosed || isZoomed}
        activeOpacity={0.8}
      >
        {isClosed && (
          <LinearGradient
            colors={["#3B82F6", "#8B5CF6"]}
            style={styles.closedGridOverlay}
          >
            <Text style={styles.closedGridText}>
              {bigBoard[gridIndex] === "draw" ? "=" : bigBoard[gridIndex]}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.miniGridContainer}>
          {grid.map((cell, cellIndex) => (
            <TouchableOpacity
              key={cellIndex}
              style={[
                styles.miniCell,
                { width: (gridSize - 30) / 3, height: (gridSize - 30) / 3 },
              ]}
              onPress={
                isActive && !isClosed ? () => makeMove(cellIndex) : undefined
              }
              disabled={!isActive || isClosed || cell !== EMPTY}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cellText,
                  cell === X ? styles.xText : styles.oText,
                  { fontSize: isActive ? 24 : 16 },
                ]}
              >
                {cell}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (gameState === "menu") {
    return (
      <LinearGradient
        colors={["#1e3a8a", "#7c3aed", "#db2777"]}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.menuContainer}>
          <View style={styles.titleContainer}>
            <Ionicons name="flash" size={60} color="#FCD34D" />
            <Text style={styles.title}>Zoom TTT</Text>
            <Text style={styles.subtitle}>
              Strategic Multi-Level Tic-Tac-Toe
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => startNewGame("player")}
              style={[styles.menuButton, styles.playerButton]}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={24} color="white" />
              <Text style={styles.buttonText}>Two Players</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => startNewGame("computer")}
              style={[styles.menuButton, styles.computerButton]}
              activeOpacity={0.8}
            >
              <Ionicons name="laptop" size={24} color="white" />
              <Text style={styles.buttonText}>vs Computer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.howToPlay}>
            <Text style={styles.howToPlayTitle}>How to Play</Text>
            <Text style={styles.howToPlayText}>
              Play 9 mini tic-tac-toe games to win the big board. The loser of
              each mini-game chooses where to play next!
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (gameState === "gameover") {
    return (
      <LinearGradient
        colors={["#1e3a8a", "#7c3aed", "#db2777"]}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.gameoverContainer}>
          <View style={styles.gameoverContent}>
            <Ionicons name="trophy" size={80} color="#FCD34D" />
            <Text style={styles.gameoverTitle}>Game Over!</Text>
            <Text style={styles.gameoverMessage}>{gameMessage}</Text>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreTitle}>Final Score</Text>
              <View style={styles.scoreRow}>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreValue, styles.xScore]}>
                    {scores.X}
                  </Text>
                  <Text style={styles.scoreLabel}>Player X</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreValue, styles.drawScore]}>
                    {scores.draws}
                  </Text>
                  <Text style={styles.scoreLabel}>Draws</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreValue, styles.oScore]}>
                    {scores.O}
                  </Text>
                  <Text style={styles.scoreLabel}>Player O</Text>
                </View>
              </View>
            </View>

            <View style={styles.gameoverButtons}>
              <TouchableOpacity
                onPress={() => startNewGame(gameMode)}
                style={[styles.menuButton, styles.playAgainButton]}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={resetGame}
                style={[styles.menuButton, styles.mainMenuButton]}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={20} color="white" />
                <Text style={styles.buttonText}>Main Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#1e3a8a", "#7c3aed", "#db2777"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Zoom Tic-Tac-Toe</Text>
            <Text style={styles.headerMessage}>{gameMessage}</Text>
          </View>

          <TouchableOpacity onPress={resetGame} style={styles.menuButtonSmall}>
            <Ionicons name="home" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.scoreBar}>
          <View style={styles.scoreBarItem}>
            <Text style={[styles.scoreBarValue, styles.xScore]}>
              {scores.X}
            </Text>
            <Text style={styles.scoreBarLabel}>X</Text>
          </View>
          <View style={styles.scoreBarItem}>
            <Text style={[styles.scoreBarValue, styles.drawScore]}>
              {scores.draws}
            </Text>
            <Text style={styles.scoreBarLabel}>Draws</Text>
          </View>
          <View style={styles.scoreBarItem}>
            <Text style={[styles.scoreBarValue, styles.oScore]}>
              {scores.O}
            </Text>
            <Text style={styles.scoreBarLabel}>O</Text>
          </View>
        </View>

        <LinearGradient
          colors={["#8B5CF6", "#FFF", "#8B5CF6"]}
          style={styles.currentPlayerBar}
        >
          <Text style={styles.currentPlayerText}>
            Current Player:{" "}
            <Text
              style={[
                styles.currentPlayerSymbol,
                currentPlayer === X ? styles.xText : styles.oText,
              ]}
            >
              {currentPlayer}
            </Text>
            {gameMode === "computer" && currentPlayer === O && (
              <Text style={styles.computerText}> (Computer)</Text>
            )}
          </Text>
        </LinearGradient>
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        {winnerTransition && (
          <Animated.View
            style={[
              styles.winnerOverlay,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.winnerCard}>
              <Ionicons
                name={winner === "draw" ? "remove-outline" : "trophy"}
                size={80}
                color="#FCD34D"
              />
              <Text style={styles.winnerTitle}>
                {winner === "draw" ? "It's a Draw!" : `${winner} Wins!`}
              </Text>
              <Text style={styles.winnerSubtitle}>
                {winner === "draw" ? "Well played!" : "🎉 Congratulations! 🎉"}
              </Text>
            </View>
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.boardContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: winnerTransition ? fadeAnim : isTransitioning ? 0.5 : 1,
            },
          ]}
        >
          {isZoomed && activeGrid !== null ? (
            // Zoomed view - single mini grid
            <View style={styles.zoomedContainer}>
              <Text style={styles.zoomedTitle}>Grid {activeGrid + 1}</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsTransitioning(true);
                  setIsZoomed(false);
                  setActiveGrid(null);
                  setTimeout(() => setIsTransitioning(false), 600);
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={16} color="#3B82F6" />
                <Text style={styles.backButtonText}>Back to main board</Text>
              </TouchableOpacity>
              {renderMiniGrid(activeGrid, true)}
            </View>
          ) : (
            // Main 9x9 board view
            <View style={styles.mainBoard}>
              {Array(9)
                .fill()
                .map((_, gridIndex) => (
                  <View key={gridIndex} style={styles.gridWrapper}>
                    {renderMiniGrid(gridIndex)}
                  </View>
                ))}
            </View>
          )}
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 30,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playerButton: {
    backgroundColor: "#3B82F6",
  },
  computerButton: {
    backgroundColor: "#8B5CF6",
  },
  playAgainButton: {
    backgroundColor: "#10B981",
  },
  mainMenuButton: {
    backgroundColor: "#6B7280",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  howToPlay: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    borderRadius: 15,
    width: "100%",
  },
  howToPlayTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  howToPlayText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  gameoverContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  gameoverContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    width: "100%",
    maxWidth: 350,
  },
  gameoverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 15,
    marginBottom: 10,
  },
  gameoverMessage: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
  },
  scoreContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    width: "100%",
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 15,
    textAlign: "center",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  scoreItem: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  xScore: {
    color: "#3B82F6",
  },
  oScore: {
    color: "#EF4444",
  },
  drawScore: {
    color: "#6B7280",
  },
  gameoverButtons: {
    width: "100%",
  },
  header: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 50,
    marginBottom: 15,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#374151",
  },
  headerMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  menuButtonSmall: {
    backgroundColor: "#6B7280",
    padding: 8,
    borderRadius: 8,
  },
  scoreBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 15,
  },
  scoreBarItem: {
    alignItems: "center",
  },
  scoreBarValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  scoreBarLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  currentPlayerBar: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  currentPlayerText: {
    color: "#1e3a8a",
    fontSize: 16,
    fontWeight: "600",
  },
  currentPlayerSymbol: {
    fontSize: 20,
    fontWeight: "bold",
  },
  computerText: {
    fontSize: 14,
    opacity: 0.8,
  },
  gameBoard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  boardContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  zoomedContainer: {
    alignItems: "center",
  },
  zoomedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    marginLeft: 5,
  },
  mainBoard: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: width - 70,
    height: width - 70,
  },
  gridWrapper: {
    width: "33.33%",
    height: "33.33%",
    padding: 2,
  },
  miniGrid: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    position: "relative",
  },
  activeGrid: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  closedGridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closedGridText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  miniGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    flex: 1,
  },
  miniCell: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    margin: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontWeight: "bold",
  },
  xText: {
    color: "#3B82F6",
  },
  oText: {
    color: "#EF4444",
  },
  winnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  winnerCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    minWidth: 280,
  },
  winnerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 15,
    marginBottom: 8,
    textAlign: "center",
  },
  winnerSubtitle: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default ZoomTicTacToe;
