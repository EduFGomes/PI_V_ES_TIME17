import { useEffect, useState, useCallback, useRef } from "react";
import Peca from "./Peca";
import Casa from "./Casa";
import "./App.css";

import bgLandscape from "./assets/background_landscape.jpg";
import bgSunset from "./assets/background_landscape_sunset.jpg";
import bgNight from "./assets/background_landscape_night.png";

const BACKGROUNDS = [bgLandscape, bgSunset, bgNight];

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
const NOMES_CORES_PT = {
  red: "VERMELHAS",
  black: "PRETAS",
  gold: "AMARELAS",
  white: "BRANCAS"
};
const NIVEIS = ["DIVERTIDO", "AVENTUREIRO", "EXPERIENTE"];
const TOTAL_PECAS_POR_LADO = 12;

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
  const [faseSelecionada, setFaseSelecionada] = useState(1);
  const fases = Array.from({ length: 10 }, (_, i) => i + 1);
  const [iaPensando, setIaPensando] = useState(false);
  const [pecaObrigatoria, setPecaObrigatoria] = useState(null);
  const [adversarioImgErro, setAdversarioImgErro] = useState(false);
  const somMovimentoRef = useRef(null);
  const somVitoriaRef = useRef(null);

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
    if (salva) {
      const faseSalva = Number(salva);
      setFaseAtual(faseSalva);
      setFaseSelecionada(faseSalva);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("faseAtual", faseAtual);
  }, [faseAtual]);

  useEffect(() => {
    // Instancia os audios uma vez para evitar recriacao em cada render.
    somMovimentoRef.current = new Audio("/sounds/moviment.mp3");
    somVitoriaRef.current = new Audio("/sounds/win.mp3");
  }, []);

  function tocarSomMovimento() {
    if (!somMovimentoRef.current) return;
    somMovimentoRef.current.currentTime = 0;
    somMovimentoRef.current.play().catch(() => {});
  }

  function tocarSomVitoria() {
    if (!somVitoriaRef.current) return;
    somVitoriaRef.current.currentTime = 0;
    somVitoriaRef.current.play().catch(() => {});
  }

  const pecasBrancasNoTabuleiro = tabuleiro.flat().filter((p) => p === 1 || p === 3).length;
  const pecasPretasNoTabuleiro = tabuleiro.flat().filter((p) => p === 2 || p === 4).length;
  const capturadasPelaIA = TOTAL_PECAS_POR_LADO - pecasBrancasNoTabuleiro;
  const capturadasPeloJogador = TOTAL_PECAS_POR_LADO - pecasPretasNoTabuleiro;
  const nomeFase = `Fase ${faseSelecionada}`;
  const caminhoImagemAdversario = `/adversarios/fase${faseSelecionada}.png`;

  function chamarIA(fase) {
    setIaPensando(true);
    const delay = 600 + Math.random() * 800;

    setTimeout(() => {
      fetch("http://localhost:5000/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivel, faseAtual: fase }),
      })
        .then((r) => r.json())
        .then((ia) => {
          if (ia?.vencedor !== undefined && ia?.vencedor !== null) {
            setIaPensando(false);
            setVencedorMsg(ia.mensagem_vitoria || "");
            if (ia.vencedor === 1) {
              tocarSomVitoria();
              spawnConfetes();
              setTela(TELAS.VITORIA);
            } else {
              setTela(TELAS.DERROTA);
            }
            return;
          }

          const caminho = ia?.caminho;

          if (!Array.isArray(caminho) || caminho.length < 2) {
            console.warn("IA retornou inválido:", ia);
            setIaPensando(false);
            return;
          }

          executarCaminhoIA([...caminho]);
        });
    }, delay);
  }

  function iniciarFase(fase) {
    setFaseSelecionada(fase);
    setAdversarioImgErro(false);
    fetch("http://localhost:5000/resetar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inverter: corPeca === "black" })
    })
      .then((r) => r.json())
      .then((d) => {
        setTabuleiro(d.tabuleiro);
        setTurno(d.turno);
        setPecaObrigatoria(null);
        setDicaAtiva(false);
        setIaPensando(false);
        setVencedorMsg("");
        setTela(TELAS.JOGO);

        if (d.turno === 2) {
          chamarIA(fase);
        }
      });
  }

  function moverPeca(origem, destino) {
    fetch("http://localhost:5000/mover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origem, destino }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.sucesso) return;
        tocarSomMovimento();

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
          setVencedorMsg(d.mensagem_vitoria || "");
          if (d.vencedor === 1) {
            tocarSomVitoria();
            spawnConfetes();
            setTela(TELAS.VITORIA);
          } else {
            setTela(TELAS.DERROTA);
          }
          return;
        }

        //2. IA começa a pensar
        chamarIA(faseSelecionada);
      });
  }

  function reiniciar() {
    fetch("http://localhost:5000/resetar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inverter: corPeca === "black" })
    })
      .then((r) => r.json())
      .then((d) => {
        setTabuleiro(d.tabuleiro);
        setTurno(d.turno);
        setPecaObrigatoria(null);
        setDicaAtiva(false);
        setIaPensando(false);
        setVencedorMsg("");
        setTela(TELAS.JOGO);

        if (d.turno === 2) {
          chamarIA(faseSelecionada);
        }
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
          tocarSomMovimento();

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
            setVencedorMsg(d.mensagem_vitoria || "");

            if (d.vencedor === 1) {
              tocarSomVitoria();
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
      <div className="sky-bg" style={{ backgroundImage: `url(${BACKGROUNDS[nivel]})` }}>
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
          <div className="panel map-panel">
            <div className="panel-title">Selecione a fase</div>

            <div className="phase-legend">
              <span>Jogue qualquer fase já liberada.</span>
              <span>Vença sua fase atual para avançar.</span>
            </div>

            <div className="map-container" aria-label="Mapa de progressão de fases">
              {/* Trilha em estilo mobile/cartoon com nós conectados */}
              {fases.map((fase, idx) => {
                const desbloqueada = fase <= faseAtual;
                const concluida = fase < faseAtual;
                const atual = fase === faseAtual;
                const selecionada = fase === faseSelecionada;
                const isDireita = idx % 2 !== 0;
                const deslocamento = isDireita ? "to-right" : "to-left";

                return (
                  <div key={fase} className={`map-row ${deslocamento}`}>
                    <button
                      className={`fase-node${concluida ? " completed" : ""}${atual ? " current" : ""}${!desbloqueada ? " locked" : ""}${selecionada ? " selected" : ""}`}
                      disabled={!desbloqueada}
                      title={desbloqueada ? `Entrar na Fase ${fase}` : "Fase bloqueada"}
                      onClick={() => iniciarFase(fase)}
                    >
                      <span className="fase-icon">{desbloqueada ? `F${fase}` : "🔒"}</span>
                    </button>

                    <div className="fase-info">
                      <div className="fase-label">Fase {fase}</div>
                      <div className="fase-status">
                        {concluida ? "Concluída" : atual ? "Atual" : "Bloqueada"}
                      </div>
                      {/* Espaço futuro: avatar adversário / estrelas */}
                      <div className="fase-extra-slot">★ ★ ★</div>
                    </div>

                    {idx < fases.length - 1 && <div className="map-path" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>

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
              <button className="btn green sm" onClick={() => iniciarFase(faseAtual)}>CONFIRMAR</button>
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
          <div className="game-layout">
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
                  style={{ background: turno === 1 ? (corPeca === "red" ? "#ff4d4d" : corPeca === "gold" ? "#ffd700" : corPeca === "black" ? "#444" : "#eee") : "#222", border: "2px solid #0003" }}
                />
                <span>{turno === 1 ? `VEZ DAS ${NOMES_CORES_PT[corPeca] || "BRANCAS"}` : (corPeca === "black" ? "VEZ DAS BRANCAS" : "VEZ DAS PRETAS")}</span>
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

            <aside className="info-column">
              <div className="side-panel">
                <div className="side-title">Adversário da fase</div>
                <img
                  className="adversario-img"
                  src={adversarioImgErro ? "/adversarios/placeholder.svg" : caminhoImagemAdversario}
                  alt={`Adversário da ${nomeFase}`}
                  onError={() => setAdversarioImgErro(true)}
                />
                <div className="phase-name">{nomeFase}</div>
                <div className="counter danger">Peças capturadas pela IA: <strong>{capturadasPelaIA}</strong></div>
              </div>

              <div className="side-panel">
                <div className="side-title">Seu progresso na partida</div>
                <div className="counter good">Peças capturadas por você: <strong>{capturadasPeloJogador}</strong></div>
                <div className="counter neutral">Fase de progresso atual: <strong>{faseAtual}</strong></div>
              </div>
            </aside>
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
            {vencedorMsg && <div className="panel-sub">{vencedorMsg}</div>}
            <div className="btn-row">
              <button
                className="btn green sm"
                onClick={() => {
                  if (faseSelecionada === faseAtual) {
                    const proxima = Math.min(faseAtual + 1, fases.length);
                    setFaseAtual(proxima);
                    setFaseSelecionada(proxima);
                  } else {
                    setFaseSelecionada(faseAtual);
                  }
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
            {vencedorMsg && <div className="panel-sub">{vencedorMsg}</div>}
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