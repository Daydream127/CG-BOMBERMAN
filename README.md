<div align="center">
  <img src="https://github.com/user-attachments/assets/758ebeaf-f40b-427b-9aba-7c1d9bed28f8">  
</div>

---

> [!IMPORTANT]
> Este projeto foi desenvolvido para ser utilizado com Node.js; usar a função Go Live do Visual Studio Code pode causar erros. <br>
> Para executar o jogo, instale primeiro as dependências necessárias utilizando o comando `npm install` no diretório do projeto e, em seguida, execute-o com `npm run dev`; isso iniciará o servidor no endereço http://localhost:5173/.

---

O nosso grupo propõe desenvolver um remake 3D do clássico jogo de arcade Bomberman através da biblioteca Three.js. O jogo manterá os elementos essenciais da jogabilidade original enquanto demonstrará conceitos avançados de computação gráfica.

Aplicações Semelhantes

1. Bomb It (Versão 3D de Bomberman)

Descrição: Bomb It é uma série de jogos inspirados em Bomberman, mas com visão 3D e gráficos modernos.
Semelhanças:
o   Labirinto 3D com blocos destrutíveis e power-ups.

o   Sistema de bombas com explosões em cruz (como no clássico).

o   Inimigos controlados por IA (opcional para o trabalho).

o   Efeitos visuais (iluminação, partículas de explosão).

2. 3D Multiplayer Bomberman (Babylon.js)

Descrição: Uma versão multiplayer de Bomberman feita em Babylon.js (similar a Three.js).
Semelhanças:
o   Jogabilidade fiel ao clássico, mas em 3D.

o   Sistema de bombas, power-ups e destruição de blocos.

o   Iluminação dinâmica (útil para o requisito de luzes do projeto).

3. Dynablaster

·        Descrição: Dynablaster é o nome usado para o jogo Bomberman lançado na Europa, principalmente em computadores como Amiga, MS-DOS, Atari ST e Amstrad CPC, além de consoles como o TurboGrafx-16 (sob o nome original).

·        Semelhanças:

o   Labirintos estratégicos: Mapas com blocos fixos e destrutíveis, ideais para adaptar em 3D com Three.js.

o   Power-ups: Como bombas de alcance aumentado, patins de velocidade e detonação remota — podem ser recriados com efeitos visuais modernos.

o   Modos de jogo: Clássico "versus" e cooperativo, útil como referência para implementar multiplayer local.

o   Estilo retro: Inspiração para texturas pixeladas ou uma estética "low-poly 3D" nostálgica.

4. Bombermine

·        Descrição: Bombermine foi um jogo online massivo inspirado em Bomberman, com foco em multiplayer em larga escala. Ele permitia até 1000 jogadores simultâneos em mapas gigantescos, com mecânicas clássicas de bombas e destruição de blocos, mas em um ambiente 2D.

·        Semelhanças:

o   Labirinto Dinâmico: Bombermine usava blocos destrutíveis e caminhos estratégicos em 2D

o   Sistema de Bombas: Explosões em cruz + power-ups para aumentar alcance → ideia para efeitos visuais 3D (partículas, iluminação).

o   Interação Multiplayer: Suporte a centenas de jogadores (no Bombermine) → inspiração para implementar 2-4 jogadores no projeto (local/online).

Calendarização Proposta

Semana 1 (Preparação):

Pesquisa aprofundada sobre Bomberman e Three.js
Definição de requisitos detalhados
Configuração do ambiente de desenvolvimento
Criação do repositório de código
Semana 2-3 (Modelagem 3D):

Criação dos modelos 3D (personagem, bombas, blocos)
Desenvolvimento do labirinto base
Implementação de materiais e texturas básicas
Semana 4-5 (Mecânicas do Jogo):

Sistema de movimentação do personagem
Lógica de colocação e explosão de bombas
Detecção de colisões
Destruição de blocos destrutíveis
Semana 6 (Iluminação e Câmera):

Implementação de diferentes tipos de luz (PointLight, DirectionalLight)
Alternância entre câmera perspectiva e ortográfica
Ajustes visuais e efeitos especiais
Semana 7 (Interação e Polimentos):

Controles por teclado
Sistema de reinício do jogo
Animação dos personagens e explosões
Testes e ajustes finais
Semana 8 (Finalização):

Preparação do relatório
Gravação de demonstração
Empacotamento para entrega
Preparação para defesa
Requisitos Técnicos a Implementar

Objetos 3D complexos: Personagem, bombas, blocos destrutíveis e indestrutíveis criados com primitivas Three.js
Configuração de Câmara: Alternância entre perspectiva e visão ortográfica (visão superior)
Sistema de Iluminação: Luz ambiente + luzes direcionais para efeitos de explosão
Interação: Controles via teclado (WASD para movimento, Espaço para bombas)
Animação: Explosões em cadeia, personagem andando, blocos sendo destruídos
