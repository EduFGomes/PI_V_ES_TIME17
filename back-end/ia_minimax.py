import copy
import random

PERFIS_IA = {
    0: {  # Facil
        "erro_chance": 0.45,
        "top_k": 4,
        "agressividade": 0.75,
        "valor_promocao": 5.0,
    },
    1: {  # Medio
        "erro_chance": 0.28,
        "top_k": 3,
        "agressividade": 0.95,
        "valor_promocao": 7.0,
    },
    2: {  # Dificil
        "erro_chance": 0.16,
        "top_k": 2,
        "agressividade": 1.08,
        "valor_promocao": 9.0,
    },
}

ESCALA_PERFIL = {
    0: {
        "erro_step": 0.015,
        "erro_min": 0.30,
        "agress_step": 0.02,
        "agress_max": 0.95,
        "promo_step": 0.5,
        "promo_max": 8.0,
    },
    1: {
        "erro_step": 0.02,
        "erro_min": 0.16,
        "agress_step": 0.025,
        "agress_max": 1.10,
        "promo_step": 0.7,
        "promo_max": 10.0,
    },
    2: {
        "erro_step": 0.015,
        "erro_min": 0.10,
        "agress_step": 0.02,
        "agress_max": 1.18,
        "promo_step": 0.6,
        "promo_max": 11.0,
    },
}

def obter_perfil_ia(nivel, fase_atual):
    nivel = int(nivel) if nivel is not None else 1
    perfil_base = PERFIS_IA.get(nivel, PERFIS_IA[1]).copy()
    escala = ESCALA_PERFIL.get(nivel, ESCALA_PERFIL[1])
    fase = max(1, int(fase_atual or 1))

    # IA escala a cada duas fases, com curva mais suave por dificuldade.
    melhoria = min((fase - 1) // 2, 5)
    perfil_base["erro_chance"] = max(
        escala["erro_min"],
        perfil_base["erro_chance"] - escala["erro_step"] * melhoria,
    )
    perfil_base["agressividade"] = min(
        escala["agress_max"],
        perfil_base["agressividade"] + escala["agress_step"] * melhoria,
    )
    perfil_base["valor_promocao"] = min(
        escala["promo_max"],
        perfil_base["valor_promocao"] + escala["promo_step"] * melhoria,
    )
    return perfil_base

def estimar_pontuacao_jogada(jogo_original, jogada, jogador_ia, perfil):
    novo_jogo = copy.deepcopy(jogo_original)
    capturas = 0

    for i in range(len(jogada) - 1):
        o, d = jogada[i], jogada[i + 1]
        valido, resultado = novo_jogo.validar_movimento(o, d, novo_jogo.turno)
        if valido and isinstance(resultado, tuple) and resultado[0] == "Captura":
            capturas += 1
        novo_jogo.mover_peca(o, d)

    score = avaliar_tabuleiro(novo_jogo, jogador_ia)
    score += capturas * 6 * perfil["agressividade"]

    destino_final = jogada[-1]
    linha_destino = destino_final[0]
    if jogador_ia == 1 and linha_destino == 0:
        score += perfil["valor_promocao"]
    elif jogador_ia == 2 and linha_destino == 7:
        score += perfil["valor_promocao"]

    # Ruído leve para a IA não parecer robótica (especialmente para crianças).
    score += random.uniform(-0.8, 0.8)
    return score

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

def gerar_capturas_recursivas(jogo, origem):
    caminhos = []

    def dfs(jogo_atual, posicao, caminho):
        encontrou = False

        jogadas = gerar_jogadas_possiveis(jogo_atual)

        for o, d in jogadas:
            if o != posicao:
                continue

            valido, resultado = jogo_atual.validar_movimento(o, d, jogo_atual.turno)

            if valido and isinstance(resultado, tuple) and resultado[0] == "Captura":
                encontrou = True

                novo_jogo = copy.deepcopy(jogo_atual)
                sucesso, msg = novo_jogo.mover_peca(o, d)

                if sucesso:
                    dfs(novo_jogo, d, caminho + [d])

        if not encontrou and len(caminho) > 1:
            caminhos.append(caminho)

    dfs(copy.deepcopy(jogo), origem, [origem])

    return caminhos

def gerar_todas_jogadas_completas(jogo):
    jogadas_completas = []
    jogadas_base = gerar_jogadas_possiveis(jogo)

    for origem, destino in jogadas_base:
        novo_jogo = copy.deepcopy(jogo)
        sucesso, msg = novo_jogo.mover_peca(origem, destino)

        if sucesso and msg == "Continua":
            caminhos = gerar_capturas_recursivas(novo_jogo, destino)
            for caminho in caminhos:
                # "caminho" já começa em "destino" (primeira captura executada acima),
                # então o caminho completo precisa manter esse primeiro passo.
                jogadas_completas.append([origem] + caminho)
        elif sucesso:
            jogadas_completas.append([origem, destino])

    return jogadas_completas

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

    jogadas = gerar_todas_jogadas_completas(jogo)
    if not jogadas:
        if jogo.turno == jogador_max:
            return -10000 - depth
        else:
            return 10000 + depth
            
    # Se o turno atual do nó for o iterado do max
    if jogo.turno == jogador_max:
        max_eval = -float('inf')
        for jogada in jogadas:
            novo_jogo = copy.deepcopy(jogo)

            for i in range(len(jogada) - 1):
                novo_jogo.mover_peca(jogada[i], jogada[i + 1])
            eval = minimax(novo_jogo, depth - 1, alpha, beta, jogador_max)
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = float('inf')
        for jogada in jogadas:
            novo_jogo = copy.deepcopy(jogo)

            for i in range(len(jogada) - 1):
                novo_jogo.mover_peca(jogada[i], jogada[i + 1])
            eval = minimax(novo_jogo, depth - 1, alpha, beta, jogador_max)
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return min_eval

def obter_melhor_jogada(jogo, depth=4, nivel=1, fase_atual=1):
    melhor_jogada = None
    max_eval = -float('inf')
    alpha = -float('inf')
    beta = float('inf')
    jogador_max = jogo.turno
    perfil = obter_perfil_ia(nivel, fase_atual)
    
    jogadas = gerar_todas_jogadas_completas(jogo)
    if not jogadas:
        return None
        
    avaliacoes = []
    for jogada in jogadas:
        novo_jogo = copy.deepcopy(jogo)

        for i in range(len(jogada) - 1):
            novo_jogo.mover_peca(jogada[i], jogada[i + 1])

        eval = minimax(novo_jogo, depth - 1, alpha, beta, jogador_max)
        eval += estimar_pontuacao_jogada(jogo, jogada, jogador_max, perfil)
        avaliacoes.append((jogada, eval))

        if eval > max_eval:
            max_eval = eval
            melhor_jogada = jogada
        alpha = max(alpha, eval)

    # Erro controlado: às vezes escolhe entre as melhores opções,
    # mantendo desafio divertido e menos punitivo.
    avaliacoes.sort(key=lambda x: x[1], reverse=True)
    top_k = min(perfil["top_k"], len(avaliacoes))
    top_jogadas = avaliacoes[:top_k]

    if random.random() < perfil["erro_chance"] and top_k > 1:
        return random.choice(top_jogadas[1:])[0]

    return top_jogadas[0][0] if top_jogadas else melhor_jogada
