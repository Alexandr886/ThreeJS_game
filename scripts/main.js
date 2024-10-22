const btnBeginGame = document.getElementById('begin-game'); // Кнопка "Начать игру" на главном экране

const audioEndGame = new Audio('../audio/endGame.mp3'); // звук gameover игры
const scorePlus = new Audio('../audio/score+.mp3'); // звук увеличения счёта
const gameMusic = new Audio('../audio/game.mp3'); // музыка во время игры


let score = 0;
let time;
const scoreElement = document.getElementById('score'); // Вывод счёта во время игры
const modalGameOver = document.getElementById('modal-game-over'); // Модалка gameover
const totalScore = document.getElementById('total-score'); // Здесь будет вывод итогового счёта в модалке по gameover
const btnStartOver = document.getElementById('game-start-over'); // кнопка "Ещё раз" в модальном окне по gameover

let gameOver = false; // для отслеживания был ли gameover
let musicOn = true; // для отслеживания вкл или выкл музыка во время игры

const musicControl = document.getElementById('music-control'); // инфо внизу экрана как вкл/откл музыку



// Запуск сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;


const renderer = new THREE.WebGLRenderer(); // всё будет рендерится в canvas
renderer.setSize( window.innerWidth, window.innerHeight ); // рендерится будет на весь экран, на всё пространство браузера
document.getElementById('game').appendChild( renderer.domElement ); // где будет выводится canvas



// Освещение: суть в том, что создается два направления света, это амбиентный и направленный. Они позволяют направить свет на объект, чтобы в итоге его видно было на холсте
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
directionalLight.position.set(0, 1, 1).normalize();
scene.add(directionalLight);



// Клик по кнопке "Начать игру"
btnBeginGame.onclick = () => {
    beginGame(); // запуск игры
    scoreElement.style.display = 'block'; // показать инфо счёта
    musicControl.style.display = 'block'; // показать управление музыкой
    btnBeginGame.classList.add('hidden'); // скрыть кнопку "Начать игру"
}


// Запуск игры
function beginGame() {
    gameMusic.play();

    // Игрок (зеленая платформа)
    const playerGeometry = new THREE.BoxGeometry(1, 0.2, 1); // создание куба с шириной, высотой и глубиной
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); // материал в виде цвета
    const player = new THREE.Mesh(playerGeometry, playerMaterial); //соединение геометрии и материала
    player.position.y = -3;
    scene.add(player)



    // Управление игроком (зеленой платформой)
    let moveLeft = false; // влево
    let moveRight = false; // вправо
    let moveUp = false; // вверх
    let moveDown = false; // вниз

    // слушатель по нажатию на клавиши
    document.addEventListener('keydown', (e) => {
        //меняем влево, вправо, вверх и вниз на true
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') moveUp = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') moveDown = true;

        //Вкл/Откл музыки во время игры
        if (e.code === 'KeyM') {
            if (musicOn) gameMusic.pause();
            else gameMusic.play();
            musicOn = !musicOn;
        }
    })

    // слушатель по отжатию клавиш
    document.addEventListener('keyup', (e) => {
        //меняем влево, вправо, вверх и вниз на false
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') moveUp = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') moveDown = false;
    })



    // Препятствия (падающие блоки)
    const obstacles = [];

    function createObstacle() {
        const size = Math.random() * 0.5 + 0.2;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const obstacle = new THREE.Mesh(geometry, material);
        obstacle.position.x = (Math.random() - 0.5) * 10;
        obstacle.position.y = 5;
        obstacle.userData = { speed: Math.random() * 0.02 + 0.01 };
        scene.add(obstacle);
        obstacles.push(obstacle);
    }

    const obstacleInterval = setInterval(createObstacle, 1000);



    // Функция анимации
    function animate() {
        //если moveLeft и другие в true, то обновляем позицию
        if (moveLeft) player.position.x -= 0.05;
        if (moveRight) player.position.x += 0.05;
        if(moveUp) player.position.y += 0.05;
        if(moveDown) player.position.y -= 0.05;

        // ограничения по осям X и Y, чтобы игрок не улетел за экран
        player.position.x = Math.max(-5, Math.min(5, player.position.x));
        player.position.y = Math.max(-3, Math.min(2, player.position.y));


        for (let i = obstacles.length -1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.position.y -= obstacle.userData.speed;

            // если столкнулись
            if (checkCollision(player, obstacle)) {
                moveLeft = false;
                gameMusic.pause();
                audioEndGame.play()
                endGame();
                return;
            }

            //если не столкнулись
            if (obstacle.position.y < -4) {
                scene.remove(obstacle);
                obstacles.splice(i, 1);
                score += 1;
                scorePlus.play();
                scoreElement.textContent = `Счет: ${score}`;
            }


        }

        // функция проверки столкновения
        function checkCollision(obj1, obj2) {
            const box1 = new THREE.Box3().setFromObject(obj1);
            const box2 = new THREE.Box3().setFromObject(obj2);
            return box1.intersectsBox(box2);
        }

        obstacles.forEach(obstacle => {
            switch(true) {
                case (score >= 0 && score < 10):
                    obstacle.userData.speed += 0.0001;
                    break;
                case (score >= 10 && score < 20):
                    obstacle.userData.speed += 0.0005;
                    break;
                case (score >= 20 && score < 30):
                    obstacle.userData.speed += 0.0015;
                    break;
                case (score >= 30 && score < 40):
                    obstacle.userData.speed += 0.0025;
                    break;
                case (score >= 40 && score < 50):
                    obstacle.userData.speed += 0.0035;
                    break;
                case (score >= 50 && score < 60):
                    obstacle.userData.speed += 0.0045;
                    break;
                case (score >= 60):
                    obstacle.userData.speed += 0.0055;
                    break;
                default: obstacle.userData.speed += 0.0055;
            }
        })

        //если геймомера не было, то вся анимация animate запускается
        if (!gameOver) {
            requestAnimationFrame(animate);
        }

        renderer.render(scene, camera);
    }



    // Функция, которая обрабатывает изменение окна, чтобы не адаптировать всё, а рендер автоматически всё высчитывал и подстраивал под размеры экрана
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight)
    })

    animate();
}




function endGame() {
    gameOver = true;
    totalScore.textContent = score;
    modalGameOver.classList.add('active');
}

btnStartOver.onclick = () => {
    location.reload();
}





