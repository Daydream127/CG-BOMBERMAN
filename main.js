import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Controle de estado do jogo
let gameActive = false;

// Referencias do DOM
const menuContainer = document.getElementById('menuContainer');
const creditsContainer = document.getElementById('creditsContainer');
const gameContainer = document.getElementById('gameContainer');
const playButton = document.getElementById('playButton');
const creditsButton = document.getElementById('creditsButton');
const backButton = document.getElementById('backButton');

// Event listeners para os botões do menu
playButton.addEventListener('click', startGame);
creditsButton.addEventListener('click', showCredits);
backButton.addEventListener('click', hideCredits);

// Função para iniciar o jogo
function startGame() {
    menuContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    gameActive = true;

    // Iniciar o jogo apenas quando o botão play for clicado
    init();
}

// Função para mostrar os créditos
function showCredits() {
    menuContainer.style.display = 'none';
    creditsContainer.style.display = 'flex';
}

// Função para esconder os créditos
function hideCredits() {
    creditsContainer.style.display = 'none';
    menuContainer.style.display = 'flex';
}

// Variáveis principais
let scene, camera, renderer;
let topViewScene, topViewCamera, topViewRenderer;
let player, arena, topViewPlayer, topViewArena;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canMove = true; // Controle para movimentação por casas
const playerSpeed = 1.0; // Velocidade ajustada para movimentação por casas
const arenaSize = 20;
const wallHeight = 2;
const gridSize = 10; // Define o tamanho da grade (10x10)
const cellSize = arenaSize / gridSize; // Tamanho de cada célula da grade

// Matriz do labirinto: 0 = caminho livre, 1 = parede/obstáculo
const mazeLayout = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 2, 0, 0, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// Criar os loaders
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();

// Function to load and add an .obj model with materials
function loadOBJModel(objPath, mtlPath, position, parentGroup) {
    // Primeiro carrega o arquivo MTL
    mtlLoader.load(mtlPath, function(materials) {
            materials.preload();

            // Configura o OBJLoader para usar os materiais
            objLoader.setMaterials(materials);

            // Depois carrega o arquivo OBJ
            objLoader.load(objPath,
                // onLoad callback
                function (object) {
                    object.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    object.position.set(position.x, position.y, position.z);
                    object.scale.set(1, 1, 1); // Ajuste a escala conforme necessário
                    parentGroup.add(object);
                },
                // onProgress callback
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                // onError callback
                function (error) {
                    console.error('Error loading OBJ:', error);
                }
            );
        },
        // onProgress callback
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% material loaded');
        },
        // onError callback
        function (error) {
            console.error('Error loading MTL:', error);
        });
}




// Controle de posição em grade
let currentGridX = 1;  // Posição inicial X na grade
let currentGridZ = 1;  // Posição inicial Z na grade
let targetGridX = 1;   // Posição alvo X na grade
let targetGridZ = 1;   // Posição alvo Z na grade

// Posição em coordenadas do mundo
function gridToWorld(gridX, gridZ) {
    return {
        x: (gridX - gridSize/2 + 0.5) * cellSize,
        z: (gridZ - gridSize/2 + 0.5) * cellSize
    };
}

// Posição da grade em coordenadas do mundo
function worldToGrid(worldX, worldZ) {
    return {
        x: Math.floor((worldX + arenaSize/2) / cellSize),
        z: Math.floor((worldZ + arenaSize/2) / cellSize)
    };
}

// Inicialização
function init() {
    // ===== CENA PRINCIPAL =====
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu azul

    // Câmera isométrica
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -arenaSize * aspect / 2,
        arenaSize * aspect / 2,
        arenaSize / 2,
        -arenaSize / 2,
        1, 1000
    );

    // Posicionamento da câmera isométrica
    camera.position.set(arenaSize, arenaSize, arenaSize);
    camera.lookAt(0, 0, 0);

    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    gameContainer.appendChild(renderer.domElement);

    // ===== CENA TOP VIEW =====
    // Cena de visão de topo
    topViewScene = new THREE.Scene();
    topViewScene.background = new THREE.Color(0x000000);

    // Câmera top-down (vista de cima)
    topViewCamera = new THREE.OrthographicCamera(
        -arenaSize / 2,
        arenaSize / 2,
        arenaSize / 2,
        -arenaSize / 2,
        1, 1000
    );

    // Posicionamento da câmera top-down
    topViewCamera.position.set(0, 30, 0);
    topViewCamera.lookAt(0, 0, 0);
    topViewCamera.rotation.z = Math.PI; // Para orientar corretamente o mapa

    // Renderizador para visão de topo
    topViewRenderer = new THREE.WebGLRenderer({ antialias: true });
    topViewRenderer.setSize(200, 200);
    topViewRenderer.shadowMap.enabled = true;
    document.getElementById('topViewContainer').appendChild(topViewRenderer.domElement);

    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -arenaSize;
    directionalLight.shadow.camera.right = arenaSize;
    directionalLight.shadow.camera.top = arenaSize;
    directionalLight.shadow.camera.bottom = -arenaSize;
    scene.add(directionalLight);

    // Criar arena principal e de topo
    createArena();
    createTopViewArena();

    // Criar jogador principal e de topo
    createPlayer();
    createTopViewPlayer();

    // Controles
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Responsividade
    window.addEventListener('resize', onWindowResize, false);

    // Iniciar animação
    animate();
}

// Criar arena com piso e quatro paredes
// Add this near the top with other constant declarations
const textureLoader = new THREE.TextureLoader();

// Update the createArena function where the floor is created
function createArena() {
    arena = new THREE.Group();

    // Load and configure floor texture
    const floorTexture = textureLoader.load('assets/textures/DirtPath-NEO.png');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(gridSize, gridSize); // Repeat texture for each grid cell

    // Create floor with texture
    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshLambertMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arena.add(floor);

    // ...rest of the createArena function remains the same...


    // Adicionar grade ao piso
    createGrid();

    // Paredes externas
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    // Parede norte
    const wallNorth = createWall(arenaSize, wallHeight, 0.5);
    wallNorth.position.set(0, wallHeight/2, -arenaSize/2);
    arena.add(wallNorth);

    // Parede sul
    const wallSouth = createWall(arenaSize, wallHeight, 0.5);
    wallSouth.position.set(0, wallHeight/2, arenaSize/2);
    arena.add(wallSouth);

    // Parede leste
    const wallEast = createWall(0.5, wallHeight, arenaSize);
    wallEast.position.set(arenaSize/2, wallHeight/2, 0);
    arena.add(wallEast);

    // Parede oeste
    const wallWest = createWall(0.5, wallHeight, arenaSize);
    wallWest.position.set(-arenaSize/2, wallHeight/2, 0);
    arena.add(wallWest);

    // Adicionar os blocos do labirinto
    createMazeBlocks();

    scene.add(arena);
}

// Criar linhas da grade no chão
function createGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });

    // Linhas horizontais e verticais
    for (let i = 0; i <= gridSize; i++) {
        const pos = (i / gridSize) * arenaSize - arenaSize / 2;

        // Linha horizontal
        const hGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-arenaSize/2, 0.01, pos),
            new THREE.Vector3(arenaSize/2, 0.01, pos)
        ]);
        const hLine = new THREE.Line(hGeometry, gridMaterial);
        arena.add(hLine);

        // Linha vertical
        const vGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos, 0.01, -arenaSize/2),
            new THREE.Vector3(pos, 0.01, arenaSize/2)
        ]);
        const vLine = new THREE.Line(vGeometry, gridMaterial);
        arena.add(vLine);
    }
}

// Criar blocos do labirinto
function createMazeBlocks() {
    const blockGeometry = new THREE.BoxGeometry(cellSize * 0.9, wallHeight, cellSize * 0.9);
    const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
            if (mazeLayout[z][x] === 1) {
                const block = new THREE.Mesh(blockGeometry, blockMaterial);
                const worldPos = gridToWorld(x, z);
                block.position.set(worldPos.x, wallHeight/2, worldPos.z);
                block.castShadow = true;
                block.receiveShadow = true;
                arena.add(block);
            }
            else if (mazeLayout[z][x] === 2) {
                const worldPos = gridToWorld(x, z);
                // Agora passamos tanto o arquivo OBJ quanto o MTL
                loadOBJModel(
                    '/assets/models/deer/deer.obj',  // Caminho para seu arquivo .obj
                    '/assets/models/deer/deer.mtl', // Caminho para seu arquivo .mtl
                    { x: worldPos.x, y: 0, z: worldPos.z },
                    arena
                );
            }
        }
    }
}

// Criar arena para visão de topo
function createTopViewArena() {
    topViewArena = new THREE.Group();

    // Piso
    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x339933,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    topViewArena.add(floor);

    // Adicionar grade ao minimapa
    createTopViewGrid();

    // Paredes externas
    // Parede norte (vermelha)
    const wallNorth = createTopViewWall(arenaSize, 0.5, 0.5, 0xff0000);
    wallNorth.position.set(0, 0.25, -arenaSize/2);
    topViewArena.add(wallNorth);

    // Parede sul (azul)
    const wallSouth = createTopViewWall(arenaSize, 0.5, 0.5, 0x0000ff);
    wallSouth.position.set(0, 0.25, arenaSize/2);
    topViewArena.add(wallSouth);

    // Parede leste (amarela)
    const wallEast = createTopViewWall(0.5, 0.5, arenaSize, 0xffff00);
    wallEast.position.set(arenaSize/2, 0.25, 0);
    topViewArena.add(wallEast);

    // Parede oeste (verde)
    const wallWest = createTopViewWall(0.5, 0.5, arenaSize, 0x00ff00);
    wallWest.position.set(-arenaSize/2, 0.25, 0);
    topViewArena.add(wallWest);

    // Adicionar blocos do labirinto na visualização de topo
    createTopViewMazeBlocks();

    topViewScene.add(topViewArena);
}

// Criar linhas da grade na visualização de topo
function createTopViewGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });

    // Linhas horizontais e verticais
    for (let i = 0; i <= gridSize; i++) {
        const pos = (i / gridSize) * arenaSize - arenaSize / 2;

        // Linha horizontal
        const hGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-arenaSize/2, 0.01, pos),
            new THREE.Vector3(arenaSize/2, 0.01, pos)
        ]);
        const hLine = new THREE.Line(hGeometry, gridMaterial);
        topViewArena.add(hLine);

        // Linha vertical
        const vGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos, 0.01, -arenaSize/2),
            new THREE.Vector3(pos, 0.01, arenaSize/2)
        ]);
        const vLine = new THREE.Line(vGeometry, gridMaterial);
        topViewArena.add(vLine);
    }
}

// Criar blocos do labirinto na visualização de topo
function createTopViewMazeBlocks() {
    const blockGeometry = new THREE.BoxGeometry(cellSize * 0.9, 0.5, cellSize * 0.9);
    const blockMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

    for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
            if (mazeLayout[z][x] === 1) {
                const block = new THREE.Mesh(blockGeometry, blockMaterial);
                const worldPos = gridToWorld(x, z);
                block.position.set(worldPos.x, 0.3, worldPos.z);
                topViewArena.add(block);
            }
        }
    }
}

// Função auxiliar para criar paredes
function createWall(width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const wall = new THREE.Mesh(geometry, material);
    wall.castShadow = true;
    wall.receiveShadow = true;
    return wall;
}

// Função auxiliar para criar paredes na visão de topo
function createTopViewWall(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ color: color });
    return new THREE.Mesh(geometry, material);
}

// Criar jogador
function createPlayer() {
    // Corpo do personagem
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3333ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;

    // Cabeça do personagem
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;

    // Grupo de jogador completo
    player = new THREE.Group();
    player.add(body);
    player.add(head);

    // Posição inicial baseada na grade
    const initialPos = gridToWorld(currentGridX, currentGridZ);
    player.position.set(initialPos.x, 0, initialPos.z);

    scene.add(player);
}

// Criar jogador na visão de topo
function createTopViewPlayer() {
    // Para a visão de topo, vamos usar um marcador quadrado que ocupa uma célula
    const geometry = new THREE.BoxGeometry(cellSize * 0.7, 0.2, cellSize * 0.7);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Vermelho para destacar

    topViewPlayer = new THREE.Mesh(geometry, material);

    // Posição inicial baseada na grade
    const initialPos = gridToWorld(currentGridX, currentGridZ);
    topViewPlayer.position.set(initialPos.x, 0.5, initialPos.z);

    topViewScene.add(topViewPlayer);
}

// Controles de teclado - keydown
function onKeyDown(event) {
    // Só processe os comandos se o jogador puder se mover e o jogo estiver ativo
    if (!canMove || !gameActive) return;

    switch (event.code) {
        case 'KeyW': // W
            if (canMoveToCell(currentGridX, currentGridZ - 1)) {
                moveForward = true;
                targetGridZ = currentGridZ - 1;
                canMove = false;
            }
            break;
        case 'KeyA': // A
            if (canMoveToCell(currentGridX - 1, currentGridZ)) {
                moveLeft = true;
                targetGridX = currentGridX - 1;
                canMove = false;
            }
            break;
        case 'KeyS': // S
            if (canMoveToCell(currentGridX, currentGridZ + 1)) {
                moveBackward = true;
                targetGridZ = currentGridZ + 1;
                canMove = false;
            }
            break;
        case 'KeyD': // D
            if (canMoveToCell(currentGridX + 1, currentGridZ)) {
                moveRight = true;
                targetGridX = currentGridX + 1;
                canMove = false;
            }
            break;
        case 'Escape': // ESC - Voltar ao menu
            gameActive = false;
            gameContainer.style.display = 'none';
            menuContainer.style.display = 'flex';
            break;
    }
}

// Verificar se o jogador pode mover para uma determinada célula
function canMoveToCell(gridX, gridZ) {
    // Verifica se a célula está dentro da grade
    if (gridX < 0 || gridX >= gridSize || gridZ < 0 || gridZ >= gridSize) {
        return false;
    }

    // Verifica se a célula não é uma parede
    return mazeLayout[gridZ][gridX] !== 1;


}

// Controles de teclado - keyup
function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': // W
            moveForward = false;
            break;
        case 'KeyA': // A
            moveLeft = false;
            break;
        case 'KeyS': // S
            moveBackward = false;
            break;
        case 'KeyD': // D
            moveRight = false;
            break;
    }
}

// Redimensionamento da janela
function onWindowResize() {
    if (!gameActive) return;

    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -arenaSize * aspect / 2;
    camera.right = arenaSize * aspect / 2;
    camera.top = arenaSize / 2;
    camera.bottom = -arenaSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Verificar colisões com as paredes
function checkWallCollisions() {
    // Tamanho do jogador
    const playerSize = 0.4; // Metade da largura do jogador

    // Limites da arena (considerando o tamanho do jogador)
    const limit = arenaSize / 2 - playerSize;

    // Limitar posição do jogador dentro da arena
    if (player.position.x > limit) player.position.x = limit;
    if (player.position.x < -limit) player.position.x = -limit;
    if (player.position.z > limit) player.position.z = limit;
    if (player.position.z < -limit) player.position.z = -limit;
}

// Loop de animação
function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        // Atualizar movimento do jogador baseado no sistema de grade
        updatePlayerMovement();

        // Renderizar ambas as cenas
        renderer.render(scene, camera);
        topViewRenderer.render(topViewScene, topViewCamera);
    }
}

// Atualizar o movimento do jogador em casas
function updatePlayerMovement() {
    if (!canMove) {
        const targetPos = gridToWorld(targetGridX, targetGridZ);

        // Movimento suave entre as células
        const dx = targetPos.x - player.position.x;
        const dz = targetPos.z - player.position.z;

        // Determinar se chegou próximo o suficiente à posição de destino
        if (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1) {
            // Chegou à posição exata da célula alvo
            player.position.x = targetPos.x;
            player.position.z = targetPos.z;

            // Atualizar posição atual na grade
            currentGridX = targetGridX;
            currentGridZ = targetGridZ;

            // Resetar variáveis de movimento
            moveForward = false;
            moveBackward = false;
            moveLeft = false;
            moveRight = false;

            // Permitir novo movimento
            canMove = true;
        } else {
            // Mover na direção do alvo
            player.position.x += Math.sign(dx) * Math.min(playerSpeed, Math.abs(dx));
            player.position.z += Math.sign(dz) * Math.min(playerSpeed, Math.abs(dz));
        }
    }

    // Atualizar a posição do jogador na visão de topo
    updateTopViewPlayer();
}

// Atualizar posição do jogador na visão de topo
function updateTopViewPlayer() {
    if (topViewPlayer && player) {
        topViewPlayer.position.x = player.position.x;
        topViewPlayer.position.z = player.position.z;
    }
}

// Não iniciar o jogo automaticamente
// Apenas exibir o menu e aguardar interação
