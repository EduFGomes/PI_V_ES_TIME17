import { useEffect, useState } from "react";
import Peca from "./Peca";
import Casa from "./Casa";

function App() {
  const [tabuleiro, setTabuleiro] = useState([]);
  const [turno, setTurno] = useState(1);

  // carregar tabuleiro inicial
  useEffect(() => {
    fetch("http://localhost:5000/tabuleiro")
      .then((res) => res.json())
      .then((data) => {
        setTabuleiro(data.tabuleiro);
        setTurno(data.turno);
      });
  }, []);

  // função chamada ao soltar peça
  function moverPeca(origem, destino) {
    fetch("http://localhost:5000/mover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origem,
        destino,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erro no servidor");
        }
        return res.json();
      })
      .then((data) => {
        setTabuleiro(data.tabuleiro);
        setTurno(data.turno);

        if (data.vencedor !== null) {
          alert(data.mensagem_vitoria);

          // recarrega tabuleiro após reset
          fetch("http://localhost:5000/tabuleiro")
            .then((res) => res.json())
            .then((data) => {
              setTabuleiro(data.tabuleiro);
              setTurno(data.turno);
            });
        }
      })
      .catch((err) => {
        console.error("ERRO:", err);
      });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 20,
      }}
    >
      <h2>Turno: {turno === 1 ? "Brancas" : "Pretas"}</h2>

      <div>
        {tabuleiro.map((linha, i) => (
          <div key={i} style={{ display: "flex" }}>
            {linha.map((casa, j) => (
              <Casa key={j} i={i} j={j} moverPeca={moverPeca}>
                {casa !== 0 && (
                  <Peca tipo={casa} posicao={[i, j]} />
                )}
              </Casa>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;