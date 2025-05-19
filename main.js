import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader();

let gameActive = false;

// coisas do html
const menuContainer = document.getElementById('menuContainer');
const creditsContainer = document.getElementById('creditsContainer');
const gameContainer = document.getElementById('gameContainer');
const playButton = document.getElementById('playButton');
const creditsButton = document.getElementById('creditsButton');
const backButton = document.getElementById('backButton');

// eventos para os botões html
playButton.addEventListener('click', startGame);
creditsButton.addEventListener('click', showCredits);
backButton.addEventListener('click', hideCredits);

// função para iniciar o jogo (chamada pelo botão play)
function startGame() {
    menuContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    gameActive = true;

    init();
}

// função para mostrar os créditos
function showCredits() {
    menuContainer.style.display = 'none';
    creditsContainer.style.display = 'flex';
}

// função para esconder os créditos
function hideCredits() {
    creditsContainer.style.display = 'none';
    menuContainer.style.display = 'flex';
}

// variáveis
let scene, camera, renderer;
let topViewScene, topViewCamera, topViewRenderer;
let player, arena, topViewPlayer, topViewArena;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let bombs = []; // Array to store active bombs
let explosions = []; // Array to store active explosions
const BOMB_TIMER = 2000; // 2 seconds until explosion
const EXPLOSION_DURATION = 1000; // 1 second explosion duration
const EXPLOSION_RANGE = 2; // How far the explosion reaches
let canMove = true;
const playerSpeed = 1.0;
const arenaSize = 20;
const wallHeight = 2;
const gridSize = 10; // 10*10
const cellSize = arenaSize / gridSize; // tamanho de cada célula

// Matriz do labirinto: 0 = caminho livre, 1 = parede/obstáculo, 2 = voxel
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


// Add this function to handle bomb placement
function placeBomb() {
    // Check if player's current position already has a bomb
    const existingBomb = bombs.find(bomb => 
        bomb.gridX === currentGridX && 
        bomb.gridZ === currentGridZ
    );
    
    if (existingBomb) return; // Don't place if there's already a bomb here

    const worldPos = gridToWorld(currentGridX, currentGridZ);
    
    // Create bomb mesh
    const bombGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bombMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const bombMesh = new THREE.Mesh(bombGeometry, bombMaterial);
    
    bombMesh.position.set(worldPos.x, 0.3, worldPos.z);
    scene.add(bombMesh);
    
    // Add bomb to tracking array
    const bomb = {
        mesh: bombMesh,
        gridX: currentGridX,
        gridZ: currentGridZ,
        timer: Date.now(),
    };
    
    bombs.push(bomb);
    
    // Set timer for explosion
    setTimeout(() => explodeBomb(bomb), BOMB_TIMER);
}

// Add this function to handle bomb explosions
function explodeBomb(bomb) {
    // Remove bomb mesh
    scene.remove(bomb.mesh);
    bombs = bombs.filter(b => b !== bomb);
    
    // Create explosion visuals
    const explosionGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
    const explosionMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.7 
    });
    
    // Create explosion areas (center + cross pattern)
    const explosionCells = [];
    const directions = [
        [0, 0], // center
        [1, 0], [2, 0], // right
        [-1, 0], [-2, 0], // left
        [0, 1], [0, 2], // down
        [0, -1], [0, -2] // up
    ];
    
    directions.forEach(([dx, dz]) => {
        const gridX = bomb.gridX + dx;
        const gridZ = bomb.gridZ + dz;
        
        // Check if within grid bounds
        if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
            // Check for destructible blocks (type 2 in mazeLayout)
            if (mazeLayout[gridZ][gridX] === 2) {
                // Destroy the block
                mazeLayout[gridZ][gridX] = 0;
                // Remove the block mesh
                const worldPos = gridToWorld(gridX, gridZ);
                arena.children.forEach(child => {
                    if (child.position.x === worldPos.x && 
                        child.position.z === worldPos.z && 
                        child instanceof THREE.Group) {
                        arena.remove(child);
                    }
                });
            }
            
            // Create explosion effect
            const worldPos = gridToWorld(gridX, gridZ);
            const explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial);
            explosionMesh.position.set(worldPos.x, 0.1, worldPos.z);
            scene.add(explosionMesh);
            explosionCells.push(explosionMesh);
        }
    });
    
    // Remove explosion after duration
    setTimeout(() => {
        explosionCells.forEach(mesh => scene.remove(mesh));
    }, EXPLOSION_DURATION);
}

function loadOBJModel(objPath, mtlPath, position, parentGroup) {
    mtlLoader.load(mtlPath, function(materials) {
            materials.preload();

            objLoader.setMaterials(materials);

            objLoader.load(objPath,
                // onLoad
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
                // onProgress
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                // onError
                function (error) {
                    console.error('Error loading OBJ:', error);
                }
            );
        },
        // onProgress
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% material loaded');
        },
        // onError
        function (error) {
            console.error('Error loading MTL:', error);
        });
}

let currentGridX = 0;  // Posição inicial X na grid
let currentGridZ = 0;  // Posição inicial Z na grid
let targetGridX = 0;   // Posição alvo X na grid
let targetGridZ = 0;   // Posição alvo Z na grid

// posição em coordenadas
function gridToWorld(gridX, gridZ) {
    return {
        x: (gridX - gridSize/2 + 0.5) * cellSize,
        z: (gridZ - gridSize/2 + 0.5) * cellSize
    };
}

// posição em grid
function worldToGrid(worldX, worldZ) {
    return {
        x: Math.floor((worldX + arenaSize/2) / cellSize),
        z: Math.floor((worldZ + arenaSize/2) / cellSize)
    };
}

// inicializa jogo
function init() {
    // cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // azul

    // camera isométrica
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -arenaSize * aspect / 2,
        arenaSize * aspect / 2,
        arenaSize / 2,
        -arenaSize / 2,
        1, 1000
    );

    // posicionamento da camera isométrica
    camera.position.set(arenaSize, arenaSize, arenaSize);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    gameContainer.appendChild(renderer.domElement);

    // cena top view
    topViewScene = new THREE.Scene();
    topViewScene.background = new THREE.Color(0x000000);

    // camara top-down (vista de cima)
    topViewCamera = new THREE.OrthographicCamera(
        -arenaSize / 2,
        arenaSize / 2,
        arenaSize / 2,
        -arenaSize / 2,
        1, 1000
    );

    // posicionamento da camera top-down
    topViewCamera.position.set(0, 30, 0);
    topViewCamera.lookAt(0, 0, 0);
    topViewCamera.rotation.z = 0; // para orientar corretamente o mapa

    // renderer para visão de topo
    topViewRenderer = new THREE.WebGLRenderer({ antialias: true });
    topViewRenderer.setSize(200, 200);
    topViewRenderer.shadowMap.enabled = true;
    document.getElementById('topViewContainer').appendChild(topViewRenderer.domElement);

    // luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -arenaSize;
    directionalLight.shadow.camera.right = arenaSize;
    directionalLight.shadow.camera.top = arenaSize;
    directionalLight.shadow.camera.bottom = -arenaSize;
    scene.add(directionalLight);

    // criar arena principal e de topo
    createArena();
    createTopViewArena();

    // criar jogador principal e de topo
    createPlayer();
    createTopViewPlayer();

    // controlos
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // responsiveness
    window.addEventListener('resize', onWindowResize, false);

    // iniciar animação
    animate();
}

function createArena() {
    arena = new THREE.Group();

    // carregar floor
    const floorTexture = textureLoader.load('assets/textures/DirtPath-NEO.png');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(gridSize, gridSize); // repetir textura para cobrir o chão

    // criar floor com a textura
    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshLambertMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arena.add(floor);


    // adiciona grid
    createGrid();

    // paredes externas
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    // norte
    const wallNorth = createWall(arenaSize, wallHeight, 0.5);
    wallNorth.position.set(0, wallHeight/2, -arenaSize/2);
    arena.add(wallNorth);

    // sul
    const wallSouth = createWall(arenaSize, wallHeight, 0.5);
    wallSouth.position.set(0, wallHeight/2, arenaSize/2);
    arena.add(wallSouth);

    // este
    const wallEast = createWall(0.5, wallHeight, arenaSize);
    wallEast.position.set(arenaSize/2, wallHeight/2, 0);
    arena.add(wallEast);

    // oeste
    const wallWest = createWall(0.5, wallHeight, arenaSize);
    wallWest.position.set(-arenaSize/2, wallHeight/2, 0);
    arena.add(wallWest);

    // blocos do labirinto
    createMazeBlocks();

    scene.add(arena);
}

// criar linhas da grid no chão
function createGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });

    for (let i = 0; i <= gridSize; i++) {
        const pos = (i / gridSize) * arenaSize - arenaSize / 2;

        // linha horizontal
        const hGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-arenaSize/2, 0.01, pos),
            new THREE.Vector3(arenaSize/2, 0.01, pos)
        ]);
        const hLine = new THREE.Line(hGeometry, gridMaterial);
        arena.add(hLine);

        // linha vertical
        const vGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos, 0.01, -arenaSize/2),
            new THREE.Vector3(pos, 0.01, arenaSize/2)
        ]);
        const vLine = new THREE.Line(vGeometry, gridMaterial);
        arena.add(vLine);
    }
}

// criar blocos do labirinto
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
            else if (mazeLayout[z][x] === 2) { // teste obj/mtl
                const worldPos = gridToWorld(x, z);
                loadOBJModel(
                    '/assets/models/deer/deer.obj',
                    '/assets/models/deer/deer.mtl',
                    { x: worldPos.x, y: 0, z: worldPos.z },
                    arena
                );
            }
        }
    }
}

// criar arena para visão de topo
function createTopViewArena() {
    topViewArena = new THREE.Group();

    // floor
    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x339933,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    topViewArena.add(floor);

    // grid
    createTopViewGrid();

    // paredes externas
    // norte (vermelha)
    const wallNorth = createTopViewWall(arenaSize, 0.5, 0.5, 0xff0000);
    wallNorth.position.set(0, 0.25, -arenaSize/2);
    topViewArena.add(wallNorth);

    // sul (azul)
    const wallSouth = createTopViewWall(arenaSize, 0.5, 0.5, 0x0000ff);
    wallSouth.position.set(0, 0.25, arenaSize/2);
    topViewArena.add(wallSouth);

    // este (amarela)
    const wallEast = createTopViewWall(0.5, 0.5, arenaSize, 0xffff00);
    wallEast.position.set(arenaSize/2, 0.25, 0);
    topViewArena.add(wallEast);

    // oeste (verde)
    const wallWest = createTopViewWall(0.5, 0.5, arenaSize, 0x00ff00);
    wallWest.position.set(-arenaSize/2, 0.25, 0);
    topViewArena.add(wallWest);

    // blocos do labirinto
    createTopViewMazeBlocks();

    topViewScene.add(topViewArena);
}

// criar linhas da grade na visualização de topo
function createTopViewGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });

    for (let i = 0; i <= gridSize; i++) {
        const pos = (i / gridSize) * arenaSize - arenaSize / 2;

        // linha horizontal
        const hGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-arenaSize/2, 0.01, pos),
            new THREE.Vector3(arenaSize/2, 0.01, pos)
        ]);
        const hLine = new THREE.Line(hGeometry, gridMaterial);
        topViewArena.add(hLine);

        // linha vertical
        const vGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos, 0.01, -arenaSize/2),
            new THREE.Vector3(pos, 0.01, arenaSize/2)
        ]);
        const vLine = new THREE.Line(vGeometry, gridMaterial);
        topViewArena.add(vLine);
    }
}

// blocos do labirinto na top view
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

// criar paredes
function createWall(width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const wall = new THREE.Mesh(geometry, material);
    wall.castShadow = true;
    wall.receiveShadow = true;
    return wall;
}

// criar paredes na top view
function createTopViewWall(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ color: color });
    return new THREE.Mesh(geometry, material);
}

// criar jogador
function createPlayer() {
    // corpo
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3333ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;

    // cabeça do personagem
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;

    // jogador completo
    player = new THREE.Group();
    player.add(body);
    player.add(head);

    // posição inicial baseada na grade
    const initialPos = gridToWorld(currentGridX, currentGridZ);
    player.position.set(initialPos.x, 0, initialPos.z);

    scene.add(player);
}

// jogador na top view
function createTopViewPlayer() {
    const geometry = new THREE.BoxGeometry(cellSize * 0.7, 0.2, cellSize * 0.7);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Vermelho para destacar

    topViewPlayer = new THREE.Mesh(geometry, material);

    // posição inicial baseada na grade
    const initialPos = gridToWorld(currentGridX, currentGridZ);
    topViewPlayer.position.set(initialPos.x, 0.5, initialPos.z);

    topViewScene.add(topViewPlayer);
}

// controlos de teclado - keydown
function onKeyDown(event) {
    if (!canMove || !gameActive) return;

    switch (event.code) {
        case 'Space': // Space bar - Place bomb
            placeBomb();
            break;
    
        case 'KeyW':
            if (canMoveToCell(currentGridX, currentGridZ - 1)) {
                moveForward = true;
                targetGridZ = currentGridZ - 1;
                canMove = false;
            }
            break;
        case 'KeyA':
            if (canMoveToCell(currentGridX - 1, currentGridZ)) {
                moveLeft = true;
                targetGridX = currentGridX - 1;
                canMove = false;
            }
            break;
        case 'KeyS':
            if (canMoveToCell(currentGridX, currentGridZ + 1)) {
                moveBackward = true;
                targetGridZ = currentGridZ + 1;
                canMove = false;
            }
            break;
        case 'KeyD':
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
    // verifica se a célula está dentro da grid
    if (gridX < 0 || gridX >= gridSize || gridZ < 0 || gridZ >= gridSize) {
        return false;
    }

    // Verifica se a célula está vazia
    return mazeLayout[gridZ][gridX] === 0;
    // se a célula for 1, é uma parede e não pode passar
    // se a célula for 2, é um obstáculo (vox) e pode passar
}

// controlos de teclado - keyup
function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// resize
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

// verificar colisões com as paredes
function checkWallCollisions() {
    // tamanho do jogador
    const playerSize = 0.4;

    // limites da arena (considerando o tamanho do jogador)
    const limit = arenaSize / 2 - playerSize;

    // limitar posição do jogador dentro da arena
    if (player.position.x > limit) player.position.x = limit;
    if (player.position.x < -limit) player.position.x = -limit;
    if (player.position.z > limit) player.position.z = limit;
    if (player.position.z < -limit) player.position.z = -limit;
}

// loop de animação
function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        const currentTime = Date.now();
        bombs.forEach(bomb => {
            const scale = 1 + 0.1 * Math.sin((currentTime - bomb.timer) / 200);
            bomb.mesh.scale.set(scale, scale, scale);
        });

        updatePlayerMovement();

        // renderizar ambas as cenas
        renderer.render(scene, camera);
        topViewRenderer.render(topViewScene, topViewCamera);
    }
}

// atualizar o movimento do jogador em casas
function updatePlayerMovement() {
    if (!canMove) {
        const targetPos = gridToWorld(targetGridX, targetGridZ);

        // movimento suave entre as células
        const dx = targetPos.x - player.position.x;
        const dz = targetPos.z - player.position.z;

        // determinar se chegou próximo o suficiente à posição de destino
        if (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1) {
            // chegou à posição exata da célula alvo
            player.position.x = targetPos.x;
            player.position.z = targetPos.z;

            // atualizar posição atual na grade
            currentGridX = targetGridX;
            currentGridZ = targetGridZ;

            // resetar variáveis de movimento
            moveForward = false;
            moveBackward = false;
            moveLeft = false;
            moveRight = false;

            // permitir novo movimento
            canMove = true;
        } else {
            // mover na direção do alvo
            player.position.x += Math.sign(dx) * Math.min(playerSpeed, Math.abs(dx));
            player.position.z += Math.sign(dz) * Math.min(playerSpeed, Math.abs(dz));
        }
    }

    // atualizar a posição do jogador na visão de topo
    updateTopViewPlayer();
}

// atualizar posição do jogador na visão de topo
function updateTopViewPlayer() {
    if (topViewPlayer && player) {
        topViewPlayer.position.x = player.position.x;
        topViewPlayer.position.z = player.position.z;
    }
}

