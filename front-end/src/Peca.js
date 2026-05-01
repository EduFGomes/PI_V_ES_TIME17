import { memo } from "react";

export const GRADIENTES = {
  red:   "radial-gradient(circle at 35% 30%, #ff8080, #cc2020 60%, #800000)",
  black: "radial-gradient(circle at 35% 30%, #888, #333 60%, #000)",
  gold:  "radial-gradient(circle at 35% 30%, #ffe066, #d4a000 60%, #7a5a00)",
  white: "radial-gradient(circle at 35% 30%, #fff, #ccc 60%, #888)",
};

export function gradientePecaAdversario(corPeca) {
  return corPeca === "black"
    ? GRADIENTES.white
    : "radial-gradient(circle at 35% 30%, #555, #1a1a1a 60%, #000)";
}

function Peca({
  tipo,
  corPeca = "white",
  x,
  y,
  size,
  isDragging = false,
  canDrag = false,
  showMandatoryIdle = false,
  animate = true,
  zIndex = 2,
  onMouseDown,
}) {
  const isJogador1 = tipo === 1 || tipo === 3;
  const isDama = tipo === 3 || tipo === 4;

  const corAdversario = gradientePecaAdversario(corPeca);

  const bg = isJogador1
    ? GRADIENTES[corPeca] || GRADIENTES.white
    : corAdversario;

  return (
    <div
      className="piece-absolute"
      onMouseDown={onMouseDown}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transition: animate ? "transform 0.25s ease" : "none",
        zIndex,
        cursor: canDrag ? (isDragging ? "grabbing" : "grab") : "not-allowed",
      }}
    >
      <div
        style={{
          width: "80%",
          height: "80%",
          borderRadius: "50%",
          background: bg,
          border: "2px solid rgba(0,0,0,0.25)",
          boxShadow: isDragging
            ? "0 8px 20px #0009"
            : "0 2px 6px #0006, inset 0 1px 3px rgba(255,255,255,0.35)",
          opacity: isDragging ? 0.75 : canDrag ? 1 : 0.65,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "transform 0.12s ease, box-shadow 0.15s, opacity 0.15s",
          animation: showMandatoryIdle && !isDragging ? "mandatoryPieceIdle 1.05s ease-in-out infinite" : "none",
        }}
        className="piece-disc"
      >
        {isDama && (
          <span style={{
            position: "absolute",
            fontSize: 15,
            color: "gold",
            textShadow: "0 1px 3px #0008",
            userSelect: "none",
          }}>
            ♛
          </span>
        )}
      </div>
    </div>
  );
}

function areEqual(prev, next) {
  return (
    prev.tipo === next.tipo &&
    prev.corPeca === next.corPeca &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.size === next.size &&
    prev.isDragging === next.isDragging &&
    prev.canDrag === next.canDrag &&
    prev.showMandatoryIdle === next.showMandatoryIdle &&
    prev.animate === next.animate &&
    prev.zIndex === next.zIndex &&
    prev.onMouseDown === next.onMouseDown
  );
}

export default memo(Peca, areEqual);