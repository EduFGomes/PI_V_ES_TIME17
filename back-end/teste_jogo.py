# ARQUIVO CRIADO INTEIRAMENTE POR INTELIGÊNCIA ARTIFICIAL - GEMINI
# NÃO DEVERÁ SER ENVIADO JUNTO COM O PROJETO FINAL, POIS SERVE APENAS PARA TESTES DE LÓGICA DO JOGO
# Este arquivo é um teste simples para verificar a funcionalidade básica do jogo de damas.

from logica_damas import JogoDamas

if __name__ == "__main__":
    jogo = JogoDamas()
    print("=== PROJETO DAMAS: TESTE DE VITÓRIA ===")
    
    while True:
        jogo.mostrar_tabuleiro()
        
        # 1. Verificar se já existe um vencedor antes de começar a jogada
        vencedor, mensagem = jogo.verificar_vencedor()
        if vencedor:
            print(f"\n🏆 FIM DE JOGO! {mensagem}")
            break # Para o programa aqui
            
        try:
            print(f"\nTurno das {'Brancas (X)' if jogo.turno == 1 else 'Pretas (O)'}")
            origem_raw = input("Origem (linha coluna): ").split()
            destino_raw = input("Destino (linha coluna): ").split()
            
            origem = (int(origem_raw[0])-1, int(origem_raw[1])-1)
            destino = (int(destino_raw[0])-1, int(destino_raw[1])-1)
            
            sucesso, msg = jogo.mover_peca(origem, destino)
            
            if not sucesso:
                print(f"\n⚠️ ERRO: {msg}")
            elif msg == "Continua":
                print("\n⛓️ CAPTURA MÚLTIPLA!")
                
        except (ValueError, IndexError):
            print("\n❌ Entrada inválida!")