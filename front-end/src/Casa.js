import { useDrop } from "react-dnd";

export default function Casa({ i, j, children, moverPeca }) {
  const [, drop] = useDrop(() => ({
    accept: "PECA",
    drop: (item) => {
      moverPeca(item.posicao, [i, j]);
    },
  }));

  return (
    <div
      ref={drop}
      style={{
        width: 70,
        height: 70,
        background: (i + j) % 2 === 0 ? "#f0d9b5" : "#b58863",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}