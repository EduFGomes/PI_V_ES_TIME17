import { useEffect, useState, useCallback } from "react";
import Peca from "./Peca";
import Casa from "./Casa";
import "./App.css";

const TELAS = {
  HOME: "home",
  CONFIG: "config",
  REGRAS: "regras",
  DIFICULDADE: "dificuldade",
  COR: "cor",
  MAPA: "mapa",
  JOGO: "jogo",
  VITORIA: "vitoria",
  DERROTA: "derrota",
};

const CORES_PECA = ["red", "black", "gold", "white"];
const NIVEIS = ["FÁCIL", "MÉDIO", "DIFÍCIL"];

export default function App() {
  const [tela, setTela] = useState(TELAS.HOME);
  const [tabuleiro, setTabuleiro] = useState([]);
  const [turno, setTurno] = useState(1);
  const [corPeca, setCorPeca] = useState("red");
  const [nivel, setNivel] = useState(0);
  const [vencedorMsg, setVencedorMsg] = useState("");
  const [confetes, setConfetes] = useState([]);
  const [dicaAtiva, setDicaAtiva] = useState(false);
  const [faseAtual, setFaseAtual] = useState(1);
  const fases = Array.from({ length: 10 }, (_, i) => i + 1);
  const [iaPensando, setIaPensando] = useState(false);
  const [pecaObrigatoria, setPecaObrigatoria] = useState(null);

  const carregarTabuleiro = useCallback(() => {
    fetch("http://localhost:5000/tabuleiro")
      .then((r) => r.json())
      .then((d) => {
        setTabuleiro(d.tabuleiro);
        setTurno(d.turno);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tela === TELAS.JOGO) carregarTabuleiro();
  }, [tela, carregarTabuleiro]);

  useEffect(() => {
    const salva = localStorage.getItem("faseAtual");
    if (salva) setFaseAtual(Number(salva));
  }, []);

  useEffect(() => {
    localStorage.setItem("faseAtual", faseAtual);
  }, [faseAtual]);

  function moverPeca(origem, destino) {
    fetch("http://localhost:5000/mover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origem, destino }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.sucesso) return;

        // Sempre atualiza primeiro
        setTabuleiro(d.tabuleiro);
        setTurno(d.turno);
        setPecaObrigatoria(d.peca_obrigatoria);

        //Captura múltipla → para aqui
        if (d.mensagem === "Continua") {
          return;
        }

        // se já venceu, para aqui
        if (d.vencedor !== null) {
          if (d.vencedor === 1) {
            spawnConfetes();
            setTela(TELAS.VITORIA);
          } else {
            setTela(TELAS.DERROTA);
          }
          return;
        }

        //2. IA começa a pensar
        setIaPensando(true);

        const delay = 600 + Math.random() * 800;

        setTimeout(() => {
          fetch("http://localhost:5000/ia", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            }, 
            body: JSON.stringify({ nivel, faseAtual }),
          })
            .then((r) => r.json())
            .then((ia) => {
              const caminho = ia?.caminho;

              if (!Array.isArray(caminho) || caminho.length < 2) {
                console.warn("IA retornou inválido:", ia);
                setIaPensando(false);
                return;
              }

              executarCaminhoIA([...caminho]); // ✅ AQUI DENTRO
            });
        }, delay);
      });
  }

  function reiniciar() {
    fetch("http://localhost:5000/resetar", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setTabuleiro(d.tabuleiro);
        setTurno(d.turno);
        setDicaAtiva(false);
        setTela(TELAS.JOGO);
      });
  }

  function desistir() {
    if (window.confirm("Deseja desistir da partida?")) {
      setVencedorMsg("O adversário venceu desta vez.");
      setFaseAtual(1);
      setTela(TELAS.DERROTA);
    }
  }

  function mostrarDica() {
    setDicaAtiva((v) => !v);
  }

  function spawnConfetes() {
    const cores = ["#f0a030", "#3ac430", "#4090e0", "#e04040", "#c030c0", "#fff", "#ffee00"];
    const novos = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: cores[i % cores.length],
      duration: 1.2 + Math.random() * 2,
      delay: Math.random() * 0.8,
    }));
    setConfetes(novos);
    setTimeout(() => setConfetes([]), 3500);
  }

  function executarCaminhoIA(caminho) {
    if (!Array.isArray(caminho) || caminho.length < 2) {
      console.warn("Caminho inválido:", caminho);
      setIaPensando(false);
      return;
    }

    let i = 0;

    function proximo() {
      if (i >= caminho.length - 1) {
        setIaPensando(false);
        return;
      }

      const origem = caminho[i];
      const destino = caminho[i + 1];

      fetch("http://localhost:5000/executar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ origem, destino }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!d.sucesso) {
            console.warn("Falha ao executar passo da IA:", origem, destino, d);
            setIaPensando(false);
            return;
          }

          setTabuleiro(d.tabuleiro);
          setTurno(d.turno);
          setPecaObrigatoria(d.peca_obrigatoria);

          // 🟢 SE ainda pode continuar captura
          if (d.mensagem === "Continua") {
            i++;
            setTimeout(proximo, 500 + Math.random() * 500);
            return;
          }

          // 🟢 SE terminou
          if (d.vencedor !== null) {
            setIaPensando(false);

            if (d.vencedor === 1) {
              spawnConfetes();
              setTela(TELAS.VITORIA);
            } else {
              setTela(TELAS.DERROTA);
            }
            return;
          }

          // 🟢 segue fluxo normal
          i++;
          setTimeout(proximo, 500 + Math.random() * 500);
        });
    }

    proximo();
  }

  return (
    <div className="game-root">
      {/* Fundo céu */}
      <div className="sky-bg">
        <div className="cloud" style={{ width: 90, height: 22, top: 30, left: "6%" }} />
        <div className="cloud" style={{ width: 130, height: 28, top: 55, left: "25%" }} />
        <div className="cloud" style={{ width: 80, height: 20, top: 25, left: "68%" }} />
        <div className="cloud" style={{ width: 110, height: 26, top: 50, left: "75%" }} />
      </div>

      {/* Confetes */}
      <div className="confetti-wrap">
        {confetes.map((c) => (
          <div
            key={c.id}
            className="conf"
            style={{
              left: `${c.left}%`,
              background: c.color,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── TELA INICIAL ── */}
      {tela === TELAS.HOME && (
        <div className="screen">
          <div className="panel">
            <div className="panel-sub">Jogo de</div>
            <div className="panel-title big">DAMAS</div>
            <button className="btn green" onClick={() => setTela(TELAS.DIFICULDADE)}>JOGAR</button>
            <button className="btn" onClick={() => setTela(TELAS.CONFIG)}>CONFIGURAÇÕES</button>
            <button className="btn blue" onClick={() => setTela(TELAS.REGRAS)}>COMO JOGAR</button>
          </div>
        </div>
      )}

      {/* ── TELA DIFICULDADE ── */}
      {tela === TELAS.DIFICULDADE && (
        <div className="screen">
          <div className="panel">
            <div className="panel-title">Escolha a dificuldade</div>

            {NIVEIS.map((n, i) => (
              <button
                key={n}
                className={`lvl-btn ${["easy", "med", "hard"][i]}`}
                onClick={() => {
                  setNivel(i);
                  setTela(TELAS.COR);
                }}
              >
                {n}
              </button>
            ))}

            <button className="btn gray sm" onClick={() => setTela(TELAS.HOME)}>
              VOLTAR
            </button>
          </div>
        </div>
      )}

      {/* ── TELA ESCOLHA DE COR ── */}
      {tela === TELAS.COR && (
        <div className="screen">
          <div className="panel">
            <div className="panel-title">Escolha sua peça</div>

            <div className="piece-grid">
              {CORES_PECA.map((cor) => (
                <div
                  key={cor}
                  className={`piece-opt ${cor}`}
                  onClick={() => {
                    setCorPeca(cor);
                    setTela(TELAS.MAPA); // próxima etapa
                  }}
                />
              ))}
            </div>

            <button className="btn gray sm" onClick={() => setTela(TELAS.DIFICULDADE)}>
              VOLTAR
            </button>
          </div>
        </div>
      )}

    {/*TELA MAPA DE FASES*/}
      {tela === TELAS.MAPA && (
        <div className="screen">
          <div className="panel">
            <div className="panel-title">Selecione a fase</div>

            {fases.map((fase) => (
              <button
                key={fase}
                className="btn"
                disabled={fase !== faseAtual}
                style={{
                  opacity: fase === faseAtual ? 1 : 0.5,
                  cursor: fase === faseAtual ? "pointer" : "not-allowed"
                }}
                onClick={() => {
                  if (fase === faseAtual) {
                    setTela(TELAS.JOGO);
                  }
                }}
              >
                Fase {fase}
              </button>
            ))}

            <button className="btn gray sm" onClick={() => setTela(TELAS.COR)}>
              VOLTAR
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIGURAÇÕES ── */}
      {tela === TELAS.CONFIG && (
        <div className="screen">
          <div className="panel">
            <div className="panel-title">Escolha sua peça</div>
            <div className="piece-grid">
              {CORES_PECA.map((cor) => (
                <div
                  key={cor}
                  className={`piece-opt ${cor}${corPeca === cor ? " selected" : ""}`}
                  onClick={() => setCorPeca(cor)}
                />
              ))}
            </div>
            <div className="panel-sub" style={{ marginTop: 6 }}>Nível</div>
            {NIVEIS.map((n, i) => (
              <button
                key={n}
                className={`lvl-btn ${["easy", "med", "hard"][i]}${nivel === i ? " active" : ""}`}
                onClick={() => setNivel(i)}
              >
                {n}
              </button>
            ))}
            <div className="btn-row">
              <button className="btn gray sm" onClick={() => setTela(TELAS.HOME)}>VOLTAR</button>
              <button className="btn green sm" onClick={() => setTela(TELAS.JOGO)}>CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMO JOGAR ── */}
      {tela === TELAS.REGRAS && (
        <div className="screen">
          <div className="panel">
            <div className="panel-title" style={{ fontSize: 24 }}>Regras do jogo</div>
            {[
              "Movimente suas peças na diagonal",
              "Capture as peças do adversário pulando por cima delas",
              "Transforme sua peça em Dama chegando ao outro lado do tabuleiro",
              "Capture todas as peças adversárias para vencer!",
            ].map((regra) => (
              <div className="rule-item" key={regra}>
                <div className="rule-check">✓</div>
                <div className="rule-text">{regra}</div>
              </div>
            ))}
            <button className="btn green" style={{ marginTop: 12 }} onClick={() => setTela(TELAS.HOME)}>
              ENTENDI
            </button>
          </div>
        </div>
      )}

      {/* ── TELA DE JOGO ── */}
      {tela === TELAS.JOGO && (
        <div className="screen game-screen">
          <div className="board-wrap">
            {iaPensando && (
              <div className="thinking">
                IA pensando...
              </div>
            )}
            <div className="turn-badge-wrap">
              <div className="turn-badge">
                <div
                  className="turn-dot"
                  style={{ background: turno === 1 ? "#eee" : "#222", border: "2px solid #0003" }}
                />
                <span>{turno === 1 ? "VEZ DAS BRANCAS" : "VEZ DAS PRETAS"}</span>
              </div>
            </div>

            <div className="board">
              {tabuleiro.map((linha, i) =>
                linha.map((casa, j) => (
                  <Casa key={`${i}-${j}`} i={i} j={j} moverPeca={
                    !iaPensando && turno === 1
                      ? moverPeca
                      : () => { } // função vazia
                  } dicaAtiva={dicaAtiva}>
                    {casa !== 0 && <Peca
                      tipo={casa}
                      posicao={[i, j]}
                      corPeca={corPeca}
                      turno={turno}
                      iaPensando={iaPensando}
                      pecaObrigatoria={pecaObrigatoria}
                    />}
                  </Casa>
                ))
              )}
            </div>

            <div className="board-btns">
              <button className="btn sm" onClick={mostrarDica}>
                {dicaAtiva ? "OCULTAR" : "DICA"}
              </button>
              <button className="btn red sm" onClick={desistir}>DESISTIR</button>
              <button className="btn gray sm" onClick={reiniciar}>REINICIAR</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VITÓRIA ── */}
      {tela === TELAS.VITORIA && (
        <div className="screen">
          <div className="panel win-panel">
            <div className="panel-title" style={{ fontSize: 32, color: "#c07800" }}>VITÓRIA</div>
            <div className="trophy">🏆</div>
            <div className="win-sub">VOCÊ VENCEU!</div>
            <div className="btn-row">
              <button
                className="btn green sm"
                onClick={() => {
                  setFaseAtual((f) => Math.min(f + 1, fases.length));
                  setTela(TELAS.MAPA);
                }}
              >
                CONTINUAR
              </button>
              <button className="btn sm" onClick={() => setTela(TELAS.HOME)}>MENU</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DERROTA ── */}
      {tela === TELAS.DERROTA && (
        <div className="screen">
          <div className="panel lose-panel">
            <div className="panel-title" style={{ fontSize: 26, color: "#800" }}>FIM DE JOGO</div>
            <div className="hearts">
            </div>
            <div className="lose-sub">O ADVERSÁRIO VENCEU DESTA VEZ</div>
            <div className="btn-row">
              <button className="btn green sm" onClick={reiniciar}>REINICIAR</button>
              <button
                className="btn sm"
                onClick={() => {
                  setFaseAtual(1);
                  setTela(TELAS.HOME);
                }}
              >
                MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}