import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";

function sendDebugLog(payload) {
  fetch("http://127.0.0.1:7682/ingest/006b32d1-80cd-4e64-a964-7f431c626e24", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "684460",
    },
    body: JSON.stringify({
      sessionId: "684460",
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
}

// #region agent log
sendDebugLog({
  runId: "run-1",
  hypothesisId: "H2",
  location: "TutorialModal.js:7",
  message: "TutorialModal module loaded",
  data: { importsResolved: true },
});
// #endregion

const SLIDES = [
  {
    id: "movimento",
    titulo: "1. Movimento",
    texto: "Arraste a peça branca para o círculo verde.",
    start: [2, 1],
    target: [1, 2],
    enemy: null,
  },
  {
    id: "captura",
    titulo: "2. Captura",
    texto: "Pule a peça preta arrastando para o alvo!",
    start: [3, 0],
    target: [1, 2],
    enemy: [2, 1],
  },
  {
    id: "dama",
    titulo: "3. Virando Dama",
    texto: "Arraste até o final do tabuleiro para virar Dama!",
    start: [1, 2],
    target: [0, 3],
    becomesDama: true,
  },
  {
    id: "poder",
    titulo: "4. Poder da Dama",
    texto: "A Dama pula de longe! Arraste e capture.",
    start: [3, 0],
    startIsDama: true,
    target: [0, 3],
    enemy: [1, 2],
  },
];

// Componente isolado para a Peça Arrastável
function MiniPeca({ isDama, isDraggable }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TUTORIAL_PECA",
    canDrag: () => isDraggable,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [isDraggable]);

  return (
    <div
      ref={drag}
      className="mini-peca white"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDraggable ? "grab" : "default",
        transform: isDragging ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.1s"
      }}
    >
      {isDama && <span style={{ color: "gold", fontSize: "14px" }}>♛</span>}
    </div>
  );
}

function MiniCasa({ r, c, isDark, isTarget, onDrop, children }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "TUTORIAL_PECA",
    drop: () => onDrop(r, c),
    canDrop: () => isTarget, 
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [isTarget, r, c, onDrop]);

  let bgClass = isDark ? "dark" : "light";
  if (isOver && canDrop) bgClass = "highlight"; 

  return (
    <div ref={drop} className={`mini-casa ${bgClass}`}>
      {children}
      
      {isTarget && <div className="mini-target-hint" />}
    </div>
  );
}

// O Mini-Tabuleiro Interativo
function InteractiveBoard({ config, onComplete }) {
  const [pecaPos, setPecaPos] = useState(config.start);
  const [enemyPos, setEnemyPos] = useState(config.enemy);
  const [isDama, setIsDama] = useState(config.startIsDama);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    // #region agent log
    sendDebugLog({
      runId: "run-1",
      hypothesisId: "H3",
      location: "TutorialModal.js:119",
      message: "InteractiveBoard reset state from slide config",
      data: { slideId: config.id, start: config.start, target: config.target },
    });
    // #endregion
    setPecaPos(config.start);
    setEnemyPos(config.enemy);
    setIsDama(config.startIsDama || false);
    setConcluido(false);
  }, [config]);

  const handleDrop = (r, c) => {
    if (r === config.target[0] && c === config.target[1]) {
      // #region agent log
      sendDebugLog({
        runId: "run-1",
        hypothesisId: "H4",
        location: "TutorialModal.js:127",
        message: "Valid tutorial move completed",
        data: { slideId: config.id, drop: [r, c], target: config.target },
      });
      // #endregion
      setPecaPos([r, c]);
      setEnemyPos(null);
      if (config.becomesDama) setIsDama(true);
      
      setConcluido(true);
      setTimeout(() => onComplete(), 400); 
    }
  };

  const grid = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isDark = (r + c) % 2 !== 0;
      const isPeca = pecaPos[0] === r && pecaPos[1] === c;
      const isEnemy = enemyPos && enemyPos[0] === r && enemyPos[1] === c;
      const isTarget = !concluido && config.target[0] === r && config.target[1] === c;

      grid.push(
        <MiniCasa 
          key={`${r}-${c}`} 
          r={r} 
          c={c} 
          isDark={isDark} 
          isTarget={isTarget} 
          onDrop={handleDrop}
        >
          {/* Peça Inimiga Estática */}
          <AnimatePresence>
            {isEnemy && (
              <motion.div
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="mini-peca black"
              />
            )}
          </AnimatePresence>

          {/* Peça do Jogador*/}
          {isPeca && (
            <MiniPeca isDama={isDama} isDraggable={!concluido} />
          )}
        </MiniCasa>
      );
    }
  }

  return <div className="mini-board-wrap"><div className="mini-board">{grid}</div></div>;
}

// Modal Principal
export default function TutorialModal({ onClose }) {
  const [passoAtual, setPassoAtual] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const slide = SLIDES[passoAtual];
  const isUltimoPasso = passoAtual === SLIDES.length - 1;

  const proximoPasso = () => {
    if (isUltimoPasso) {
      onClose();
    } else {
      setDirecao(1);
      setPassoAtual((prev) => prev + 1);
      setPodeAvancar(false); 
    }
  };

  const passoAnterior = () => {
    if (passoAtual > 0) {
      setDirecao(-1);
      setPassoAtual((prev) => prev - 1);
      setPodeAvancar(false);
    }
  };

  const animacaoSlide = {
    entrar: (direcao) => ({ x: direcao > 0 ? 100 : -100, opacity: 0 }),
    centro: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
    sair: (direcao) => ({ x: direcao < 0 ? 100 : -100, opacity: 0, transition: { duration: 0.2 } }),
  };

  useEffect(() => {
    // #region agent log
    sendDebugLog({
      runId: "run-1",
      hypothesisId: "H1",
      location: "TutorialModal.js:220",
      message: "TutorialModal rendered",
      data: { passoAtual, totalSlides: SLIDES.length },
    });
    // #endregion
  }, [passoAtual]);

  return (
    <div className="tutorial-overlay">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="tutorial-modal"
      >
        <button onClick={onClose} className="tutorial-close">
          <X size={22} strokeWidth={2.5} />
        </button>

        <h2 className="tutorial-title" style={{ marginBottom: "16px" }}>Como Jogar</h2>

        <div className="tutorial-carousel-board">
          <AnimatePresence custom={direcao} mode="wait">
            <motion.div
              key={passoAtual}
              custom={direcao}
              variants={animacaoSlide}
              initial="entrar"
              animate="centro"
              exit="sair"
              className="tutorial-slide-board"
            >
              
              <InteractiveBoard 
                config={slide} 
                onComplete={() => setPodeAvancar(true)} 
              />
              
              <h3 style={{ marginTop: "12px" }}>{slide.titulo}</h3>
              
              <div className="tutorial-instruction">
                {podeAvancar ? (
                  <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="tutorial-success">
                    <Check size={20} strokeWidth={4} /> Muito bem!
                  </motion.p>
                ) : (
                  <p>{slide.texto}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="tutorial-dots">
          {SLIDES.map((_, index) => (
            <div key={index} className={`tutorial-dot ${index === passoAtual ? "active" : "inactive"}`} />
          ))}
        </div>

        <div className="tutorial-actions">
          {passoAtual > 0 && (
            <button onClick={passoAnterior} className="btn gray" style={{ flex: 1 }}>
              VOLTAR
            </button>
          )}
          
          <button 
            onClick={proximoPasso} 
            disabled={!podeAvancar}
            className={`btn ${!podeAvancar ? 'gray' : isUltimoPasso ? 'green' : 'blue'}`} 
            style={{ flex: 2, opacity: podeAvancar ? 1 : 0.5, cursor: podeAvancar ? "pointer" : "not-allowed" }}
          >
            {isUltimoPasso ? "JOGAR!" : "PRÓXIMO"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}