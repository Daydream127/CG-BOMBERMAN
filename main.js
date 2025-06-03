import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';

import { GAME_MAPS, PLAYER_TEXTURES, MAP_MODELS, WALL_TEXTURES } from './consts.js';

let gameActive = false;

const textureLoader = new THREE.TextureLoader();


const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();





const menuContainer = document.getElementById('menuContainer');
const creditsContainer = document.getElementById('creditsContainer');
const instructionsContainer = document.getElementById('instructionsContainer');
const mapsContainer = document.getElementById('mapsContainer');
const gameContainer = document.getElementById('gameContainer');

const playButton = document.getElementById('playButton');
const creditsButton = document.getElementById('creditsButton');
const instructionsButton = document.getElementById('instructionsButton');
const mapsButton = document.getElementById('mapsButton');

const backButton = document.getElementById('backButton');
const instructionsBackButton = document.getElementById('instructionsBackButton');
const mapsBackButton = document.getElementById('mapsBackButton');
const mapsPlayButton = document.getElementById('mapsPlayButton');

const GAME_START_TIME = 100000;
const cycleDuration = 300000; 
let gameStartTime = GAME_START_TIME;
let clockElement;

let lightControls;
let lightReferences = {
    ambient: null,
    sun: null,
    fill: null,
    rim: null,
    point1: null,
    point2: null
};
let lightControlsVisible = false;


const arenaSize = 30;
const wallHeight = 2;
const gridSize = 15;
const cellSize = arenaSize / gridSize;

let scene, camera, renderer;
let playerLives = 3;
let isGameOver = false;
let secondaryScene, secondaryCamera, secondaryRenderer;
let topViewScene, topViewCamera, topViewRenderer;
let player, arena, topViewPlayer, topViewArena;
let rats = [];
let totalCoins = 0;
let collectedCoins = 0;

let freeCamera;
let freeCameraActive = false;
let freeCameraSpeed = 0.05;
let freeCameraControls = {
    up: false,
    down: false,
    left: false,
    right: false,
    forward: false,
    backward: false
};
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

let isSpeedBoosted = false;
let speedBoostTimeout = null;
const SPEED_BOOST_DURATION = 5000; 
const SPEED_BOOST_MULTIPLIER = 1.5;

const RAT_MOVE_INTERVAL = 1000;
const LIMB_ROTATION = Math.PI / 4;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isTopView = false;
let bombs = [];
let explosions = [];
const BOMB_TIMER = 2000;
const EXPLOSION_DURATION = 1000;
const EXPLOSION_RANGE = 2;
let canMove = true;
let playerSpeed2 = 1.0;

let currentMap = 'maze';
let mazeLayout = GAME_MAPS[currentMap];


playButton.addEventListener('click', startGame);
mapsPlayButton.addEventListener('click', () => {
    hideMaps();
    startGame();
});

creditsButton.addEventListener('click', showCredits);
backButton.addEventListener('click', hideCredits);

instructionsButton.addEventListener('click', showInstructions);
instructionsBackButton.addEventListener('click', hideInstructions);

mapsButton.addEventListener('click', showMaps);
mapsBackButton.addEventListener('click', hideMaps);

function startGame(mapType = 'classic') {
    currentMap = mapType;
    mazeLayout = GAME_MAPS[currentMap];

    menuContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    gameActive = true;
    isGameOver = false;
    playerLives = 3;
    updateHUD();
    init();
}

function showCredits() {
    menuContainer.style.display = 'none';
    creditsContainer.style.display = 'flex';
}


function hideCredits() {
    creditsContainer.style.display = 'none';
    menuContainer.style.display = 'flex';
}

function showInstructions() {
    menuContainer.style.display = 'none';
    instructionsContainer.style.display = 'flex';
}

function hideInstructions() {
    instructionsContainer.style.display = 'none';
    menuContainer.style.display = 'flex';
}

function showMaps() {
    menuContainer.style.display = 'none';
    mapsContainer.style.display = 'flex';
}

function hideMaps() {
    mapsContainer.style.display = 'none';
    menuContainer.style.display = 'flex';
}


function switchCamera() {
    isTopView = !isTopView;
    if (isTopView) {
        camera.position.set(0, 30, 0);
        camera.lookAt(0, 0, 0);
        camera.rotation.z = 0;

        secondaryCamera.position.set(arenaSize, arenaSize, arenaSize);
        secondaryCamera.lookAt(0, 0, 0);
    } else {
        camera.position.set(arenaSize, arenaSize, arenaSize);
        camera.lookAt(0, 0, 0);

        secondaryCamera.position.set(0, 30, 0);
        secondaryCamera.lookAt(0, 0, 0);
        secondaryCamera.rotation.z = 0;
    }
}

function placeBomb() {
    const existingBomb = bombs.find(bomb =>
        bomb.gridX === currentGridX &&
        bomb.gridZ === currentGridZ
    );

    if (existingBomb) return;

    if (bombSound) {
        const sound = new THREE.Audio(listener);
        sound.setBuffer(bombSound);
        sound.setVolume(0.5);
        sound.play();
    }

    const worldPos = gridToWorld(currentGridX, currentGridZ);

    const bombGroup = new THREE.Group();
    bombGroup.position.set(worldPos.x, 0, worldPos.z);
    scene.add(bombGroup);


    loadOBJModel(
        '/assets/models/bomb/bomb.obj',
        '/assets/models/bomb/bomb.mtl',
        {x: 0, y: 0, z: 0},
        bombGroup
    );

    const bomb = {
        mesh: bombGroup,
        gridX: currentGridX,
        gridZ: currentGridZ,
        timer: Date.now(),
    };

    bombs.push(bomb);

    setTimeout(() => explodeBomb(bomb), BOMB_TIMER);
}

function explodeBomb(bomb) {
    scene.remove(bomb.mesh);
    bombs = bombs.filter(b => b !== bomb);

    const explosionLight = new THREE.PointLight(0xffff00, 3, 10);
    explosionLight.position.copy(bomb.mesh.position);
    explosionLight.position.y = 1; 
    scene.add(explosionLight);

    
    const flashDuration = 500; 
    const flashStartIntensity = 30;
    const flashStartTime = Date.now();

    function updateFlash() {
        const elapsed = Date.now() - flashStartTime;
        const progress = elapsed / flashDuration;

        if (progress < 1) {
            explosionLight.intensity = flashStartIntensity * (1 - progress);
            requestAnimationFrame(updateFlash);
        } else {
            scene.remove(explosionLight);
        }
    }

    updateFlash();

    const explosionGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
    const explosionMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7
    });

    const canPropagate = (gridX, gridZ) => {
        if (gridX < 0 || gridX >= gridSize || gridZ < 0 || gridZ >= gridSize) {
            return false;
        }
        return mazeLayout[gridZ][gridX] !== 1;
    };

    const explosionCells = [];
    const killedRats = new Set();


    const addExplosion = (gridX, gridZ) => {
        if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
            const worldPos = gridToWorld(gridX, gridZ);
            const explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial);
            explosionMesh.position.set(worldPos.x, 0.1, worldPos.z);
            scene.add(explosionMesh);
            explosionCells.push(explosionMesh);

            rats.forEach(rat => {
                if (rat.gridX === gridX && rat.gridZ === gridZ) {
                    killedRats.add(rat);
                }
            });

            if (mazeLayout[gridZ][gridX] === 2) {
                mazeLayout[gridZ][gridX] = 0;
                arena.children.forEach(child => {
                    if (child.position.x === worldPos.x &&
                        child.position.z === worldPos.z &&
                        child instanceof THREE.Group) {
                        arena.remove(child);

                        // deixar a 1 para teste
                        if (Math.random() < 1) {
                            const mapPowerUps = MAP_MODELS[currentMap].powerUps;
                            const randomPowerUp = mapPowerUps[Math.floor(Math.random() * mapPowerUps.length)];
                            const powerUpGroup = new THREE.Group();
                            powerUpGroup.position.set(worldPos.x, wallHeight / 2, worldPos.z);

                            powerUpGroup.userData.isPowerUp = true;

                            loadOBJModel(
                                randomPowerUp.obj,
                                randomPowerUp.mtl,
                                {x: 0, y: 0, z: 0},
                                powerUpGroup
                            );

                            const initialY = powerUpGroup.position.y;
                            powerUpGroup.userData.floatAnimation = {
                                initialY: initialY,
                                offset: 0
                            };

                            arena.add(powerUpGroup);
                        }
                    }
                });
                return false;
            }
            return true;
        }
        return false;
    };

    addExplosion(bomb.gridX, bomb.gridZ);

    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];


    directions.forEach(([dx, dz]) => {
        let canContinue = true;
        for (let i = 1; i <= EXPLOSION_RANGE && canContinue; i++) {
            const gridX = bomb.gridX + (dx * i);
            const gridZ = bomb.gridZ + (dz * i);

            if (!canPropagate(gridX, gridZ)) {
                break;
            }

            canContinue = addExplosion(gridX, gridZ);
        }
    });

    rats = rats.filter(rat => {
        if (killedRats.has(rat)) {
            scene.remove(rat.mesh);
            return false;
        }
        return true;
    });

    const checkPlayerDamage = () => {
        const playerGridPos = worldToGrid(player.position.x, player.position.z);

        const isPlayerHit = explosionCells.some(mesh => {
            const explosionGridPos = worldToGrid(mesh.position.x, mesh.position.z);
            return explosionGridPos.x === playerGridPos.x &&
                explosionGridPos.z === playerGridPos.z;
        });

        if (isPlayerHit && !isGameOver) {
            if (damageSound) {
                const sound = new THREE.Audio(listener);
                sound.setBuffer(damageSound);
                sound.setVolume(0.5);
                sound.play();
            }

            playerLives--;
            updateHUD();

            if (playerLives <= 0) {
                gameOver();
            }
        }
    };

    checkPlayerDamage();

    setTimeout(() => {
        explosionCells.forEach(mesh => scene.remove(mesh));
    }, EXPLOSION_DURATION);
}

function loadOBJModel(objPath, mtlPath, position, parentGroup) {
    const materialLoader = new MTLLoader();

    materialLoader.load(mtlPath, function (materials) {
        materials.preload();

        const objectLoader = new OBJLoader();
        objectLoader.setMaterials(materials);

        objectLoader.load(objPath,
            function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                
                let scale = 1;
                if (objPath.includes('spider')) scale = 0.5;
                if (objPath.includes('robot')) scale = 0.8;
                if (objPath.includes('barrel')) scale = 0.7;
                

                object.position.set(position.x, position.y, position.z);
                object.scale.set(scale, scale, scale);
                parentGroup.add(object);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('Error loading OBJ:', error);
            }
        );
    });
}

let currentGridX = 0;
let currentGridZ = 0;
let targetGridX = 0;
let targetGridZ = 0;

function gridToWorld(gridX, gridZ) {
    return {
        x: (gridX - gridSize / 2 + 0.5) * cellSize,
        z: (gridZ - gridSize / 2 + 0.5) * cellSize
    };
}

function checkRatCollision(rat) {
    const playerGridPos = worldToGrid(player.position.x, player.position.z);
    return rat.gridX === playerGridPos.x && rat.gridZ === playerGridPos.z;
}

function worldToGrid(worldX, worldZ) {
    return {
        x: Math.floor((worldX + arenaSize / 2) / cellSize),
        z: Math.floor((worldZ + arenaSize / 2) / cellSize)
    };
}

const hudContainer = document.createElement('div');
hudContainer.style.position = 'absolute';
hudContainer.style.top = '10px';
hudContainer.style.left = '10px';
hudContainer.style.color = 'white';
hudContainer.style.fontSize = '24px';
hudContainer.style.fontFamily = 'Arial, sans-serif';
gameContainer.appendChild(hudContainer);

function updateHUD() {
    hudContainer.textContent = `Vidas: ${playerLives} | Moedas: ${collectedCoins}/${totalCoins}`;
}

function init() {
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 

    
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -arenaSize * aspect / 2,
        arenaSize * aspect / 2,
        arenaSize / 2,
        -arenaSize / 2,
        1, 1000
    );
    camera.add(listener);
    camera.position.set(arenaSize, arenaSize, arenaSize);
    camera.lookAt(0, 0, 0);

    
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    gameContainer.appendChild(renderer.domElement);

    
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = true;

    
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -arenaSize;
    sunLight.shadow.camera.right = arenaSize;
    sunLight.shadow.camera.top = arenaSize;
    sunLight.shadow.camera.bottom = -arenaSize;
    sunLight.shadow.bias = -0.001;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    
    const fillLight = new THREE.DirectionalLight(0x8fb4d6, 0.3);
    fillLight.position.set(-20, 20, -20);
    scene.add(fillLight);

    
    const rimLight = new THREE.DirectionalLight(0xfff0dd, 0.2);
    rimLight.position.set(0, 10, -20);
    scene.add(rimLight);

    
    const pointLight1 = new THREE.PointLight(0xffcc77, 5, 30);
    pointLight1.position.set(arenaSize / 3, 5, arenaSize / 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x77ccff, 5, 30);
    pointLight2.position.set(-arenaSize / 3, 5, -arenaSize / 3);
    scene.add(pointLight2);

    
    topViewScene = new THREE.Scene();
    topViewScene.background = new THREE.Color(0x000000);

    topViewCamera = new THREE.OrthographicCamera(
        -arenaSize / 2,
        arenaSize / 2,
        arenaSize / 2,
        -arenaSize / 2,
        1, 1000
    );
    topViewCamera.position.set(0, 30, 0);
    topViewCamera.lookAt(0, 0, 0);
    topViewCamera.rotation.z = 0;

    topViewRenderer = new THREE.WebGLRenderer({antialias: true});
    topViewRenderer.setSize(200, 200);
    topViewRenderer.shadowMap.enabled = true;
    document.getElementById('topViewContainer').appendChild(topViewRenderer.domElement);

    
    secondaryScene = new THREE.Scene();
    secondaryScene.background = new THREE.Color(0x000000);

    secondaryCamera = new THREE.OrthographicCamera(
        -arenaSize / 2,
        arenaSize / 2,
        arenaSize / 2,
        -arenaSize / 2,
        1, 1000
    );
    secondaryCamera.position.set(0, 30, 0);
    secondaryCamera.lookAt(0, 0, 0);
    secondaryCamera.rotation.z = 0;

    secondaryRenderer = new THREE.WebGLRenderer({antialias: true});
    secondaryRenderer.setSize(200, 200);
    secondaryRenderer.shadowMap.enabled = true;
    document.getElementById('secondaryViewContainer').appendChild(secondaryRenderer.domElement);

    lightReferences.ambient = ambientLight;
    lightReferences.sun = sunLight;
    lightReferences.fill = fillLight;
    lightReferences.rim = rimLight;
    lightReferences.point1 = pointLight1;
    lightReferences.point2 = pointLight2;


    
    createArena();
    createTopViewArena();
    createCoins();
    createPlayer();
    createTopViewPlayer();
    initializeRats();
    createLightControlPanel();

    createClock();
    gameStartTime = GAME_START_TIME;

    
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('resize', onWindowResize, false);

    
    animate();
}

function createFreeCamera() {
    freeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    freeCamera.position.set(0, 10, 20);
    freeCamera.lookAt(0, 0, 0);

    
    targetRotationX = 0;
    targetRotationY = 0;
    currentRotationX = 0;
    currentRotationY = 0;

    initializeFreeCameraControls();
}

function initializeFreeCameraControls() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
}

function onPointerLockChange() {
    freeCameraActive = document.pointerLockElement === document.body;
}

function onMouseMove(event) {
    if (!freeCameraActive || !freeCamera) return;

    
    const sensitivity = 0.002;

    const deltaX = event.movementX || 0;
    const deltaY = event.movementY || 0;


    targetRotationY -= deltaX * sensitivity;
    targetRotationX -= deltaY * sensitivity;


    targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));


    freeCamera.rotation.order = 'YXZ'; 
    freeCamera.rotation.x = targetRotationX;
    freeCamera.rotation.y = targetRotationY;
}

function updateCameraRotation() {
    if (!freeCameraActive || !freeCamera) return;

    
    currentRotationX = THREE.MathUtils.lerp(currentRotationX, targetRotationX, 0.1);
    currentRotationY = THREE.MathUtils.lerp(currentRotationY, targetRotationY, 0.1);

    
    freeCamera.rotation.x = currentRotationX;
    freeCamera.rotation.y = currentRotationY;
}

function createArena() {
    arena = new THREE.Group();

    
    const floorTexturePath = getRandomTexture(WALL_TEXTURES[currentMap].floor);
    const floorTexture = textureLoader.load(floorTexturePath);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(gridSize, gridSize);

    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshLambertMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arena.add(floor);


    createGrid();


    const wallNorth = createWall(arenaSize, wallHeight, 0.5);
    wallNorth.position.set(0, wallHeight / 2, -arenaSize / 2);
    arena.add(wallNorth);

    const wallSouth = createWall(arenaSize, wallHeight, 0.5);
    wallSouth.position.set(0, wallHeight / 2, arenaSize / 2);
    arena.add(wallSouth);

    const wallEast = createWall(0.5, wallHeight, arenaSize);
    wallEast.position.set(arenaSize / 2, wallHeight / 2, 0);
    arena.add(wallEast);

    const wallWest = createWall(0.5, wallHeight, arenaSize);
    wallWest.position.set(-arenaSize / 2, wallHeight / 2, 0);
    arena.add(wallWest);

    createMazeBlocks();

    scene.add(arena);
}

let bombSound;
let damageSound;

let collectSound;


function getRandomTexture(textureArray) {
    return textureArray[Math.floor(Math.random() * textureArray.length)];
}

audioLoader.load('assets/sounds/collect.wav', function (buffer) {
    collectSound = buffer;
});


audioLoader.load('assets/sounds/bomba.wav', function (buffer) {
    bombSound = buffer;
});
audioLoader.load('assets/sounds/damage.wav', function (buffer) {
    damageSound = buffer;
});


function gameOver() {
    isGameOver = true;

    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.position = 'absolute';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverDiv.style.color = 'white';
    gameOverDiv.style.padding = '20px';
    gameOverDiv.style.borderRadius = '10px';
    gameOverDiv.style.textAlign = 'center';
    gameOverDiv.innerHTML = `
        <h2>Game Over!</h2>
        <button id="restartButton" style="padding: 10px; margin-top: 10px;">Reiniciar</button>
    `;

    gameContainer.appendChild(gameOverDiv);

    document.getElementById('restartButton').addEventListener('click', () => {
        gameContainer.removeChild(gameOverDiv);
        restartGame();
    });
}

function restartGame() {


    gameActive = false;


    gameContainer.removeChild(renderer.domElement);
    document.getElementById('topViewContainer').removeChild(topViewRenderer.domElement);
    document.getElementById('secondaryViewContainer').removeChild(secondaryRenderer.domElement);


    renderer.dispose();
    topViewRenderer.dispose();
    secondaryRenderer.dispose();


    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onWindowResize);

    gameStartTime = GAME_START_TIME;
    if (clockElement) {
        gameContainer.removeChild(clockElement);
    }


    while (scene.children.length > 0) {
        const object = scene.children[0];
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
        scene.remove(object);
    }


    while (secondaryScene.children.length > 0) {
        secondaryScene.remove(secondaryScene.children[0]);
    }
    while (topViewScene.children.length > 0) {
        topViewScene.remove(topViewScene.children[0]);
    }


    bombs = [];
    explosions = [];
    rats = [];
    currentGridX = 0;
    currentGridZ = 0;
    targetGridX = 0;
    targetGridZ = 0;
    canMove = true;
    playerSpeed2 = 1.0;
    isSpeedBoosted = false;
    collectedCoins = 0;
    totalCoins = 0;
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;


    if (speedBoostTimeout) {
        clearTimeout(speedBoostTimeout);
        speedBoostTimeout = null;
    }


    player = null;
    arena = null;
    topViewPlayer = null;
    topViewArena = null;


    if (isGameOver) {
        playerLives = 3;
        isGameOver = false;
    }

    scene = new THREE.Scene();
    secondaryScene = new THREE.Scene();
    topViewScene = new THREE.Scene();

    gameActive = true;
    init();
    updateHUD();
}

function createGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.3, transparent: true});

    for (let i = 0; i <= gridSize; i++) {
        const pos = (i / gridSize) * arenaSize - arenaSize / 2;

        const hGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-arenaSize / 2, 0.01, pos),
            new THREE.Vector3(arenaSize / 2, 0.01, pos)
        ]);
        const hLine = new THREE.Line(hGeometry, gridMaterial);
        arena.add(hLine);

        const vGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos, 0.01, -arenaSize / 2),
            new THREE.Vector3(pos, 0.01, arenaSize / 2)
        ]);
        const vLine = new THREE.Line(vGeometry, gridMaterial);
        arena.add(vLine);
    }
}

function createMazeBlocks() {
    for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
            if (mazeLayout[z][x] === 1) {
                const sidesTexture = textureLoader.load(getRandomTexture(WALL_TEXTURES[currentMap].sides));
                const topTexture = textureLoader.load(getRandomTexture(WALL_TEXTURES[currentMap].top));

                sidesTexture.wrapS = sidesTexture.wrapT = THREE.RepeatWrapping;
                topTexture.wrapS = topTexture.wrapT = THREE.RepeatWrapping;

                const wallMaterials = [
                    new THREE.MeshLambertMaterial({map: sidesTexture}), // right
                    new THREE.MeshLambertMaterial({map: sidesTexture}), // left
                    new THREE.MeshLambertMaterial({map: topTexture}),   // top
                    new THREE.MeshLambertMaterial({map: sidesTexture}), // bottom
                    new THREE.MeshLambertMaterial({map: sidesTexture}), // front
                    new THREE.MeshLambertMaterial({map: sidesTexture})  // back
                ];

                const blockGeometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
                const block = new THREE.Mesh(blockGeometry, wallMaterials);
                const worldPos = gridToWorld(x, z);
                block.position.set(worldPos.x, wallHeight / 2, worldPos.z);
                block.castShadow = true;
                block.receiveShadow = true;

                const uvAttribute = block.geometry.attributes.uv;
                for (let i = 0; i < uvAttribute.count; i++) {
                    uvAttribute.setXY(i,
                        uvAttribute.getX(i),
                        uvAttribute.getY(i) * (wallHeight / cellSize)
                    );
                }

                arena.add(block);
            } else if (mazeLayout[z][x] === 2) {
                const worldPos = gridToWorld(x, z);
                const mapModels = MAP_MODELS[currentMap].destructible;
                const randomModel = mapModels[Math.floor(Math.random() * mapModels.length)];

                const modelGroup = new THREE.Group();
                modelGroup.position.set(worldPos.x, wallHeight / 2, worldPos.z);
                arena.add(modelGroup);

                loadOBJModel(
                    randomModel.obj,
                    randomModel.mtl,
                    {x: 0, y: 0, z: 0},
                    modelGroup
                );
            }
        }
    }
}

function createTopViewArena() {
    topViewArena = new THREE.Group();

    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x339933,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    topViewArena.add(floor);

    createTopViewGrid();

    const wallNorth = createTopViewWall(arenaSize, 0.5, 0.5, 0xff0000);
    wallNorth.position.set(0, 0.25, -arenaSize / 2);
    topViewArena.add(wallNorth);

    const wallSouth = createTopViewWall(arenaSize, 0.5, 0.5, 0x0000ff);
    wallSouth.position.set(0, 0.25, arenaSize / 2);
    topViewArena.add(wallSouth);

    const wallEast = createTopViewWall(0.5, 0.5, arenaSize, 0xffff00);
    wallEast.position.set(arenaSize / 2, 0.25, 0);
    topViewArena.add(wallEast);

    const wallWest = createTopViewWall(0.5, 0.5, arenaSize, 0x00ff00);
    wallWest.position.set(-arenaSize / 2, 0.25, 0);
    topViewArena.add(wallWest);

    createTopViewMazeBlocks();

    topViewScene.add(topViewArena);
}


function createRat(gridX, gridZ) {
    const worldPos = gridToWorld(gridX, gridZ);
    const ratGroup = new THREE.Group();
    ratGroup.position.set(worldPos.x, 0, worldPos.z);

    const ratModel = MAP_MODELS[currentMap].rat;
    loadOBJModel(
        ratModel.obj,
        ratModel.mtl,
        {x: 0, y: 0, z: 0},
        ratGroup
    );

    scene.add(ratGroup);

    return {
        mesh: ratGroup,
        gridX: gridX,
        gridZ: gridZ,
        targetGridX: gridX,
        targetGridZ: gridZ,
        isMoving: false,
        rotation: 0,
        lastKnownPlayerPos: null,
        isChasing: false,
        lastDamageTime: 0
    };
}

function initializeRats() {
    rats = [];

    const validPositions = [];

    for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
            if (mazeLayout[z][x] === 0) {
                validPositions.push({x, z});
            }
        }
    }

    const playerStartPos = {x: currentGridX, z: currentGridZ};
    const safeDistance = 4; 
    const safePositions = validPositions.filter(pos => {
        const distance = Math.sqrt(
            Math.pow(pos.x - playerStartPos.x, 2) +
            Math.pow(pos.z - playerStartPos.z, 2)
        );
        return distance >= safeDistance;
    });

    const positionsToUse = safePositions.length >= 4 ? safePositions : validPositions;

    for (let i = 0; i < 4; i++) {
        if (positionsToUse.length === 0) break; 

        const randomIndex = Math.floor(Math.random() * positionsToUse.length);
        const position = positionsToUse[randomIndex];

        positionsToUse.splice(randomIndex, 1);

        const rat = createRat(position.x, position.z);
        rats.push(rat);
    }

    setInterval(moveRats, RAT_MOVE_INTERVAL);
}

function hasLineOfSight(ratGridX, ratGridZ, playerGridX, playerGridZ) {
    if (ratGridX !== playerGridX && ratGridZ !== playerGridZ) {
        return false;
    }

    const dx = Math.sign(playerGridX - ratGridX);
    const dz = Math.sign(playerGridZ - ratGridZ);

    let x = ratGridX;
    let z = ratGridZ;

    while (x !== playerGridX || z !== playerGridZ) {
        x += dx;
        z += dz;

        if (mazeLayout[z][x] === 1 || mazeLayout[z][x] === 2) {
            return false;
        }
    }

    return true;
}

function moveRats() {
    const playerGridPos = worldToGrid(player.position.x, player.position.z);

    rats.forEach(rat => {
        if (!rat.isMoving) {
            if (hasLineOfSight(rat.gridX, rat.gridZ, playerGridPos.x, playerGridPos.z)) {
                rat.lastKnownPlayerPos = {x: playerGridPos.x, z: playerGridPos.z};
                rat.isChasing = true;

                const dx = Math.sign(playerGridPos.x - rat.gridX);
                const dz = Math.sign(playerGridPos.z - rat.gridZ);

                if (dx !== 0 && canMoveToCell(rat.gridX + dx, rat.gridZ)) {
                    rat.targetGridX = rat.gridX + dx;
                    rat.targetGridZ = rat.gridZ;
                    rat.isMoving = true;
                } else if (dz !== 0 && canMoveToCell(rat.gridX, rat.gridZ + dz)) {
                    rat.targetGridX = rat.gridX;
                    rat.targetGridZ = rat.gridZ + dz;
                    rat.isMoving = true;
                }
            } else if (rat.isChasing && rat.lastKnownPlayerPos) {
                const dx = Math.sign(rat.lastKnownPlayerPos.x - rat.gridX);
                const dz = Math.sign(rat.lastKnownPlayerPos.z - rat.gridZ);

                let moved = false;

                if (dx !== 0 && canMoveToCell(rat.gridX + dx, rat.gridZ)) {
                    rat.targetGridX = rat.gridX + dx;
                    rat.targetGridZ = rat.gridZ;
                    moved = true;
                } else if (dz !== 0 && canMoveToCell(rat.gridX, rat.gridZ + dz)) {
                    rat.targetGridX = rat.gridX;
                    rat.targetGridZ = rat.gridZ + dz;
                    moved = true;
                }

                if (moved) {
                    rat.isMoving = true;
                } else if (rat.gridX === rat.lastKnownPlayerPos.x &&
                    rat.gridZ === rat.lastKnownPlayerPos.z) {
                    rat.lastKnownPlayerPos = null;
                    rat.isChasing = false;
                }
            } else {
                const directions = [
                    {dx: 1, dz: 0, rotation: -Math.PI / 2},
                    {dx: -1, dz: 0, rotation: Math.PI / 2},
                    {dx: 0, dz: 1, rotation: Math.PI},
                    {dx: 0, dz: -1, rotation: 0}
                ];

                const validDirections = directions.filter(dir => {
                    const newX = rat.gridX + dir.dx;
                    const newZ = rat.gridZ + dir.dz;
                    return canMoveToCell(newX, newZ);
                });

                if (validDirections.length > 0) {
                    const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                    rat.targetGridX = rat.gridX + direction.dx;
                    rat.targetGridZ = rat.gridZ + direction.dz;
                    rat.isMoving = true;
                    rat.mesh.rotation.y = direction.rotation;
                }
            }
        }
    });
}


function updateRats() {
    const currentTime = Date.now();
    const DAMAGE_COOLDOWN = 3000; 
    rats.forEach(rat => {
        if (checkRatCollision(rat) && !isGameOver) {
            if (currentTime - rat.lastDamageTime >= DAMAGE_COOLDOWN) {
                if (damageSound) {
                    const sound = new THREE.Audio(listener);
                    sound.setBuffer(damageSound);
                    sound.setVolume(0.5);
                    sound.play();
                }

                playerLives--;
                updateHUD();

                rat.lastDamageTime = currentTime;

                if (playerLives <= 0) {
                    gameOver();
                }
            }
        }

        if (rat.isMoving) {
            const targetPos = gridToWorld(rat.targetGridX, rat.targetGridZ);
            const moveSpeed = 0.03;

            const dx = targetPos.x - rat.mesh.position.x;
            const dz = targetPos.z - rat.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < 0.1) {
                rat.mesh.position.x = targetPos.x;
                rat.mesh.position.z = targetPos.z;
                rat.gridX = rat.targetGridX;
                rat.gridZ = rat.targetGridZ;
                rat.isMoving = false;
            } else {
                rat.mesh.position.x += (dx / distance) * moveSpeed;
                rat.mesh.position.z += (dz / distance) * moveSpeed;

                rat.mesh.rotation.y = Math.atan2(dx, dz);
            }
        }
    });
}

function createTopViewGrid() {
    const gridMaterial = new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.5, transparent: true});

    for (let i = 0; i <= gridSize; i++) {
        const pos = (i / gridSize) * arenaSize - arenaSize / 2;

        const hGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-arenaSize / 2, 0.01, pos),
            new THREE.Vector3(arenaSize / 2, 0.01, pos)
        ]);
        const hLine = new THREE.Line(hGeometry, gridMaterial);
        topViewArena.add(hLine);

        const vGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos, 0.01, -arenaSize / 2),
            new THREE.Vector3(pos, 0.01, arenaSize / 2)
        ]);
        const vLine = new THREE.Line(vGeometry, gridMaterial);
        topViewArena.add(vLine);
    }
}

function createTopViewMazeBlocks() {
    const blockGeometry = new THREE.BoxGeometry(cellSize * 0.9, 0.5, cellSize * 0.9);
    const blockMaterial = new THREE.MeshBasicMaterial({color: 0x333333});

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

function createWall(width, height, depth) {
    const sidesTexture = textureLoader.load(getRandomTexture(WALL_TEXTURES[currentMap].sides));
    const topTexture = textureLoader.load(getRandomTexture(WALL_TEXTURES[currentMap].top));

    sidesTexture.wrapS = sidesTexture.wrapT = THREE.RepeatWrapping;
    topTexture.wrapS = topTexture.wrapT = THREE.RepeatWrapping;

    sidesTexture.repeat.set(width / cellSize, height / cellSize);
    topTexture.repeat.set(width / cellSize, depth / cellSize);

    const wallMaterials = [
        new THREE.MeshLambertMaterial({map: sidesTexture}), // right
        new THREE.MeshLambertMaterial({map: sidesTexture}), // left
        new THREE.MeshLambertMaterial({map: topTexture}),   // top
        new THREE.MeshLambertMaterial({map: sidesTexture}), // bottom
        new THREE.MeshLambertMaterial({map: sidesTexture}), // front
        new THREE.MeshLambertMaterial({map: sidesTexture})  // back
    ];

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, wallMaterials);
    wall.castShadow = true;
    wall.receiveShadow = true;
    return wall;
}

function createTopViewWall(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({color: color});
    return new THREE.Mesh(geometry, material);
}

function createPlayer() {
    player = new THREE.Group();

    const hatTexture = textureLoader.load(PLAYER_TEXTURES.hat);
    const shirtTexture = textureLoader.load(PLAYER_TEXTURES.shirt);
    const pantsTexture = textureLoader.load(PLAYER_TEXTURES.pants);

    [hatTexture, shirtTexture, pantsTexture].forEach(texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
    });

    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.0, 0.4);
    const bodyMaterial = new THREE.MeshLambertMaterial({
        map: shirtTexture,
        side: THREE.DoubleSide
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;

    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({color: 0xffcc99});
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;

    const hatGroup = new THREE.Group();
    const hatMaterial = new THREE.MeshLambertMaterial({
        map: hatTexture,
        side: THREE.DoubleSide
    });

    const brimGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
    const brim = new THREE.Mesh(brimGeometry, hatMaterial);
    brim.position.y = 1.9;

    const crownGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.3, 32);
    const crown = new THREE.Mesh(crownGeometry, hatMaterial);
    crown.position.y = 2.05;

    hatGroup.add(brim);
    hatGroup.add(crown);

    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterial = new THREE.MeshLambertMaterial({
        map: shirtTexture,
        side: THREE.DoubleSide
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.9, 0);
    leftArm.castShadow = true;

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.9, 0);
    rightArm.castShadow = true;

    const legGeometry = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const legMaterial = new THREE.MeshLambertMaterial({
        map: pantsTexture,
        side: THREE.DoubleSide
    });

    const leftLegGroup = new THREE.Group();
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.y = -0.35;
    leftLegGroup.position.set(-0.3, 0.3, 0);
    leftLegGroup.add(leftLeg);

    const rightLegGroup = new THREE.Group();
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.y = -0.35;
    rightLegGroup.position.set(0.3, 0.3, 0);
    rightLegGroup.add(rightLeg);

    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
    const eyeballMaterial = new THREE.MeshLambertMaterial({color: 0x000000});

    const leftEye = new THREE.Group();
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const leftEyeball = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeballMaterial);
    leftEyeball.position.z = -0.05;
    leftEye.add(leftEyeWhite);
    leftEye.add(leftEyeball);
    leftEye.position.set(-0.15, 1.6, -0.35);

    const rightEye = new THREE.Group();
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEyeball = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeballMaterial);
    rightEyeball.position.z = -0.05;
    rightEye.add(rightEyeWhite);
    rightEye.add(rightEyeball);
    rightEye.position.set(0.15, 1.6, -0.35);

    const mouthGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 12, Math.PI);
    const mouthMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.35, -0.38);
    mouth.rotation.z = Math.PI;

    player.add(body);
    player.add(head);
    player.add(hatGroup);
    player.add(leftArm);
    player.add(rightArm);
    player.add(leftLegGroup);
    player.add(rightLegGroup);
    player.add(leftEye);
    player.add(rightEye);
    player.add(mouth);

    player.userData = {
        leftArm,
        rightArm,
        leftLegGroup,
        rightLegGroup,
        isWalking: false,
        walkingTime: 0
    };

    const initialPos = gridToWorld(currentGridX, currentGridZ);
    player.position.set(initialPos.x, 0, initialPos.z);

    scene.add(player);
}

function animatePlayerLimbs(walkCycle) {
    if (!player || !player.userData) return;

    const {leftArm, rightArm, leftLegGroup, rightLegGroup} = player.userData;

    if (!canMove) {
        const armSwing = Math.sin(walkCycle) * LIMB_ROTATION;
        const legSwing = -Math.sin(walkCycle) * LIMB_ROTATION;

        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, armSwing, 0.3);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -armSwing, 0.3);

        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, legSwing, 0.3);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -legSwing, 0.3);
    } else {
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.3);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.3);
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.3);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.3);
    }
}

function createTopViewPlayer() {
    const geometry = new THREE.BoxGeometry(cellSize * 0.7, 0.2, cellSize * 0.7);
    const material = new THREE.MeshBasicMaterial({color: 0xff0000});

    topViewPlayer = new THREE.Mesh(geometry, material);

    const initialPos = gridToWorld(currentGridX, currentGridZ);
    topViewPlayer.position.set(initialPos.x, 0.5, initialPos.z);

    topViewScene.add(topViewPlayer);
}

document.addEventListener("DOMContentLoaded", () => {
    const mapButtons = document.querySelectorAll('.mapOption');
    let selectedMap = 'classic'; 
    
    mapButtons.forEach(button => {
        button.addEventListener('click', function() {

            mapButtons.forEach(btn => btn.classList.remove('selected'));
            
            this.classList.add('selected');
            
            selectedMap = this.getAttribute('data-value');
        });
    });
    
    document.querySelector('.mapOption[data-value="classic"]').classList.add('selected');
    
    document.getElementById('mapsPlayButton').addEventListener('click', () => {
        menu.style.display = "none";
        maps.style.display = "none";
        game.style.display = "block";
        
        startGame(selectedMap);
    });
});

function onKeyDown(event) {
    if (!canMove || !gameActive || isGameOver) return;

    if (event.code === 'KeyV') {
        if (!freeCameraActive) {
            if (!freeCamera) {
                createFreeCamera();
            }
            document.body.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
        return;
    }

    if (freeCameraActive) {
        switch (event.code) {
            case 'ArrowUp':
                freeCameraControls.forward = true;
                break;
            case 'ArrowDown':
                freeCameraControls.backward = true;
                break;
            case 'ArrowLeft':
                freeCameraControls.left = true;
                break;
            case 'ArrowRight':
                freeCameraControls.right = true;
                break;
            case 'KeyQ':
                freeCameraControls.up = true;
                break;
            case 'KeyE':
                freeCameraControls.down = true;
                break;
        }
        return;
    }

    let willMove = false;

    switch (event.code) {
        case 'KeyL':
            lightControlsVisible = !lightControlsVisible;
            lightControls.style.display = lightControlsVisible ? 'block' : 'none';
            break;
        case 'KeyC':
            switchCamera();
            break;

        case 'Space':
            placeBomb();
            break;

        case 'KeyW':
            if (canMoveToCell(currentGridX, currentGridZ - 1)) {
                moveForward = true;
                targetGridZ = currentGridZ - 1;
                willMove = true;
            }
            break;
        case 'KeyA':
            if (canMoveToCell(currentGridX - 1, currentGridZ)) {
                moveLeft = true;
                targetGridX = currentGridX - 1;
                willMove = true;
            }
            break;
        case 'KeyS':
            if (canMoveToCell(currentGridX, currentGridZ + 1)) {
                moveBackward = true;
                targetGridZ = currentGridZ + 1;
                willMove = true;
            }
            break;
        case 'KeyD':
            if (canMoveToCell(currentGridX + 1, currentGridZ)) {
                moveRight = true;
                targetGridX = currentGridX + 1;
                willMove = true;
            }
            break;

    }

    if (willMove) {
        canMove = false;
        player.userData.moveStartTime = Date.now();
        player.userData.startPos = {
            x: player.position.x,
            z: player.position.z
        };
    }
}

function canMoveToCell(gridX, gridZ) {
    if (gridX < 0 || gridX >= gridSize || gridZ < 0 || gridZ >= gridSize) {
        return false;
    }

    return mazeLayout[gridZ][gridX] === 0;
}

function onKeyUp(event) {

    if (freeCameraActive) {
        switch (event.code) {
            case 'ArrowUp':
                freeCameraControls.forward = false;
                break;
            case 'ArrowDown':
                freeCameraControls.backward = false;
                break;
            case 'ArrowLeft':
                freeCameraControls.left = false;
                break;
            case 'ArrowRight':
                freeCameraControls.right = false;
                break;
            case 'KeyQ':
                freeCameraControls.up = false;
                break;
            case 'KeyE':
                freeCameraControls.down = false;
                break;
        }
        return;
    }
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

function updateFreeCamera() {
    if (!freeCameraActive || !freeCamera) return;

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(freeCamera.quaternion);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(freeCamera.quaternion);

    if (freeCameraControls.forward) {
        freeCamera.position.addScaledVector(forward, freeCameraSpeed);
    }
    if (freeCameraControls.backward) {
        freeCamera.position.addScaledVector(forward, -freeCameraSpeed);
    }
    if (freeCameraControls.right) {
        freeCamera.position.addScaledVector(right, freeCameraSpeed);
    }
    if (freeCameraControls.left) {
        freeCamera.position.addScaledVector(right, -freeCameraSpeed);
    }
    if (freeCameraControls.up) {
        freeCamera.position.y += freeCameraSpeed;
    }
    if (freeCameraControls.down) {
        freeCamera.position.y -= freeCameraSpeed;
    }
}


function onWindowResize() {
    if (!gameActive) return;

    const aspect = window.innerWidth / window.innerHeight;

    camera.left = -arenaSize * aspect / 2;
    camera.right = arenaSize * aspect / 2;
    camera.top = arenaSize / 2;
    camera.bottom = -arenaSize / 2;
    camera.updateProjectionMatrix();

    if (freeCamera) {
        freeCamera.aspect = aspect;
        freeCamera.updateProjectionMatrix();
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
}


function updatePowerUps() {
    arena.children.forEach(child => {
        if (child.userData.isPowerUp) {
            child.userData.floatAnimation.offset += 0.05;
            child.position.y = child.userData.floatAnimation.initialY +
                Math.sin(child.userData.floatAnimation.offset) * 0.2;

            child.rotation.y += 0.02;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        updateLighting();
        updateClock();
        const currentTime = Date.now();
        bombs.forEach(bomb => {
            const scale = 1 + 0.1 * Math.sin((currentTime - bomb.timer) / 200);
            bomb.mesh.scale.set(scale, scale, scale);
        });
        arena.children.forEach(child => {
            if (child.userData.isCoin) {
                child.userData.floatAnimation.offset += 0.03;
                child.position.y = child.userData.floatAnimation.initialY +
                    Math.sin(child.userData.floatAnimation.offset) * 0.2;
                child.rotation.y += 0.02;
            }
        });

        checkCoinCollection();

        updatePlayerMovement();
        updatePowerUps(); 
        checkPowerUpCollection(); 


        updateRats();
        updateFreeCamera();
        updateCameraRotation();

        renderer.render(scene, freeCameraActive ? freeCamera : camera);
        topViewRenderer.render(topViewScene, topViewCamera);
        secondaryRenderer.render(scene, secondaryCamera);
    }
}


function updatePlayerMovement() {
    if (!canMove) {
        const MOVEMENT_DURATION = 500 / playerSpeed2; 
        const targetPos = gridToWorld(targetGridX, targetGridZ);
        const progress = (Date.now() - player.userData.moveStartTime) / MOVEMENT_DURATION;
        const smoothProgress = Math.min(progress, 1);

        const dx = targetGridX - currentGridX;
        const dz = targetGridZ - currentGridZ;

        if (dx > 0) player.rotation.y = -Math.PI / 2;      // Direita
        else if (dx < 0) player.rotation.y = Math.PI / 2;  // Esquerda
        else if (dz > 0) player.rotation.y = Math.PI;      // Baixo
        else if (dz < 0) player.rotation.y = 0;            // Cima

        if (smoothProgress < 1) {
            player.position.x = player.userData.startPos.x + (targetPos.x - player.userData.startPos.x) * smoothProgress;
            player.position.z = player.userData.startPos.z + (targetPos.z - player.userData.startPos.z) * smoothProgress;

            const walkCycle = smoothProgress * Math.PI * 2; 
            animatePlayerLimbs(walkCycle);
        } else {
            player.position.x = targetPos.x;
            player.position.z = targetPos.z;
            currentGridX = targetGridX;
            currentGridZ = targetGridZ;
            moveForward = moveBackward = moveLeft = moveRight = false;
            canMove = true;

            animatePlayerLimbs(Math.PI * 2);
        }

        updateTopViewPlayer();
    }
}

function updateTopViewPlayer() {
    if (topViewPlayer && player) {
        topViewPlayer.position.x = player.position.x;
        topViewPlayer.position.z = player.position.z;
    }
}

function checkPowerUpCollection() {
    const playerGridPos = worldToGrid(player.position.x, player.position.z);

    arena.children.forEach(child => {
        if (child.userData.isPowerUp) {
            const powerUpGridPos = worldToGrid(child.position.x, child.position.z);

            if (powerUpGridPos.x === playerGridPos.x && powerUpGridPos.z === playerGridPos.z) {
                arena.remove(child);

                applyPowerUpEffect();

                if (collectSound) {
                    const sound = new THREE.Audio(listener);
                    sound.setBuffer(collectSound);
                    sound.setVolume(0.5);
                    sound.play();
                }
            }
        }
    });
}


function applyPowerUpEffect() {
    const effectType = Math.random() < 0.5 ? 'health' : 'speed';

    switch (effectType) {
        case 'health':
            playerLives++;
            updateHUD();
            showFloatingText('+1 VIDA', 0x00ff00);
            break;

        case 'speed':
            if (isSpeedBoosted) {
                clearTimeout(speedBoostTimeout);
            }

            isSpeedBoosted = true;
            playerSpeed2 = SPEED_BOOST_MULTIPLIER;
            showFloatingText('VELOCIDADE +', 0xffff00);

            speedBoostTimeout = setTimeout(() => {
                isSpeedBoosted = false;
                playerSpeed2 = 1.0;
                showFloatingText('VELOCIDADE -', 0xffff00);
            }, SPEED_BOOST_DURATION);
            break;
    }
}

function showFloatingText(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 32px Arial';

    const textWidth = context.measureText(text).width;
    canvas.width = textWidth + 20;
    canvas.height = 48;

    context.font = 'Bold 32px Arial';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillText(text, 10, 34);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({map: texture});
    const sprite = new THREE.Sprite(spriteMaterial);

    sprite.position.copy(player.position);
    sprite.position.y += 2;
    sprite.scale.set(2, 1, 1);

    scene.add(sprite);

    setTimeout(() => {
        scene.remove(sprite);
    }, 2000);
}

function createCoins() {
    totalCoins = 0;
    collectedCoins = 0;

    for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
            if (mazeLayout[z][x] === 0) {
                if (Math.random() < 0.05) {
                    const worldPos = gridToWorld(x, z);
                    const coinGroup = new THREE.Group();
                    coinGroup.position.set(worldPos.x, wallHeight / 2, worldPos.z);

                    coinGroup.userData.isCoin = true;
                    coinGroup.userData.floatAnimation = {
                        initialY: wallHeight / 2,
                        offset: Math.random() * Math.PI * 2 
                    };

                    loadOBJModel(
                        MAP_MODELS[currentMap].coin.obj,
                        MAP_MODELS[currentMap].coin.mtl,
                        {x: 0, y: 0, z: 0},
                        coinGroup
                    );

                    arena.add(coinGroup);
                    totalCoins++;
                }
            }
        }
    }

    updateHUD();
}


function checkCoinCollection() {
    const playerGridPos = worldToGrid(player.position.x, player.position.z);

    arena.children.forEach(child => {
        if (child.userData.isCoin) {
            const coinGridPos = worldToGrid(child.position.x, child.position.z);

            if (coinGridPos.x === playerGridPos.x && coinGridPos.z === playerGridPos.z) {
                arena.remove(child);
                collectedCoins++;

                if (collectSound) {
                    const sound = new THREE.Audio(listener);
                    sound.setBuffer(collectSound);
                    sound.setVolume(0.5);
                    sound.play();
                }

                showFloatingText('+1', 0xFFD700);

                updateHUD();

                if (collectedCoins === totalCoins) {
                    showLevelComplete();
                }
            }
        }
    });

}

function showLevelComplete() {
    const levelCompleteDiv = document.createElement('div');
    levelCompleteDiv.style.position = 'absolute';
    levelCompleteDiv.style.top = '50%';
    levelCompleteDiv.style.left = '50%';
    levelCompleteDiv.style.transform = 'translate(-50%, -50%)';
    levelCompleteDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    levelCompleteDiv.style.color = 'white';
    levelCompleteDiv.style.padding = '20px';
    levelCompleteDiv.style.borderRadius = '10px';
    levelCompleteDiv.style.textAlign = 'center';
    levelCompleteDiv.innerHTML = `
        <h2>Nivel Completo!</h2>
        <p>Tens as moedas todsa!</p>
        <button id="nextLevelButton" style="padding: 10px; margin-top: 10px;">Proximo Nivel</button>
    `;

    gameContainer.appendChild(levelCompleteDiv);

    document.getElementById('nextLevelButton').addEventListener('click', () => {
        gameContainer.removeChild(levelCompleteDiv);
        loadNextLevel();
    });
}

function loadNextLevel() {
    const maps = Object.keys(GAME_MAPS);
    const currentIndex = maps.indexOf(currentMap);
    const nextIndex = (currentIndex + 1) % maps.length;
    currentMap = maps[nextIndex];

    mazeLayout = GAME_MAPS[currentMap];
    restartGame();
}


function updateLighting() {
    const time = Date.now() - GAME_START_TIME; 
    const cycleProgress = (time % cycleDuration) / cycleDuration;
    const angle = (cycleProgress * Math.PI * 2) + (Math.PI / 2);

    const sunRadius = 50;
    const sunHeight = Math.sin(angle) * 20 + 30;
    const sunLight = scene.children.find(child => child.isDirectionalLight);
    if (sunLight) {
        sunLight.position.x = Math.cos(angle) * sunRadius;
        sunLight.position.y = sunHeight;
        sunLight.position.z = Math.sin(angle) * sunRadius;

        const normalizedHeight = (sunHeight + 20) / 50;
        sunLight.intensity = Math.max(0.2, normalizedHeight * 0.8);
    }

    const dayColor = new THREE.Color(0x87CEEB);
    const nightColor = new THREE.Color(0x1a2b4c);
    const skyColor = new THREE.Color();
    skyColor.lerpColors(nightColor, dayColor, Math.max(0, Math.sin(angle)));
    scene.background = skyColor;
}

function createClock() {
    clockElement = document.createElement('div');
    clockElement.style.position = 'absolute';
    clockElement.style.top = '10px';
    clockElement.style.right = '10px';
    clockElement.style.color = 'white';
    clockElement.style.fontSize = '24px';
    clockElement.style.fontFamily = 'Arial, sans-serif';
    clockElement.style.padding = '5px 10px';
    clockElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    clockElement.style.borderRadius = '5px';
    gameContainer.appendChild(clockElement);
}

function updateClock() {
    const time = Date.now() - GAME_START_TIME;  
    const cycleProgress = (time % cycleDuration) / cycleDuration;

    const angle = (cycleProgress * Math.PI * 2) + (Math.PI / 2);
    const totalHours = ((angle / (Math.PI * 2)) * 24 + 12) % 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours - hours) * 60);

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    let period;
    if (hours >= 5 && hours < 12) {
        period = 'Manhã';
    } else if (hours >= 12 && hours < 18) {
        period = 'Tarde';
    } else if (hours >= 18 && hours < 21) {
        period = 'Anoitecer';
    } else {
        period = 'Noite';
    }

    clockElement.textContent = `${timeString} - ${period}`;
}


function createLightControlPanel() {
    lightControls = document.createElement('div');
    lightControls.style.position = 'absolute';
    lightControls.style.bottom = '10px';
    lightControls.style.right = '10px';
    lightControls.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    lightControls.style.padding = '10px';
    lightControls.style.borderRadius = '5px';
    lightControls.style.display = 'none'; 
    lightControls.style.zIndex = '1000';

    const title = document.createElement('div');
    title.textContent = 'Controles de Luz';
    title.style.color = 'white';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.textAlign = 'center';
    lightControls.appendChild(title);

    const lights = [
        {id: 'ambient', name: 'Ambient Light', color: '#ffffff'},
        {id: 'sun', name: 'Sun Light', color: '#ffff99'},
        {id: 'fill', name: 'Fill Light', color: '#8fb4d6'},
        {id: 'rim', name: 'Rim Light', color: '#fff0dd'},
        {id: 'point1', name: 'Point Light 1', color: '#ffcc77'},
        {id: 'point2', name: 'Point Light 2', color: '#77ccff'}
    ];

    lights.forEach(light => {
        const controlRow = document.createElement('div');
        controlRow.style.display = 'flex';
        controlRow.style.alignItems = 'center';
        controlRow.style.marginBottom = '5px';

        const label = document.createElement('label');
        label.textContent = light.name;
        label.style.color = 'white';
        label.style.flex = '1';
        label.style.marginRight = '10px';

        const toggle = document.createElement('button');
        toggle.id = `${light.id}-toggle`;
        toggle.textContent = 'ON';
        toggle.style.backgroundColor = light.color;
        toggle.style.color = '#000';
        toggle.style.border = 'none';
        toggle.style.borderRadius = '3px';
        toggle.style.padding = '5px 10px';
        toggle.style.cursor = 'pointer';
        toggle.dataset.state = 'on';
        toggle.dataset.lightId = light.id;
        toggle.dataset.color = light.color;

        toggle.addEventListener('click', toggleLight);

        controlRow.appendChild(label);
        controlRow.appendChild(toggle);
        lightControls.appendChild(controlRow);
    });

    gameContainer.appendChild(lightControls);
}


function toggleLight(event) {
    const button = event.target;
    const lightId = button.dataset.lightId;
    const currentState = button.dataset.state;

    if (!lightReferences[lightId]) return;

    if (currentState === 'on') {
        lightReferences[lightId].visible = false;
        button.textContent = 'OFF';
        button.style.backgroundColor = '#333';
        button.style.color = '#fff';
        button.dataset.state = 'off';
    } else {
        lightReferences[lightId].visible = true;
        button.textContent = 'ON';
        button.style.backgroundColor = button.dataset.color;
        button.style.color = '#000';
        button.dataset.state = 'on';
    }
}