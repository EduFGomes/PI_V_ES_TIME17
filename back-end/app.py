from flask import Flask, request, jsonify
from flask_cors import CORS
from logica_damas import JogoDamas

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

@app.route("/resetar", methods=["POST"])
def resetar():
    jogo.resetar_jogo()
    return jsonify({
        "tabuleiro": jogo.tabuleiro,
        "turno": jogo.turno
    })

if __name__ == "__main__":
    app.run(debug=True)