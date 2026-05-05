export default function Casa({ i, j, isOrigemDica, isDestinoDica, isObrigatoria }) {
  const isDark = (i + j) % 2 !== 0;

  let bg;
  if (isDestinoDica && isDark) {
    bg = "#80cc80"; // Verde indicando possível destino
  } else if (isOrigemDica && isDark) {
    bg = "#ffc040"; // Laranja/Amarelo indicando a peça que pode se mover
  } else if (isDark) {
    bg = "#c08040";
  } else {
    bg = "#f0d0a0";
  }

  return (
    <div
      className={`board-cell ${isObrigatoria ? "board-cell--mandatory" : ""}`}
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
      {isObrigatoria && <div className="mandatory-overlay" />}
    </div>
  );
}