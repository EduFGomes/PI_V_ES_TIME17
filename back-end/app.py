from flask import Flask, request, jsonify
from flask_cors import CORS
from logica_damas import JogoDamas
from ia_minimax import obter_melhor_jogada

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

    return jsonify(resultado)

@app.route("/ia_jogar", methods=["POST"])
def ia_jogar():
    # Obtemos a melhor jogada via minimax
    melhor_jogada = obter_melhor_jogada(jogo, depth=4)
    
    if not melhor_jogada:
        return jsonify({"erro": "A IA não encontrou jogadas disponíveis"}), 400
        
    origem, destino = melhor_jogada
    resultado = jogo.jogar(origem, destino)
    
    # We also return what the move was, so the frontend might know (optional)
    resultado["movimento_ia"] = {"origem": origem, "destino": destino}
    
    return jsonify(resultado)

if __name__ == "__main__":
    app.run(debug=True)