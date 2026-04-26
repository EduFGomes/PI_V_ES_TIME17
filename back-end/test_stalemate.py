import unittest

from ia_minimax import obter_melhor_jogada
from logica_damas import JogoDamas


class TestAfogamento(unittest.TestCase):
    def criar_jogo_vazio(self):
        jogo = JogoDamas()
        jogo.tabuleiro = [[0 for _ in range(8)] for _ in range(8)]
        jogo.peca_obrigatoria = None
        return jogo

    def test_vitoria_por_sem_pecas(self):
        jogo = self.criar_jogo_vazio()
        jogo.tabuleiro[7][0] = 2
        vencedor, mensagem = jogo.verificar_vencedor()
        self.assertEqual(vencedor, 2)
        self.assertEqual(mensagem, "Peças pretas venceram!")

    def test_vitoria_por_sem_movimentos(self):
        jogo = self.criar_jogo_vazio()
        jogo.turno = 1
        jogo.tabuleiro[0][1] = 1
        jogo.tabuleiro[7][0] = 2
        vencedor, mensagem = jogo.verificar_vencedor()
        self.assertEqual(vencedor, 2)
        self.assertEqual(mensagem, "Brancas sem movimentos! Pretas venceram!")

    def test_captura_obrigatoria_conta_como_movimento(self):
        jogo = self.criar_jogo_vazio()
        jogo.turno = 1
        jogo.tabuleiro[5][0] = 1
        jogo.tabuleiro[4][1] = 2
        self.assertTrue(jogo.jogador_tem_movimentos(1))

    def test_dama_bloqueada_sem_movimentos(self):
        jogo = self.criar_jogo_vazio()
        jogo.turno = 1
        jogo.tabuleiro[0][1] = 3
        jogo.tabuleiro[1][0] = 2
        jogo.tabuleiro[1][2] = 2
        jogo.tabuleiro[2][3] = 2
        self.assertFalse(jogo.jogador_tem_movimentos(1))

    def test_ia_bloqueada_perde_automatico(self):
        jogo = self.criar_jogo_vazio()
        jogo.turno = 2
        jogo.tabuleiro[7][0] = 2
        jogo.tabuleiro[6][1] = 1
        jogo.tabuleiro[5][2] = 1
        jogo.tabuleiro[5][4] = 1
        melhor = obter_melhor_jogada(jogo, depth=2, nivel=1, fase_atual=1)
        vencedor, mensagem = jogo.verificar_vencedor()
        self.assertIsNone(melhor)
        self.assertEqual(vencedor, 1)
        self.assertEqual(mensagem, "Pretas sem movimentos! Brancas venceram!")


if __name__ == "__main__":
    unittest.main()
