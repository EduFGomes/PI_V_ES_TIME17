import { useDrag } from "react-dnd";

const GRADIENTES = {
  red:   "radial-gradient(circle at 35% 30%, #ff8080, #cc2020 60%, #800000)",
  black: "radial-gradient(circle at 35% 30%, #888, #333 60%, #000)",
  gold:  "radial-gradient(circle at 35% 30%, #ffe066, #d4a000 60%, #7a5a00)",
  white: "radial-gradient(circle at 35% 30%, #fff, #ccc 60%, #888)",
};

export default function Peca({ tipo, posicao, corPeca = "white", turno }) {
  const isJogador1 = tipo === 1 || tipo === 3;
  const isJogador2 = tipo === 2 || tipo === 4;
  const isDama = tipo === 3 || tipo === 4;

  // turno 1 = brancas jogam, turno 2 = pretas jogam
  const podeMover = (turno === 1 && isJogador1) || (turno === 2 && isJogador2);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PECA",
    item: podeMover ? { posicao } : null,
    canDrag: () => podeMover,
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  const bg = isJogador1
    ? GRADIENTES[corPeca] || GRADIENTES.white
    : "radial-gradient(circle at 35% 30%, #555, #1a1a1a 60%, #000)";

  return (
    <div
      ref={drag}
      style={{
        width: "80%",
        height: "80%",
        borderRadius: "50%",
        background: bg,
        border: "2px solid rgba(0,0,0,0.25)",
        boxShadow: isDragging
          ? "0 8px 20px #0009"
          : "0 2px 6px #0006, inset 0 1px 3px rgba(255,255,255,0.35)",
        opacity: isDragging ? 0.55 : podeMover ? 1 : 0.65,
        cursor: podeMover ? "grab" : "not-allowed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transition: "box-shadow 0.15s, opacity 0.15s",
      }}
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
  );
}