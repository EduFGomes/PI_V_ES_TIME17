class JogoDamas:
    def __init__(self):
        self.tabuleiro = self.criar_tabuleiro_inicial()

    def criar_tabuleiro_inicial(self):
        tabuleiro = [
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0]
        ]

        return tabuleiro

    def mostrar_tabuleiro(self):
        print("\n  1 2 3 4 5 6 7 8")
        for i in range(8):
            print(f"{i + 1} ", end="")
            for j in range(8):
                if self.tabuleiro[i][j] == 0:
                    print(". ", end="")
                elif self.tabuleiro[i][j] == 1:
                    print("X ", end="")
                elif self.tabuleiro[i][j] == 2:
                    print("O ", end="")
            print()

    def validar_movimento(self, origem, destino, jogador):
        linha_origem, coluna_origem = origem
        linha_destino, coluna_destino = destino

        if not (0 <= linha_destino < 8 and 0 <= coluna_destino < 8):
            return False, "Destino fora do tabuleiro."
        
        if self.tabuleiro[linha_destino][coluna_destino] != 0:
            return False, "Destino ocupado."

        peca = self.tabuleiro[linha_origem][coluna_origem]
        is_dama = peca in [3, 4]
        distancia_linha = linha_destino - linha_origem
        distancia_coluna = abs(coluna_destino - coluna_origem)

        if not is_dama:
            if jogador == 1 and distancia_linha >= 0: 
                return False, "Peças brancas só podem se mover para cima."
            if jogador == 2 and distancia_linha <= 0: 
                return False, "Peças pretas só podem se mover para baixo."

        if abs(distancia_linha) == 1 and distancia_coluna == 1:
            return True, "Simples"
        
        if abs(distancia_linha) == 2 and distancia_coluna == 2:
            linha_meio = (linha_origem + linha_destino) // 2
            coluna_meio = (coluna_origem + coluna_destino) // 2
            peca_meio = self.tabuleiro[linha_meio][coluna_meio]
            adversario = [2, 4] if jogador == 1 else [1, 3]

            if peca_meio in adversario:
                return True, "Captura"
            return False, "Não há peça adversária para capturar."

        return False, "Movimento inválido."

    def mover_peca(self, origem, destino, jogador):
        valido, tipo = self.validar_movimento(origem, destino, jogador)

        if valido:
            linha_origem, coluna_origem = origem
            linha_destino, coluna_destino = destino
            peca = self.tabuleiro[linha_origem][coluna_origem]

            if tipo == "Captura":
                self.tabuleiro[(linha_origem + linha_destino) // 2][(coluna_origem + coluna_destino) // 2] = 0
                print("Peça adversária capturada!")
            
            self.tabuleiro[linha_destino][coluna_destino] = peca
            self.tabuleiro[linha_origem][coluna_origem] = 0

            if jogador == 1 and linha_destino == 0:
                self.tabuleiro[linha_destino][coluna_destino] = 3
                print("Peça branca promovida a dama!")
            elif jogador == 2 and linha_destino == 7:
                self.tabuleiro[linha_destino][coluna_destino] = 4
                print("Peça preta promovida a dama!")
            
            return True
        else:
            print(f"Movimento inválido: {tipo}")
            return False

# Exemplo de uso
jogo = JogoDamas()
jogo.mostrar_tabuleiro()

# Tentativa 1: Mover diagonalmente (VÁLIDO)
print("\nTentando mover (5,2) para (4,3):")
jogo.mover_peca((5, 2), (4, 3), 1)
jogo.mostrar_tabuleiro()

# Tentativa 2: Mover para trás (INVÁLIDO)
print("\nTentando mover (4,3) de volta para (5,2):")
jogo.mover_peca((4, 3), (5, 2), 1)
jogo.mostrar_tabuleiro()