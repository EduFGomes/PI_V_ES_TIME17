# 👑 Damas Cognitivas

> Um jogo de damas interativo, moderno e inteligente voltado para o desenvolvimento e estímulo cognitivo. Enfrente uma Inteligência Artificial adaptativa através de uma jornada de 10 fases com níveis crescentes de dificuldade.

---

## 🌐 Jogue Agora

O projeto está implantado na nuvem e pode ser jogado diretamente no navegador:
👉 **[damas-cognitivas.vercel.app](https://damas-cognitivas.vercel.app)**

---

## 💡 O Projeto

O **Damas Cognitivas** foi concebido como um projeto integrador focado em estimulação cognitiva. Ele combina a lógica clássica do jogo de damas com recursos modernos de acessibilidade visual, sonora e de jogabilidade, além de uma Inteligência Artificial projetada para calibrar o desafio de acordo com a progressão do jogador.

### 🧠 Recursos de Estímulo Cognitivo
* **Progressão em Fases:** O jogador avança por um mapa de **10 fases**, onde cada fase apresenta um oponente virtual com comportamento único.
* **IA Adaptativa (Minimax):** O motor da IA calcula as melhores jogadas usando o algoritmo Minimax com poda Alfa-Beta. A dificuldade não é estática: os parâmetros da IA escalam dinamicamente à medida que o jogo avança pelas fases.
* **Sistema de Dicas:** Exibe visualmente no tabuleiro os movimentos válidos, auxiliando na aprendizagem espacial e no planejamento estratégico.
* **Customização Visual:** Suporte a diferentes cores de peças (Vermelhas, Pretas, Amarelas e Brancas) e planos de fundo interativos baseados na dificuldade selecionada.

---

## 🛠️ Tecnologias Utilizadas

O projeto é dividido em uma arquitetura moderna e desacoplada:

### **Front-End (Interface Gráfica)**
* **React 19:** Biblioteca base para a interface de usuário reativa.
* **Framer Motion:** Micro-animações fluidas nas transições de telas e movimentos de peças.
* **React DnD:** Mecanismo robusto de arrastar e soltar (Drag and Drop) para as peças.
* **Lucide React:** Conjunto elegante de ícones vetoriais.

### **Back-End (Motor de Jogo & IA)**
* **Python 3:** Linguagem utilizada para processamento lógico de alto desempenho.
* **Flask & Flask-Cors:** Servidor web leve para exposição de APIs REST.
* **Algoritmo Minimax + Poda Alfa-Beta:** Busca recursiva de jogadas com avaliação heurística adaptativa.
* **Gunicorn:** Servidor WSGI para implantação em produção.

---

## 🤖 Como Funciona a Inteligência Artificial?

A IA foi calibrada com três perfis principais que determinam seu comportamento lógico e adaptabilidade cognitiva:

| Dificuldade (Nível) | Profundidade de Busca | Taxa de Erro Controlada | Agressividade Heurística | Valor de Promoção (Dama) |
| :--- | :---: | :---: | :---: | :---: |
| **Divertido (Fácil)** | 1 a 3 jogadas à frente | 45% | Baixa (0.75) | +5.0 pontos |
| **Aventureiro (Médio)** | 2 a 4 jogadas à frente | 28% | Média (0.95) | +7.0 pontos |
| **Experiente (Difícil)** | 3 a 5 jogadas à frente | 16% | Alta (1.08) | +9.0 pontos |

### 📈 Escalonamento Dinâmico por Fase
À medida que as fases progridem dentro de cada nível, a IA ajusta suavemente seus parâmetros (a cada duas fases):
* A **taxa de erro diminui** (a IA comete menos falhas).
* A **agressividade aumenta** (a IA valoriza mais a captura de peças do jogador).
* A **valorização de promoção aumenta** (a IA protege melhor suas peças e busca ativamente coroar suas damas).

Para garantir que a IA não jogue de forma puramente robótica e frustrante, adicionamos um **ruído heurístico leve** nas pontuações das jogadas, tornando as partidas mais naturais, dinâmicas e divertidas.

---

## 📜 Regras do Jogo

O jogo segue as regras clássicas de damas (8x8):
1. **Movimentação Comum:** Peças normais movem-se apenas uma casa na diagonal, sempre avançando.
2. **Captura Obrigatória:** Se houver uma peça adversária que possa ser capturada, o jogador é obrigado a realizar o movimento de captura.
3. **Capturas Múltiplas:** Se após uma captura a mesma peça puder realizar outra captura consecutiva, o turno continua com ela até que não haja mais capturas disponíveis.
4. **Promoção (Dama):** Ao atingir a última linha oposta do tabuleiro, a peça comum é promovida a Dama.
5. **Poder da Dama:** A Dama é uma peça de longo alcance (voadora), podendo mover-se e capturar ao longo de qualquer número de casas livres nas diagonais.
6. **Empate por Inatividade:** A partida é declarada empate após 40 jogadas sem capturas ou movimentos de pedras comuns (ou 10 jogadas em finais compostos apenas por damas).

---

## 💻 Como Executar o Projeto Localmente

Siga o passo a passo abaixo para rodar o backend e o frontend em sua máquina local.

### 📋 Pré-requisitos
* **Python 3.x** instalado.
* **Node.js** (versão 18 ou superior) e **npm** instalados.
* Um terminal ou prompt de comando (recomenda-se o PowerShell no Windows ou Bash no Linux/macOS).

---

### 1. Clonar o Repositório
Abra o seu terminal e execute:
```bash
git clone https://github.com/EduFGomes/PI_V_ES_TIME17.git
cd PI_V_ES_TIME17
```

---

### 2. Configurar e Executar o Back-End (Servidor Flask)

1. Navegue até a pasta do back-end:
   ```bash
   cd back-end
   ```

2. Crie um ambiente virtual (venv) para isolar as dependências do Python:
   * **No Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   * **No Linux/macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Instale as dependências necessárias:
   ```bash
   pip install -r requirements.txt
   ```

4. Inicie o servidor:
   ```bash
   python app.py
   ```
   *O servidor iniciará no endereço local: **`http://127.0.0.1:5000`***

---

### 3. Configurar e Executar o Front-End (Interface React)

1. Abra um **novo terminal** na pasta raiz do projeto (`PI_V_ES_TIME17`).
2. Navegue até a pasta do front-end:
   ```bash
   cd front-end
   ```

3. Instale as dependências do npm:
   ```bash
   npm install
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```

5. O navegador deverá abrir automaticamente no endereço:
   👉 **`http://localhost:3000`**

---

## 📁 Estrutura de Pastas do Projeto

```
PI_V_ES_TIME17/
├── back-end/                # Servidor e Inteligência Artificial em Python
│   ├── app.py               # Servidor Flask e Endpoints de API REST
│   ├── ia_minimax.py        # Motor de IA com algoritmo Minimax e perfis adaptativos
│   ├── logica_damas.py      # Mecânica de jogo, validação e regras de damas
│   └── requirements.txt     # Dependências de bibliotecas Python
│
├── front-end/               # Interface Gráfica em React
│   ├── public/              # Arquivos públicos e ícones
│   ├── src/                 # Código-fonte principal do React
│   │   ├── App.js           # Gerenciador de telas, fluxos de jogo e conexões de rede
│   │   ├── Casa.js          # Componente representativo das casas do tabuleiro
│   │   ├── Peca.js          # Componente e lógica de arrastar/clicar nas peças
│   │   ├── PilhaCapturas.js # Painel de exibição de peças capturadas
│   │   ├── TutorialModal.js # Guia interativo passo a passo ("Como Jogar")
│   │   └── App.css          # Estilizações da interface e tabuleiro
│   └── package.json         # Configurações de dependências e scripts npm
│
└── README.md                # Documentação principal do projeto (este arquivo)
```

---

## 👥 Equipe do Projeto

Desenvolvido pelo **TIME 17** no Projeto Integrador V.
