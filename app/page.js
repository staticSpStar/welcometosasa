"use client";

import {useEffect, useMemo, useRef, useState, useCallback} from "react";
import Image from "next/image";

export default function Home() {
  const [flippedCards, setFlippedCards] = useState(Array(12).fill(false));
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isGathering, setIsGathering] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [positions, setPositions] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardRect, setCardRect] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlippedInModal, setIsFlippedInModal] = useState(false); // 모달 내 뒤집기 상태

  const cardRefs = useRef({});

  const list = ['+100', '+100', '+100', '+100', '+100', '+300', '+300', '+300', '+500', '+500', '+700', 'change!'];
  const rare = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4];

  const sortedData = useMemo(() =>
          [...leaderboardData].sort((a, b) => b.score - a.score),
      [leaderboardData]
  );

  const prevSortOrderRef = useRef(null);
  const prevScoresRef = useRef({});
  const timerRef = useRef(null);
  const pollingRef = useRef(null);

  const ITEM_HEIGHT = 135;

  const getPlayerId = (player) => player._id || player.id || player.name;

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/welcometosasa/api/leaderboard');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('리더보드 로드 실패:', error);
      return null;
    }
  }, []);

  const updateLeaderboard = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);

    const newData = await fetchLeaderboard();
    if (!newData) {
      if (isInitial) setIsLoading(false);
      return;
    }
    const newSorted = [...newData].sort((a, b) => b.score - a.score);
    const currentSortOrder = newSorted.map(p => getPlayerId(p)).join(',');
    const currentScores = newSorted.reduce((acc, p) => {
      acc[getPlayerId(p)] = p.score;
      return acc;
    }, {});

    const newPositions = {};
    newSorted.forEach((player, index) => {
      const id = getPlayerId(player);
      newPositions[id] = index * ITEM_HEIGHT;
    });

    if (prevSortOrderRef.current !== null) {
      const hasRankChange = prevSortOrderRef.current !== currentSortOrder;
      const hasScoreChange = Object.keys(prevScoresRef.current).length > 0 &&
          Object.keys(currentScores).some(id =>
              prevScoresRef.current[id] !== currentScores[id]
          );

      if (hasRankChange || hasScoreChange) {
        setShouldAnimate(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShouldAnimate(false);
        }, 1100);
      }
    }

    prevSortOrderRef.current = currentSortOrder;
    prevScoresRef.current = currentScores;
    setPositions(newPositions);
    setLeaderboardData(newData);

    if (isInitial) setIsLoading(false);
  }, [fetchLeaderboard, ITEM_HEIGHT]);

  const handleOpenLeaderboard = useCallback(async () => {
    await updateLeaderboard(true);
    setShowLeaderboard(true);
  }, [updateLeaderboard]);

  useEffect(() => {
    if (showLeaderboard) {
      pollingRef.current = setInterval(() => {
        updateLeaderboard(false);
      }, 2000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [showLeaderboard, updateLeaderboard]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setShowLeaderboard(false);
  }, []);

  const getRank = useCallback((playerId) => {
    return sortedData.findIndex(p => getPlayerId(p) === playerId);
  }, [sortedData]);

  const handleCardClick = (index, position) => {
    if (isShuffling || isAnimating) return;

    if (!flippedCards[index]) {
      const cardElement = cardRefs.current[position];
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        setCardRect({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height
        });
      }

      // 먼저 모달 표시 (확대)
      setSelectedCard(index);
      setIsAnimating(true);
      setIsFlippedInModal(false);

      // 확대 애니메이션 완료 후 카드 뒤집기
      setTimeout(() => {
        setIsFlippedInModal(true);
        setFlippedCards((prev) => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
        setTimeout(() => setIsAnimating(false), 500);
      }, 400);
    }
  };

  const handleCloseCard = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedCard(null);
      setCardRect(null);
      setIsFlippedInModal(false);
      setIsAnimating(false);
    }, 300);
  };

  const shuffle = () => {
    if (isShuffling) return;

    setFlippedCards(Array(12).fill(false));
    setSelectedCard(null);
    setCardRect(null);
    setIsFlippedInModal(false);
    setIsShuffling(true);
    setIsGathering(true);

    setTimeout(() => {
      const newOrder = [...cardOrder];
      for (let i = newOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
      }
      setCardOrder(newOrder);

      setTimeout(() => {
        setIsGathering(false);
        setTimeout(() => setIsShuffling(false), 500);
      }, 300);
    }, 500);
  };

  const getCardStyle = (position) => {
    if (isGathering) {
      const row = Math.floor(position / 6);
      const col = position % 6;
      const centerCol = 2.5;
      const centerRow = 0.5;

      const offsetX = (col - centerCol) * -254;
      const offsetY = (row - centerRow) * -345;

      return {
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${(col - centerCol) * 5}deg)`,
        zIndex: position,
      };
    }return {};
  };

  const getCardBackground = (rareLevel) => {
    switch (rareLevel) {
      case 0: return 'bg-gradient-to-br from-gray-300 to-gray-500';
      case 1: return 'bg-gradient-to-br from-green-400 to-green-600';
      case 2: return 'bg-gradient-to-br from-yellow-300 to-yellow-500';
      case 3: return 'bg-gradient-to-br from-blue-500 to-green-500';
      case 4: return 'bg-gradient-to-br from-pink-400 to-blue-500';
      default: return 'bg-gradient-to-br from-gray-300 to-gray-500';
    }
  };

  const getModalStyle = () => {
    if (!cardRect) return {};

    const targetWidth = 350;
    const targetHeight = 487;

    if (selectedCard !== null && !isAnimating) {
      return {
        transform: 'translate(-50%, -50%) scale(1)',
        left: '50%',
        top: '50%',
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };
    } else {
      const scaleX = cardRect.width / targetWidth;
      const scaleY = cardRect.height / targetHeight;
      const scale = Math.min(scaleX, scaleY);

      return {
        transform: `translate(-50%, -50%) scale(${scale})`,
        left: `${cardRect.x}px`,
        top: `${cardRect.y}px`,
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };
    }
  };

  return (
      <main className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-900 to-slate-800 relative">
        <button
            onClick={handleOpenLeaderboard}
            className="absolute top-6 left-6 px-6 py-3
          bg-gradient-to-r from-purple-500 to-indigo-500
          hover:from-purple-600 hover:to-indigo-600
          text-white font-bold rounded-lg shadow-lg
          transition-all duration-300 hover:scale-105"
        >
          🏆 Leaderboard
        </button>

        {/* 카드 확대 모달 */}
        {(selectedCard !== null || isAnimating) && cardRect && (
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${
                    selectedCard !== null && !isAnimating ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/0'
                }`}
                onClick={handleCloseCard}
            >
              <div className="fixed [perspective:1000px]"
                  style={getModalStyle()}
                  onClick={(e) => e.stopPropagation()}
              >
                <div
                    className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d]
                        ${isFlippedInModal ? "[transform:rotateY(180deg)]" : ""}`}
                >
                  {/* 카드 뒷면 */}
                  <div className="absolute w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden">
                    <Image
                        src="/welcometosasa/pc.png"
                        alt="카드 뒷면"
                        fill
                        className="object-cover"
                    />
                  </div>

                  {/* 카드 앞면 */}
                  <div
                      className={`absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]
                          ${getCardBackground(rare[selectedCard ?? 0])}
                          rounded-2xl flex flex-col justify-center items-center
                          text-white shadow-2xl overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />

                    <span className="text-[120px] font-jersey font-bold drop-shadow-lg relative z-10">
                      {list[selectedCard ?? 0]}
                    </span>

                    <p className="absolute bottom-6 text-white/70 text-lg">
                      클릭하여 닫기
                    </p>
                  </div>
                </div>
            </div>
          </div>
          )}

        {showLeaderboard && (
            <div
                className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/welcometosasa/PB.png')" }}
            >
              <div className="absolute inset-0 bg-black/40" />

              <div className="flex justify-between items-center p-4 relative z-10">
                <h2 className="text-4xl font-bold text-white font-stardust">
                  🏆 Leaderboard
                </h2>
                <button
                    onClick={handleClose}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500
                hover:from-red-600 hover:to-pink-600
                text-white text-xl font-bold rounded-xl transition-all duration-300 hover:scale-105"
                >✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <span className="text-white text-3xl">로딩 중...</span>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto relative" style={{ height: `${leaderboardData.length * ITEM_HEIGHT}px` }}>
                      {leaderboardData.map((player) => {
                        const playerId = getPlayerId(player);
                        const targetRank = getRank(playerId);
                        const yPosition = positions[playerId] ?? (targetRank * ITEM_HEIGHT);

                        return (
                            <div
                                key={playerId}
                                className={`absolute left-0 right-0 flex justify-between items-center p-6 rounded-2xl backdrop-blur-sm
                                  transition-all duration-1000 ease-in-out
                                  ${targetRank === 0 ? 'bg-gradient-to-r from-yellow-500/50 to-amber-500/50 border-4 border-yellow-400' :
                                    targetRank === 1 ? 'bg-gradient-to-r from-gray-300/50 to-slate-400/50 border-4 border-gray-300' :
                                        targetRank === 2 ? 'bg-gradient-to-r from-amber-600/50 to-orange-700/50 border-4 border-amber-600' :
                                            'bg-white/20 border border-white/30'}`}
                                style={{
                                  transform: `translateY(${yPosition}px)`,
                                  height: `${ITEM_HEIGHT - 24}px`,
                                  zIndex: leaderboardData.length - targetRank,
                                }}
                            >
                              <div className="flex items-center gap-6">
                                <span className={`text-4xl font-bold font-stardust w-20
                                  ${targetRank === 0 ? 'text-yellow-300' :
                                    targetRank === 1 ? 'text-gray-200' :
                                        targetRank === 2 ? 'text-amber-400' : 'text-white'}`}>
                                  #{targetRank + 1}
                                </span>
                                <span className="text-5xl text-white font-stardust">
                                  {player.name}
                                </span>
                              </div>
                              <span className={`text-5xl font-bold font-stardust transition-all duration-500 ${shouldAnimate ? 'text-green-400 scale-110' : 'text-amber-300'}`}>
                                {player.score}
                              </span>
                            </div>
                        );
                      })}
                    </div>
                )}
              </div>
            </div>
        )}
        <button
            onClick={shuffle}
            disabled={isShuffling}
            className="absolute top-6 right-6 px-6 py-3
          bg-gradient-to-r from-amber-500 to-orange-500
          hover:from-amber-600 hover:to-orange-600
          disabled:from-gray-500 disabled:to-gray-600
          text-white font-bold rounded-lg shadow-lg
          transition-all duration-300 hover:scale-105
          disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          🔀 Shuffle
        </button>

        <div className="grid grid-cols-6 gap-x-5 p-5 gap-y-10">
          {cardOrder.map((cardIndex, position) => (
              <div
                  key={position}
                  ref={(el) => cardRefs.current[position] = el}
                  className="w-[234px] h-[325px] cursor-pointer [perspective:1000px]
              transition-all duration-500 ease-in-out"
                  style={getCardStyle(position)}
                  onClick={() => handleCardClick(cardIndex, position)}
              >
                <div
                    className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d]
                hover:-translate-y-2 hover:shadow-2xl
                ${flippedCards[cardIndex] ? "[transform:rotateY(180deg)]" : ""}`}
                >
                  <div className="absolute w-full h-full [backface-visibility:hidden]
                rounded-xl overflow-hidden shadow-lg">
                    <Image
                        src="/welcometosasa/pc.png"
                        alt="카드 뒷면"
                        fill
                        className="object-cover"
                    />
                  </div><div className={`absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]
                    ${getCardBackground(rare[cardIndex])}
                    rounded-xl flex justify-center items-center
                    text-white text-[80px] shadow-lg font-jersey`}>
                  {list[cardIndex]}
                </div>
                </div>
              </div>
          ))}
        </div>
      </main>
  );
}
