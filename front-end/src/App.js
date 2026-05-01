import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Peca from "./Peca";
import PilhaCapturas from "./PilhaCapturas";
import Casa from "./Casa";
import "./App.css";
import TutorialModal from "./TutorialModal";

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
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const X_COORDS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const Y_COORDS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export default function App() {
  const [tela, setTela] = useState(TELAS.HOME);
  const [tabuleiro, setTabuleiro] = useState([]);
  const [turno, setTurno] = useState(1);
  const [corPeca, setCorPeca] = useState("red");
  const [nivel, setNivel] = useState(0);
  const [vencedorMsg, setVencedorMsg] = useState("");
  const [confetes, setConfetes] = useState([]);
  const [dicaAtiva, setDicaAtiva] = useState(false);
  const [jogadasPossiveis, setJogadasPossiveis] = useState([]);
  const [somLigado, setSomLigado] = useState(() => {
    const salvo = localStorage.getItem("somLigado");
    return salvo !== null ? JSON.parse(salvo) : true;
  });
  const [faseAtual, setFaseAtual] = useState(1);
  const [faseSelecionada, setFaseSelecionada] = useState(1);
  const fases = Array.from({ length: 10 }, (_, i) => i + 1);
  const [iaPensando, setIaPensando] = useState(false);
  const [pecaObrigatoria, setPecaObrigatoria] = useState(null);
  const [adversarioImgErro, setAdversarioImgErro] = useState(false);
  const [configJogoAberta, setConfigJogoAberta] = useState(false);
  const [boardSize, setBoardSize] = useState(0);
  const [dragState, setDragState] = useState(null);
  const [dropTransition, setDropTransition] = useState(null);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("sessionId");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("sessionId", id);
    }
    return id;
  });
  const somMovimentoRef = useRef(null);
  const somVitoriaRef = useRef(null);
  const boardAreaRef = useRef(null);
  const moverPecaRef = useRef(null);

  const carregarTabuleiro = useCallback(() => {
    fetch(`${API_URL}/tabuleiro?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        setTabuleiro(d.tabuleiro);
        setTurno(d.turno);
      })
      .catch(() => { });
  }, [sessionId]);

  const fetchDicas = useCallback(() => {
    fetch(`${API_URL}/dicas?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => setJogadasPossiveis(d.dicas || []))
      .catch(() => setJogadasPossiveis([]));
  }, [sessionId]);

  useEffect(() => {
    if (tela === TELAS.JOGO) carregarTabuleiro();
  }, [tela, carregarTabuleiro]);

  useEffect(() => {
    if (tela !== TELAS.JOGO) {
      setJogadasPossiveis([]);
      setConfigJogoAberta(false);
      return;
    }
    if (turno === 1 && !iaPensando) {
      fetchDicas();
      return;
    }
    setJogadasPossiveis([]);
  }, [tela, turno, iaPensando, tabuleiro, fetchDicas]);

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
    localStorage.setItem("somLigado", JSON.stringify(somLigado));
  }, [somLigado]);

  useEffect(() => {
    // Instancia os audios uma vez para evitar recriacao em cada render.
    somMovimentoRef.current = new Audio("/sounds/moviment.mp3");
    somVitoriaRef.current = new Audio("/sounds/win.mp3");
  }, []);

  useEffect(() => {
    if (!boardAreaRef.current) return;

    const updateBoardSize = () => {
      const width = boardAreaRef.current?.getBoundingClientRect().width ?? 0;
      setBoardSize(width);
    };

    updateBoardSize();
    const resizeObserver = new ResizeObserver(updateBoardSize);
    resizeObserver.observe(boardAreaRef.current);

    return () => resizeObserver.disconnect();
  }, [tela]);

  const tileSize = useMemo(() => (boardSize > 0 ? boardSize / 8 : 0), [boardSize]);
  const interactionLocked = iaPensando || !!dropTransition;

  const boardToPixel = useCallback((i, j) => ({
    x: j * tileSize,
    y: i * tileSize,
  }), [tileSize]);

  const canDragPiece = useCallback((tipo, posicao) => {
    const ehBranca = tipo === 1 || tipo === 3;
    return (
      !interactionLocked &&
      turno === 1 &&
      ehBranca &&
      (
        !pecaObrigatoria ||
        (posicao[0] === pecaObrigatoria[0] && posicao[1] === pecaObrigatoria[1])
      )
    );
  }, [interactionLocked, turno, pecaObrigatoria]);

  const isCaptureMove = useCallback((origem, destino) => {
    if (!Array.isArray(origem) || !Array.isArray(destino)) return false;
    const [oi, oj] = origem;
    const [di, dj] = destino;
    const deltaI = di - oi;
    const deltaJ = dj - oj;

    if (Math.abs(deltaI) < 2 || Math.abs(deltaJ) < 2 || Math.abs(deltaI) !== Math.abs(deltaJ)) {
      return false;
    }

    const stepI = deltaI > 0 ? 1 : -1;
    const stepJ = deltaJ > 0 ? 1 : -1;
    const origemTipo = tabuleiro[oi]?.[oj];
    if (!origemTipo) return false;

    const inimigos = origemTipo === 1 || origemTipo === 3 ? [2, 4] : [1, 3];
    let encontrouInimigo = false;

    for (let k = 1; k < Math.abs(deltaI); k++) {
      const ti = oi + stepI * k;
      const tj = oj + stepJ * k;
      const casa = tabuleiro[ti]?.[tj] ?? 0;
      if (casa === 0) continue;
      if (!inimigos.includes(casa)) return false;
      if (encontrouInimigo) return false;
      encontrouInimigo = true;
    }
    return encontrouInimigo;
  }, [tabuleiro]);

  const captureOrigins = useMemo(() => {
    const set = new Set();
    jogadasPossiveis.forEach((move) => {
      const origem = move?.[0];
      const destino = move?.[1];
      if (isCaptureMove(origem, destino)) {
        set.add(`${origem[0]}-${origem[1]}`);
      }
    });
    return set;
  }, [jogadasPossiveis, isCaptureMove]);

  const pieces = useMemo(() => {
    const data = [];
    tabuleiro.forEach((linha, i) => {
      linha.forEach((tipo, j) => {
        if (!tipo) return;
        if (dragState && dragState.origem[0] === i && dragState.origem[1] === j) return;
        if (dropTransition && dropTransition.origem[0] === i && dropTransition.origem[1] === j) return;
        data.push({ id: `${i}-${j}`, tipo, posicao: [i, j] });
      });
    });
    return data;
  }, [tabuleiro, dragState, dropTransition]);

  function tocarSomMovimento() {
    if (!somLigado || !somMovimentoRef.current) return;
    somMovimentoRef.current.currentTime = 0;
    somMovimentoRef.current.play().catch(() => { });
  }

  function tocarSomVitoria() {
    if (!somLigado || !somVitoriaRef.current) return;
    somVitoriaRef.current.currentTime = 0;
    somVitoriaRef.current.play().catch(() => { });
  }

  const iniciarDrag = useCallback((event, piece) => {
    if (!tileSize || !boardAreaRef.current || !canDragPiece(piece.tipo, piece.posicao)) return;
    event.preventDefault();
    const rect = boardAreaRef.current.getBoundingClientRect();
    const [i, j] = piece.posicao;
    const originPx = boardToPixel(i, j);
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    setDragState({
      tipo: piece.tipo,
      origem: piece.posicao,
      x: originPx.x,
      y: originPx.y,
      offsetX: relX - originPx.x,
      offsetY: relY - originPx.y,
    });
  }, [boardToPixel, canDragPiece, tileSize]);

  useEffect(() => {
    if (!dragState || !boardAreaRef.current) return;

    const onMouseMove = (event) => {
      const rect = boardAreaRef.current.getBoundingClientRect();
      const relX = event.clientX - rect.left;
      const relY = event.clientY - rect.top;
      setDragState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          x: relX - prev.offsetX,
          y: relY - prev.offsetY,
        };
      });
    };

    const onMouseUp = (event) => {
      if (!dragState) return;
      const rect = boardAreaRef.current.getBoundingClientRect();
      const relX = event.clientX - rect.left;
      const relY = event.clientY - rect.top;
      const destinoI = Math.floor(relY / tileSize);
      const destinoJ = Math.floor(relX / tileSize);
      const origem = dragState.origem;
      const destinoValido = destinoI >= 0 && destinoI < 8 && destinoJ >= 0 && destinoJ < 8;
      const moveuParaOutraCasa = origem[0] !== destinoI || origem[1] !== destinoJ;

      if (destinoValido && moveuParaOutraCasa) {
        const destino = [destinoI, destinoJ];
        const destinoPx = boardToPixel(destinoI, destinoJ);
        setDropTransition({
          tipo: dragState.tipo,
          origem,
          destino,
          x: destinoPx.x,
          y: destinoPx.y,
        });
        setDragState(null);
        moverPecaRef.current?.(origem, destino);
        return;
      }

      setDropTransition(null);
      setDragState(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragState, tileSize, boardToPixel]);

  const esperar = useCallback((ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }), []);

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
      fetch(`${API_URL}/ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivel, faseAtual: fase, session_id: sessionId }),
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
    fetch(`${API_URL}/resetar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inverter: corPeca === "black", session_id: sessionId })
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

  async function moverPeca(origem, destino) {
    if (interactionLocked) return;
    const resposta = await fetch(`${API_URL}/mover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origem, destino, session_id: sessionId }),
    });
    const d = await resposta.json();
    if (!d.sucesso) {
      setDropTransition(null);
      return;
    }
    tocarSomMovimento();
    setDropTransition(null);
    setTabuleiro(d.tabuleiro);
    setTurno(d.turno);
    setPecaObrigatoria(d.peca_obrigatoria);

    if (d.mensagem === "Continua") {
      return;
    }

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

    chamarIA(faseSelecionada);
  }

  moverPecaRef.current = moverPeca;

  function reiniciar() {
    fetch(`${API_URL}/resetar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inverter: corPeca === "black", session_id: sessionId })
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

  function resetarProgresso() {
    if (window.confirm("Tem certeza que deseja apagar todo o seu progresso e voltar para a Fase 1?")) {
      setFaseAtual(1);
      setFaseSelecionada(1);
      localStorage.removeItem("faseAtual");
      alert("Progresso apagado com sucesso!");
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        alert("Não foi possível entrar em modo tela cheia.");
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function mostrarDica() {
    setDicaAtiva((v) => !v);
  }

  function renderConfigPanel(onClose, closeLabel = "VOLTAR") {
    return (
      <div className="panel config-panel">
        <div className="panel-title">Configurações</div>

        <div className="config-list">
          <div className="config-item">
            <div className="config-info">
              <div className="config-icon">🔊</div>
              <div className="config-text">
                <strong>Efeitos Sonoros</strong>
                <span>Sons de movimento e vitória</span>
              </div>
            </div>
            <button
              className={`toggle-btn ${somLigado ? "on" : "off"}`}
              onClick={() => setSomLigado(!somLigado)}
            >
              <div className="toggle-knob" />
            </button>
          </div>

          <div className="config-item">
            <div className="config-info">
              <div className="config-icon">🖥️</div>
              <div className="config-text">
                <strong>Tela Cheia</strong>
                <span>Para não clicar fora sem querer</span>
              </div>
            </div>
            <button className="btn blue sm config-action" onClick={toggleFullscreen}>
              {document.fullscreenElement ? "SAIR" : "ENTRAR"}
            </button>
          </div>

          <div className="config-item danger-zone">
            <div className="config-info">
              <div className="config-icon">🗑️</div>
              <div className="config-text">
                <strong>Zerar Progresso</strong>
                <span>Voltar para a Fase 1</span>
              </div>
            </div>
            <button className="btn red sm config-action" onClick={resetarProgresso}>
              APAGAR
            </button>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: "24px" }}>
          <button className="btn gray" onClick={onClose}>{closeLabel}</button>
        </div>
      </div>
    );
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

  async function executarCaminhoIA(caminho) {
    if (!Array.isArray(caminho) || caminho.length < 2) {
      console.warn("Caminho inválido:", caminho);
      setIaPensando(false);
      return;
    }

    for (let i = 0; i < caminho.length - 1; i++) {
      const origem = caminho[i];
      const destino = caminho[i + 1];
      const resposta = await fetch(`${API_URL}/executar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ origem, destino, session_id: sessionId }),
      });
      const d = await resposta.json();

      if (!d.sucesso) {
        console.warn("Falha ao executar passo da IA:", origem, destino, d);
        setIaPensando(false);
        return;
      }

      tocarSomMovimento();
      setTabuleiro(d.tabuleiro);
      setTurno(d.turno);
      setPecaObrigatoria(d.peca_obrigatoria);

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

      await esperar(500 + Math.random() * 500);
    }
    setIaPensando(false);
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

            <div className="hint-box">
              <span style={{ fontSize: "24px" }}>🤖</span>
              <p>Dica: Escolhendo a peça <strong>PRETA</strong>, o computador faz a primeira jogada! Prepare-se!</p>
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
          {renderConfigPanel(() => setTela(TELAS.HOME), "VOLTAR")}
        </div>
      )}

      {/* ── COMO JOGAR (NOVO) ── */}
      {tela === TELAS.REGRAS && (
        <TutorialModal onClose={() => setTela(TELAS.HOME)} />
      )}

      {/* ── TELA DE JOGO ── */}
      {tela === TELAS.JOGO && (
        <div className="screen game-screen">
          <button
            className="settings-fab"
            aria-label="Abrir configurações"
            onClick={() => setConfigJogoAberta((v) => !v)}
          >
            ⚙
          </button>
          {configJogoAberta && (
            <div className="in-game-config-overlay" onClick={() => setConfigJogoAberta(false)}>
              <div onClick={(e) => e.stopPropagation()}>
                {renderConfigPanel(() => setConfigJogoAberta(false), "FECHAR")}
              </div>
            </div>
          )}
          <div className="game-layout">
            <div className="game-board-cluster">
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

                <div className="board-area" ref={boardAreaRef}>

                  <div className="board-coords board-coords--x">
                    {X_COORDS.map((coord) => (
                      <span key={coord}>{coord}</span>
                    ))}
                  </div>
                  <div className="board-coords board-coords--y">
                    {Y_COORDS.map((coord) => (
                      <span key={coord}>{coord}</span>
                    ))}
                  </div>
                  <div className="board">
                    {tabuleiro.map((linha, i) =>
                      linha.map((_, j) => {
                        const isOrigemDica = dicaAtiva && jogadasPossiveis.some((move) => move[0][0] === i && move[0][1] === j);
                        const isDestinoDica = dicaAtiva && jogadasPossiveis.some((move) => move[1][0] === i && move[1][1] === j);
                        const isObrigatoria = !!pecaObrigatoria && pecaObrigatoria[0] === i && pecaObrigatoria[1] === j;
                        return (
                          <Casa
                            key={`${i}-${j}`}
                            i={i}
                            j={j}
                            isOrigemDica={isOrigemDica}
                            isDestinoDica={isDestinoDica}
                            isObrigatoria={isObrigatoria}
                          />
                        );
                      })
                    )}
                  </div>

                  <div className="pieces-layer">
                    {pieces.map((piece) => {
                      const [i, j] = piece.posicao;
                      const pos = boardToPixel(i, j);
                      const canDrag = canDragPiece(piece.tipo, piece.posicao);
                      const isForcedChainPiece =
                        !!pecaObrigatoria &&
                        pecaObrigatoria[0] === i &&
                        pecaObrigatoria[1] === j;
                      const isCaptureCandidate =
                        turno === 1 &&
                        !iaPensando &&
                        captureOrigins.has(`${i}-${j}`);
                      const shouldAnimateMandatory =
                        turno === 1 &&
                        !iaPensando &&
                        (pecaObrigatoria ? isForcedChainPiece : isCaptureCandidate);
                      return (
                        <Peca
                          key={piece.id}
                          tipo={piece.tipo}
                          corPeca={corPeca}
                          x={pos.x}
                          y={pos.y}
                          size={tileSize}
                          animate={false}
                          canDrag={canDrag}
                          showMandatoryIdle={shouldAnimateMandatory}
                          onMouseDown={(event) => iniciarDrag(event, piece)}
                        />
                      );
                    })}

                    {dragState && (
                      <Peca
                        key={`drag-${dragState.origem.join("-")}`}
                        tipo={dragState.tipo}
                        corPeca={corPeca}
                        x={dragState.x}
                        y={dragState.y}
                        size={tileSize}
                        isDragging
                        canDrag
                        animate={false}
                        zIndex={6}
                      />
                    )}

                    {dropTransition && (
                      <Peca
                        key={`drop-${dropTransition.origem.join("-")}-${dropTransition.destino.join("-")}`}
                        tipo={dropTransition.tipo}
                        corPeca={corPeca}
                        x={dropTransition.x}
                        y={dropTransition.y}
                        size={tileSize}
                        animate={false}
                        zIndex={5}
                      />
                    )}
                  </div>
                </div>

                <div className="capture-float capture-float--ia">
                  <span className="capture-count" aria-label={`Peças capturadas pela IA: ${capturadasPelaIA}`}>{capturadasPelaIA}</span>
                  <PilhaCapturas count={capturadasPelaIA} variant="ia" corPeca={corPeca} />
                </div>
                <div className="capture-float capture-float--player">
                  <span className="capture-count" aria-label={`Peças capturadas por você: ${capturadasPeloJogador}`}>{capturadasPeloJogador}</span>
                  <PilhaCapturas count={capturadasPeloJogador} variant="jogador" corPeca={corPeca} />
                </div>

              </div>
              <div className="adversary-float">
                <div className="adversary-float-title">Adversário da fase</div>
                <img
                  className="adversario-img"
                  src={adversarioImgErro ? "/adversarios/placeholder.svg" : caminhoImagemAdversario}
                  alt={`Adversário da ${nomeFase}`}
                  onError={() => setAdversarioImgErro(true)}
                />
                <div className="adversary-phase-name">{nomeFase}</div>
                <div className="adversary-progress">Progresso: Fase {faseAtual}</div>
                <div className="adversary-actions">
                  <button className="btn sm" onClick={mostrarDica}>
                    {dicaAtiva ? "OCULTAR" : "DICA"}
                  </button>
                  <button className="btn blue sm" onClick={reiniciar}>REINICIAR</button>
                  <button className="btn red sm" onClick={desistir}>DESISTIR</button>
                </div>
              </div>
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