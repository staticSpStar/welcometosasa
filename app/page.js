"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [flippedCards, setFlippedCards] = useState(Array(12).fill(false));
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isGathering, setIsGathering] = useState(false);
  const list = ['+100', '+100', '+100', '+100', '+100', '+300', '+300', '+300', '+500', '+500', '+700', 'change!'];
  const rare = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4]

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

    // 모든 카드 앞면으로 뒤집기
    setFlippedCards(Array(12).fill(false));
    setIsShuffling(true);
    setIsGathering(true);

    // 중앙으로 모인 후 순서 변경
    setTimeout(() => {
      const newOrder = [...cardOrder];
      for (let i = newOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
      }
      setCardOrder(newOrder);
      
      // 다시 펼치기
      setTimeout(() => {
        setIsGathering(false);
        
        setTimeout(() => {
          setIsShuffling(false);
        }, 500);
      }, 300);
    }, 500);
  };

  // 카드 위치 계산 (중앙 모으기용)
  const getCardStyle = (position) => {
    if (isGathering) {
      // 6x2 그리드에서 중앙으로 모으기
      const row = Math.floor(position / 6);
      const col = position % 6;
      const centerCol = 2.5; // 6개 열의 중앙
      const centerRow = 0.5; // 2개 행의 중앙

      const offsetX = (col - centerCol) * -254; // 가로 이동
      const offsetY = (row - centerRow) * -345; // 세로 이동 (카드 높이 + gap)

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
            className={`w-[234px] h-[325px] cursor-pointer [perspective:1000px]
              transition-all duration-500 ease-in-out`}
            style={getCardStyle(position)}
            onClick={() => handleCardClick(cardIndex)}
          >
            <div
              className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] 
                hover:-translate-y-2 hover:shadow-2xl
                ${flippedCards[cardIndex] ? "[transform:rotateY(180deg)]" : ""}`}
            >
              {/* 앞면 */}
              <div className="absolute w-full h-full [backface-visibility:hidden] 
                rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/welcometosasa/pc.png"
                  alt="카드 뒷면"
                  fill
                  className="object-cover"
                />
              </div>
              {/* 뒷면 */}
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
              </div>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}