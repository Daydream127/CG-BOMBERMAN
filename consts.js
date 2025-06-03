const GAME_MAPS = {
    maze: [
        [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        [0, 1, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
        [0, 1, 1, 2, 0, 0, 0, 2, 0, 0, 0, 2, 1, 1, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0],
        [1, 2, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 2, 1],
        [0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 1, 2, 0, 0, 2, 1, 2, 0, 0, 2, 1, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0],
        [1, 2, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 2, 1],
        [0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 1, 1, 2, 0, 0, 0, 2, 0, 0, 0, 2, 1, 1, 0],
        [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
        [0, 1, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 1, 0],
        [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
    ],
    classic: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 2, 0, 0, 1, 1, 1, 0, 1, 1, 2, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
        [0, 2, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 2, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 1, 0, 1, 1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0],
        [0, 2, 0, 0, 1, 2, 1, 1, 1, 2, 1, 1, 0, 2, 0],
        [0, 1, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 2, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 2, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 2, 0, 0, 1, 1, 1, 0, 1, 1, 2, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    arena: [
        [0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
        [1, 2, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 2, 1],
        [1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
        [1, 2, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 2, 1],
        [1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1]
    ]
};

const PLAYER_TEXTURES = {
    hat: 'assets/textures/player/hat.jpg',
    shirt: 'assets/textures/player/shirt.jpg',
    pants: 'assets/textures/player/pant.jpg'
};

const MAP_MODELS = {
    classic: {
        destructible: [
            {
                obj: '/assets/models/flower01/Flower01-0.obj',
                mtl: '/assets/models/flower01/Flower01-0.mtl'
            },
            {
                obj: '/assets/models/deer/deer.obj',
                mtl: '/assets/models/deer/deer.mtl'
            }
        ],
        powerUps: [
            {
                obj: '/assets/models/CreamPie/CreamPie.obj',
                mtl: '/assets/models/CreamPie/CreamPie.mtl'
            }
        ],
        rat: {
            obj: '/assets/models/rat/rat.obj',
            mtl: '/assets/models/rat/rat.mtl'
        },
        coin: {
            obj: '/assets/models/coin/coin.obj',
            mtl: '/assets/models/coin/coin.mtl'
        }
    },
    maze: {
        destructible: [
            {
                obj: '/assets/models/flower01/Flower01-0.obj',
                mtl: '/assets/models/flower01/Flower01-0.mtl'
            },
            {
                obj: '/assets/models/deer/deer.obj',
                mtl: '/assets/models/deer/deer.mtl'
            }
        ],
        powerUps: [
            {
                obj: '/assets/models/CreamPie/CreamPie.obj',
                mtl: '/assets/models/CreamPie/CreamPie.mtl'
            }
        ],
        rat: {
            obj: '/assets/models/rat/rat.obj',
            mtl: '/assets/models/rat/rat.mtl'
        },
        coin: {
            obj: '/assets/models/coin/coin.obj',
            mtl: '/assets/models/coin/coin.mtl'
        }
    },
    arena: {
        destructible: [
            {
                obj: '/assets/models/bell/bell.obj',
                mtl: '/assets/models/bell/bell.mtl'
            },
            {
                obj: '/assets/models/sacks/sacks.obj',
                mtl: '/assets/models/sacks/sacks.mtl'
            },
            {
                obj: '/assets/models/jar/jar.obj',
                mtl: '/assets/models/jar/jar.mtl'
            }
        ],
        powerUps: [
            {
                obj: '/assets/models/CreamPie/CreamPie.obj',
                mtl: '/assets/models/CreamPie/CreamPie.mtl'
            }
        ],
        rat: {
            obj: '/assets/models/rat/rat.obj',
            mtl: '/assets/models/rat/rat.mtl'
        },
        coin: {
            obj: '/assets/models/coin/coin.obj',
            mtl: '/assets/models/coin/coin.mtl'
        }
    }
};


const WALL_TEXTURES = {
    classic: {
        floor: [
            'assets/textures/classic/floor1.png',
        ],
        sides: [
            'assets/textures/classic/wall1.png',
            'assets/textures/classic/wall2.png',
            'assets/textures/classic/wall3.png',
            'assets/textures/classic/wall4.png'
        ],
        top: [
            'assets/textures/classic/top1.png',
        ]
    },
    maze: {
        floor: [
            'assets/textures/maze/floor1.png',
            'assets/textures/maze/floor2.png',
        ],
        sides: [
            'assets/textures/maze/wall1.png',
            'assets/textures/maze/wall2.png',
            'assets/textures/maze/wall3.png'
        ],
        top: [
            'assets/textures/maze/top1.png',
        ]
    },
    arena: {
        floor: [
            'assets/textures/arena/floor1.png',

        ],
        sides: [
            'assets/textures/arena/wall1.png',
            'assets/textures/arena/wall2.png',
            'assets/textures/arena/wall3.png',
            'assets/textures/arena/wall4.png',
            'assets/textures/arena/wall5.png'

        ],
        top: [
            'assets/textures/arena/top1.png',

        ]
    }
};

export { GAME_MAPS, PLAYER_TEXTURES, MAP_MODELS, WALL_TEXTURES };