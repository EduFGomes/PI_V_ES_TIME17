import copy

def gerar_jogadas_possiveis(jogo):
    jogadas = []
    jogador = jogo.turno
    
    # Se existe peca obrigatória para captura múltipla
    pecas_para_verificar = []
    if jogo.peca_obrigatoria:
        pecas_para_verificar.append(jogo.peca_obrigatoria)
        captura_obrigatoria_geral = True
    else:
        for l in range(8):
            for c in range(8):
                peca = jogo.tabuleiro[l][c]
                if (jogador == 1 and peca in [1, 3]) or (jogador == 2 and peca in [2, 4]):
                    pecas_para_verificar.append((l, c))
        captura_obrigatoria_geral = jogo.verificar_se_ha_capturas_obrigatorias(jogador)

    for origem in pecas_para_verificar:
        linha_origem, coluna_origem = origem
        peca = jogo.tabuleiro[linha_origem][coluna_origem]
        is_dama = peca in [3, 4]
        
        distancias = range(1, 8) if is_dama else [1, 2]
        direcoes = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for d_linha, d_coluna in direcoes:
            for dist in distancias:
                destino = (linha_origem + d_linha * dist, coluna_origem + d_coluna * dist)
                if 0 <= destino[0] < 8 and 0 <= destino[1] < 8:
                    valido, resultado = jogo.validar_movimento(origem, destino, jogador)
                    if valido:
                        is_captura = isinstance(resultado, tuple) and resultado[0] == "Captura"
                        if captura_obrigatoria_geral and not is_captura:
                            continue
                        jogadas.append((origem, destino))
                        
    return jogadas

def avaliar_tabuleiro(jogo, jogador_max):
    score_brancas = 0
    score_pretas = 0
    for l in range(8):
        for c in range(8):
            p = jogo.tabuleiro[l][c]
            if p == 1: score_brancas += 10
            elif p == 3: score_brancas += 30
            elif p == 2: score_pretas += 10
            elif p == 4: score_pretas += 30
            
    if jogador_max == 1:
        return score_brancas - score_pretas
    else:
        return score_pretas - score_brancas

def minimax(jogo, depth, alpha, beta, jogador_max):
    vencedor, msg = jogo.verificar_vencedor()
    if vencedor == jogador_max:
        return 10000 + depth
    elif vencedor is not None:
        return -10000 - depth
        
    if depth == 0:
        return avaliar_tabuleiro(jogo, jogador_max)

    jogadas = gerar_jogadas_possiveis(jogo)
    if not jogadas:
        if jogo.turno == jogador_max:
            return -10000 - depth
        else:
            return 10000 + depth
            
    # Se o turno atual do nó for o iterado do max
    if jogo.turno == jogador_max:
        max_eval = -float('inf')
        for origem, destino in jogadas:
            novo_jogo = copy.deepcopy(jogo)
            novo_jogo.mover_peca(origem, destino)
            eval = minimax(novo_jogo, depth - 1, alpha, beta, jogador_max)
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = float('inf')
        for origem, destino in jogadas:
            novo_jogo = copy.deepcopy(jogo)
            novo_jogo.mover_peca(origem, destino)
            eval = minimax(novo_jogo, depth - 1, alpha, beta, jogador_max)
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return min_eval

def obter_melhor_jogada(jogo, depth=10):
    melhor_jogada = None
    max_eval = -float('inf')
    alpha = -float('inf')
    beta = float('inf')
    jogador_max = jogo.turno
    
    jogadas = gerar_jogadas_possiveis(jogo)
    if not jogadas:
        return None
        
    for origem, destino in jogadas:
        novo_jogo = copy.deepcopy(jogo)
        novo_jogo.mover_peca(origem, destino)
        eval = minimax(novo_jogo, depth - 1, alpha, beta, jogador_max)
        if eval > max_eval:
            max_eval = eval
            melhor_jogada = (origem, destino)
        alpha = max(alpha, eval)
        
    return melhor_jogada
