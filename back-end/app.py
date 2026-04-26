from flask import Flask, request, jsonify
from flask_cors import CORS
from logica_damas import JogoDamas
from ia_minimax import obter_melhor_jogada

PROFUNDIDADE_BASE = {
    0: 1,  # facil
    1: 2,  # medio
    2: 3   # dificil
}

PROFUNDIDADE_MAXIMA = {
    0: 3,  # facil
    1: 4,  # medio
    2: 5   # dificil
}

MARCOS_PROFUNDIDADE = {
    # bonus de depth aplicado conforme fase.
    # Exemplo facil:
    # fases 1-3 => +0, 4-8 => +1, 9+ => +2
    0: [(4, 1), (9, 2)],
    1: [(5, 1), (9, 2)],
    2: [(5, 1), (10, 2)],
}


def calcular_bonus_por_fase(nivel, fase):
    marcos = MARCOS_PROFUNDIDADE.get(nivel, MARCOS_PROFUNDIDADE[1])
    bonus = 0
    for fase_inicio, bonus_depth in marcos:
        if fase >= fase_inicio:
            bonus = bonus_depth
    return bonus


def calcular_depth_real(nivel, fase_atual):
    nivel = int(nivel) if nivel is not None else 1
    fase = max(1, int(fase_atual) if fase_atual is not None else 1)

    base = PROFUNDIDADE_BASE.get(nivel, PROFUNDIDADE_BASE[1])
    limite = PROFUNDIDADE_MAXIMA.get(nivel, PROFUNDIDADE_MAXIMA[1])
    progresso = calcular_bonus_por_fase(nivel, fase)

    return min(base + progresso, limite)

app = Flask(__name__)
CORS(app)

jogo = JogoDamas()

@app.route("/tabuleiro", methods=["GET"])
def get_tabuleiro():
    return jsonify({
        "tabuleiro": jogo.tabuleiro,
        "turno": jogo.turno
    })

@app.route("/mover", methods=["POST"])
def mover():
    data = request.get_json()

    origem = data.get("origem")
    destino = data.get("destino")

    if not origem or not destino:
        return jsonify({"erro": "Dados incompletos"}), 400

    origem = tuple(origem)
    destino = tuple(destino)

    resultado = jogo.jogar(origem, destino)
    resultado["peca_obrigatoria"] = jogo.peca_obrigatoria

    return jsonify(resultado)

@app.route("/ia", methods=["POST"])
def jogada_ia():
    data = request.get_json()
    nivel = data.get("nivel", 1)
    fase_atual = data.get("faseAtual", 1)

    vencedor, mensagem_vitoria = jogo.verificar_vencedor()
    if vencedor is not None:
        return jsonify({
            "vencedor": vencedor,
            "mensagem_vitoria": mensagem_vitoria
        })

    profundidade = calcular_depth_real(nivel, fase_atual)
    melhor = obter_melhor_jogada(jogo, profundidade, nivel=nivel, fase_atual=fase_atual)

    print("Melhor jogada IA:", melhor)
    print(f"IA nivel={nivel} fase={fase_atual} depth={profundidade}")

    if not melhor:
        vencedor, mensagem_vitoria = jogo.verificar_vencedor()
        if vencedor is None:
            vencedor = 1 if jogo.turno == 2 else 2
            mensagem_vitoria = "Sem movimentos disponíveis. Partida encerrada."
        return jsonify({
            "vencedor": vencedor,
            "mensagem_vitoria": mensagem_vitoria
        })

    caminho = melhor

    return jsonify({
        "caminho": caminho,
        "depth_real": profundidade
    })

@app.route("/executar", methods=["POST"])
def executar_movimento():
    data = request.get_json()

    origem = tuple(data.get("origem"))
    destino = tuple(data.get("destino"))

    print("IA tentando mover:", origem, "->", destino)

    sucesso, msg = jogo.mover_peca(origem, destino)

    print("Resultado IA:", sucesso, msg)

    vencedor = None
    mensagem_vitoria = None

    if sucesso and msg != "Continua":
        vencedor, mensagem_vitoria = jogo.verificar_vencedor()

    return jsonify({
        "sucesso": sucesso,
        "tabuleiro": jogo.tabuleiro,
        "turno": jogo.turno,
        "mensagem": msg,
        "vencedor": vencedor,
        "mensagem_vitoria": mensagem_vitoria,
        "peca_obrigatoria": jogo.peca_obrigatoria
    })

@app.route("/resetar", methods=["POST"])
def resetar():
    jogo.resetar_jogo()
    return jsonify({
        "tabuleiro": jogo.tabuleiro,
        "turno": jogo.turno
    })

if __name__ == "__main__":
    app.run(debug=True)