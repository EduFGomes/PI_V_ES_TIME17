import { useDrag } from "react-dnd";

export default function Peca({ tipo, posicao }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PECA",
    item: { posicao },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  function renderPeca(valor) {
    if (valor === 1) return "⚪";
    if (valor === 2) return "⚫";
    if (valor === 3) return "👑⚪";
    if (valor === 4) return "👑⚫";
    return "";
  }

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        fontSize: 30,
        cursor: "grab",
      }}
    >
      {renderPeca(tipo)}
    </div>
  );
}