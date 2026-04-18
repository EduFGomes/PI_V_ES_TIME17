import { useDrop } from "react-dnd";

export default function Casa({ i, j, children, moverPeca, dicaAtiva }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "PECA",
    drop: (item) => {
      moverPeca(item.posicao, [i, j]);
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  const isDark = (i + j) % 2 !== 0;

  let bg;
  if (isOver && isDark) {
    bg = "#90c050";
  } else if (isDark) {
    bg = "#c08040";
  } else {
    bg = "#f0d0a0";
  }

  return (
    <div
      ref={drop}
      style={{
        width: "100%",
        aspectRatio: "1",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
        cursor: isDark ? "pointer" : "default",
      }}
    >
      {children}
    </div>
  );
}