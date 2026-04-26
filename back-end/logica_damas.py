class JogoDamas:
    def __init__(self):
        self.resetar_jogo()

    def resetar_jogo(self):
        self.tabuleiro = self.criar_tabuleiro_inicial()
        self.turno = 1
        self.peca_obrigatoria = None
    
    def contar_pecas(self):
        brancas = 0
        pretas = 0
        for linha in self.tabuleiro:
            for casa in linha:
                if casa in [1, 3]: 
                    brancas += 1
                elif casa in [2, 4]: 
                    pretas += 1

        return brancas, pretas

    def verificar_vencedor(self):
        brancas, pretas = self.contar_pecas()
        if brancas == 0:
            return 2, "Peças pretas venceram!"
        if pretas == 0:
            return 1, "Peças brancas venceram!"
        if not self.jogador_tem_movimentos(1):
            return 2, "Brancas sem movimentos! Pretas venceram!"
        if not self.jogador_tem_movimentos(2):
            return 1, "Pretas sem movimentos! Brancas venceram!"
        return None, "O jogo continua."

    def jogador_tem_movimentos(self, jogador):
        if self.peca_obrigatoria:
            linha, coluna = self.peca_obrigatoria
            peca = self.tabuleiro[linha][coluna]
            if (jogador == 1 and peca not in [1, 3]) or (jogador == 2 and peca not in [2, 4]):
                return False
            return self.tem_capturas_disponiveis(linha, coluna)

        captura_obrigatoria = self.verificar_se_ha_capturas_obrigatorias(jogador)

        for linha in range(8):
            for coluna in range(8):
                peca = self.tabuleiro[linha][coluna]
                if (jogador == 1 and peca not in [1, 3]) or (jogador == 2 and peca not in [2, 4]):
                    continue

                is_dama = peca in [3, 4]

                if captura_obrigatoria:
                    if self.tem_capturas_disponiveis(linha, coluna):
                        return True
                    continue

                distancias = range(1, 8) if is_dama else [1]
                direcoes = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

                for d_linha, d_coluna in direcoes:
                    for distancia in distancias:
                        destino = (linha + d_linha * distancia, coluna + d_coluna * distancia)
                        valido, _ = self.validar_movimento((linha, coluna), destino, jogador)
                        if valido:
                            return True

        return False

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
                elif self.tabuleiro[i][j] == 3:
                    print("K ", end="")
                elif self.tabuleiro[i][j] == 4:
                    print("Q ", end="")
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

        if abs(distancia_linha) != abs(distancia_coluna):
            return False, "Movimento deve ser diagonal."
        
        if abs(distancia_linha) >= 2:
            passos_linha = 1 if distancia_linha > 0 else -1
            passos_coluna = 1 if coluna_destino > coluna_origem else -1
            pecas_no_caminho = []

            for i in range(1, abs(distancia_linha)):
                linha_temp = linha_origem + i * passos_linha
                coluna_temp = coluna_origem + i * passos_coluna
                p = self.tabuleiro[linha_temp][coluna_temp]
                if p != 0:
                    pecas_no_caminho.append((p, linha_temp, coluna_temp))
            
            if len(pecas_no_caminho) == 1:
                peca_meio, linha_meio, coluna_meio = pecas_no_caminho[0]
                adversario = [2, 4] if jogador == 1 else [1, 3]
                if peca_meio in adversario:
                    if not is_dama and abs(distancia_linha) > 2:
                        return False, "Peças comuns só podem capturar pulando uma casa."
                    return True, ("Captura", linha_meio, coluna_meio)
            
            if len(pecas_no_caminho) == 0 and is_dama:
                return True, "Simples"
                
            return False, "Movimento de captura inválido."

        if not is_dama:
            if jogador == 1 and distancia_linha >= 0: 
                return False, "Peças brancas só podem se mover para cima."
            if jogador == 2 and distancia_linha <= 0: 
                return False, "Peças pretas só podem se mover para baixo."

        return True, "Simples"
    
    def verificar_se_ha_capturas_obrigatorias(self, jogador):
        for linha in range(8):
            for coluna in range(8):
                peca = self.tabuleiro[linha][coluna]
                if (jogador == 1 and peca in [1, 3]) or (jogador == 2 and peca in [2, 4]):
                    if self.tem_capturas_disponiveis(linha, coluna):
                        return True
        return False

    def tem_capturas_disponiveis(self, linha, coluna):
        jogador = 1 if self.tabuleiro[linha][coluna] in [1, 3] else 2
        peca = self.tabuleiro[linha][coluna]
        is_dama = peca in [3, 4]

        distancias = range(2, 8) if is_dama else [2]
        direcoes = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

        for d_linha, d_coluna in direcoes:
            for distancia in distancias:
                destino = (linha + d_linha * distancia, coluna + d_coluna * distancia)
                valido, tipo = self.validar_movimento((linha, coluna), destino, jogador)
                if valido and isinstance(tipo, tuple) and tipo[0] == "Captura":
                    return True
        
        return False

    def mover_peca(self, origem, destino):
        if self.peca_obrigatoria and origem != self.peca_obrigatoria:
            return False, "Deve continuar a captura obrigatória."

        valido, resultado = self.validar_movimento(origem, destino, self.turno)

        if not valido:
            return False, resultado
        
        if resultado == "Simples" and self.verificar_se_ha_capturas_obrigatorias(self.turno):
            return False, "Existe uma captura obrigatória disponível. Faça a captura primeiro."

        if valido:
            linha_origem, coluna_origem = origem
            linha_destino, coluna_destino = destino
            peca = self.tabuleiro[linha_origem][coluna_origem]

            self.tabuleiro[linha_destino][coluna_destino] = peca
            self.tabuleiro[linha_origem][coluna_origem] = 0

            if isinstance(resultado, tuple) and resultado[0] == "Captura":
                _, linha_meio, coluna_meio = resultado
                self.tabuleiro[linha_meio][coluna_meio] = 0

                #VERIFICA SE TEM MAIS CAPTURA
                if self.tem_capturas_disponiveis(linha_destino, coluna_destino):
                    self.peca_obrigatoria = (linha_destino, coluna_destino)
                    return True, "Continua"

            if self.turno == 1 and linha_destino == 0 and peca == 1:
                self.tabuleiro[linha_destino][coluna_destino] = 3
            elif self.turno == 2 and linha_destino == 7 and peca == 2:
                self.tabuleiro[linha_destino][coluna_destino] = 4

            self.peca_obrigatoria = None
            self.turno = 2 if self.turno == 1 else 1
            return True, "SUCESSO"
            
        return False, resultado
    
    def jogar(self, origem, destino):
        sucesso, msg = self.mover_peca(origem, destino)

        vencedor = None
        mensagem_vitoria = None

        print("MSG:", msg)
        # só verifica vitória se jogada foi válida E terminou (não é captura múltipla)
        if sucesso and msg != "Continua":
            vencedor, mensagem_vitoria = self.verificar_vencedor()

            if vencedor:
                self.resetar_jogo()

        return {
            "sucesso": sucesso,
            "mensagem": msg,
            "vencedor": vencedor,
            "mensagem_vitoria": mensagem_vitoria,
            "tabuleiro": self.tabuleiro,
            "turno": self.turno,
            "peca_obrigatoria": self.peca_obrigatoria
        }