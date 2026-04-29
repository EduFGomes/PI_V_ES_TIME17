import { GRADIENTES, gradientePecaAdversario } from "./Peca";

const DISC = 32;
const STEP = 4;
const MAX_VISIBLE = 10;

/**
 * Miniaturas empilhadas das capturas.
 * variant "ia" = peças do jogador capturadas pela IA (cor das peças do jogador).
 * variant "jogador" = peças da IA capturadas pelo jogador (gradiente do adversário).
 */
export default function PilhaCapturas({ count, variant, corPeca }) {
  const n = Math.min(Math.max(count, 0), 12);
  const visible = Math.min(n, MAX_VISIBLE);
  if (visible === 0) return null;

  const bgPlayer = GRADIENTES[corPeca] || GRADIENTES.white;
  const bgAdv = gradientePecaAdversario(corPeca);
  const bg = variant === "ia" ? bgPlayer : bgAdv;

  const size = DISC + (visible - 1) * STEP;

  return (
    <div
      className={`pilha-capturas pilha-capturas--${variant}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {Array.from({ length: visible }, (_, i) => (
        <div
          key={i}
          className="pilha-capturas__disc"
          style={{
            background: bg,
            zIndex: visible - i,
            ...(variant === "ia"
              ? { top: i * STEP, left: i * STEP }
              : { bottom: i * STEP, right: i * STEP }),
          }}
        />
      ))}
    </div>
  );
}
