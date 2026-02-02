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
    const currentSortOrder = newSorted.map(p => p._id || p.id).join(',');
    const currentScores = newSorted.reduce((acc, p) => {
      acc[p._id || p.id] = p.score;
      return acc;
    }, {});

    // 새로운 위치 계산
    const newPositions = {};
    newSorted.forEach((player, index) => {
      const id = player._id || player.id;
      newPositions[id] = index * ITEM_HEIGHT;
    });

    // 순위 또는 점수 변경 감지
    const hasRankChange = prevSortOrderRef.current !== null &&
        prevSortOrderRef.current !== currentSortOrder;

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
    return sortedData.findIndex(p => (p._id || p.id) === playerId);
  }, [sortedData]);

  const handleCardClick = (index) => {
    if (isShuffling) return;
    setFlippedCards((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const shuffle = () => {
    if (isShuffling) return;

    setFlippedCards(Array(12).fill(false));
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
    }
    return {};
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
                        const playerId = player._id || player.id;
                        const targetRank = getRank(playerId);
                        const yPosition = positions[playerId] ?? (targetRank * ITEM_HEIGHT);

                        return (
                            <div
                                key={playerId}
                                className={`absolute left-0 right-0 flex justify-between items-center p-6 rounded-2xl backdrop-blur-sm
                                  transition-all duration-1000 ease-in-out
                                  ${targetRank === 0 ? 'bg-gradient-to-r from-yellow-500/50 to-amber-500/50 border-4 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.5)]' :
                                    targetRank === 1 ? 'bg-gradient-to-r from-gray-300/50 to-slate-400/50 border-4 border-gray-300 shadow-[0_0_20px_rgba(156,163,175,0.4)]' :
                                        targetRank === 2 ? 'bg-gradient-to-r from-orange-500/50 to-amber-600/50 border-4 border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.4)]' :
                                            'bg-slate-800/60 border-2 border-slate-500'}`}
                                style={{
                                  transform: `translateY(${yPosition}px)`,
                                  height: `${ITEM_HEIGHT - 24}px`,
                                  zIndex: leaderboardData.length - targetRank,
                                }}
                            >
                              <div className="flex items-center gap-6">
                                <span className={`text-4xl font-bold font-stardust w-20 transition-all duration-500
                                  ${targetRank === 0 ? 'text-yellow-300' :
                                    targetRank === 1 ? 'text-gray-200' :
                                        targetRank === 2 ? 'text-orange-300' : 'text-white'}`}>
                                  {targetRank + 1}
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
                  className="w-[234px] h-[325px] cursor-pointer [perspective:1000px]
              transition-all duration-500 ease-in-out"
                  style={getCardStyle(position)}
                  onClick={() => handleCardClick(cardIndex)}
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
                  </div>
                  {rare[cardIndex]===0 && <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]
                bg-gradient-to-br from-gray-300 to-gray-500
                rounded-xl flex justify-center items-center
                text-white text-[80px] shadow-lg font-jersey">
                    {list[cardIndex]}
                  </div>}
                  {rare[cardIndex]===1 && <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]
                bg-gradient-to-br from-green-400 to-green-600
                rounded-xl flex justify-center items-center
                text-white text-[80px] shadow-lg font-jersey">
                    {list[cardIndex]}
                  </div>}
                  {rare[cardIndex]===2 && <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]
                bg-gradient-to-br from-yellow-300 to-yellow-500
                rounded-xl flex justify-center items-center
                text-white text-[80px] shadow-lg font-jersey">
                    {list[cardIndex]}
                  </div>}
                  {rare[cardIndex]===3 && <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]
                bg-gradient-to-br from-blue-500 to-green-500
                rounded-xl flex justify-center items-center
                text-white text-[80px] shadow-lg font-jersey">
                    {list[cardIndex]}
                  </div>}
                  {rare[cardIndex]===4 && <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]
                bg-gradient-to-br from-pink-400 to-blue-500
                rounded-xl flex justify-center items-center
                text-white text-[80px] shadow-lg font-jersey">
                    {list[cardIndex]}
                  </div>}</div>
              </div>
          ))}
        </div>
      </main>
  );
}
