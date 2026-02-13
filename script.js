import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

let sanity = 100;
let ghost;
let ghostMesh;
let huntActive = false;

let evidence = {
    emf5: false,
    freezing: false,
    spiritBox: false
};

const ghostTypes = [
    { name: "Spirit", emf5: true, freezing: false, spiritBox: true },
    { name: "Wraith", emf5: true, freezing: true, spiritBox: false },
    { name: "Phantom", emf5: false, freezing: true, spiritBox: true }
];

init();
animate();

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 80);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Pointer Lock Controls
    controls = new PointerLockControls(camera, document.body);
    document.body.addEventListener("click", () => controls.lock());
    scene.add(controls.getObject());

    // Proper spawn position
    controls.getObject().position.set(0, 2, 5);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040);
    scene.add(ambient);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 0);
    light.castShadow = true;
    scene.add(light);

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    createHouse();
    createGhost();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    document.getElementById("guessBtn").addEventListener("click", checkGuess);

    window.addEventListener("resize", onWindowResize);

    setInterval(updateGame, 1000);
}

function createHouse() {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

    const roomPositions = [
        { x: 0, z: 0 },
        { x: 20, z: 0 },
        { x: -20, z: 0 }
    ];

    roomPositions.forEach(pos => {
        const walls = [
            new THREE.Mesh(new THREE.BoxGeometry(20, 8, 1), wallMaterial),
            new THREE.Mesh(new THREE.BoxGeometry(20, 8, 1), wallMaterial),
            new THREE.Mesh(new THREE.BoxGeometry(1, 8, 20), wallMaterial),
            new THREE.Mesh(new THREE.BoxGeometry(1, 8, 20), wallMaterial)
        ];

        walls[0].position.set(pos.x, 4, pos.z - 10);
        walls[1].position.set(pos.x, 4, pos.z + 10);
        walls[2].position.set(pos.x - 10, 4, pos.z);
        walls[3].position.set(pos.x + 10, 4, pos.z);

        walls.forEach(w => {
            w.castShadow = true;
            scene.add(w);
        });
    });
}

function createGhost() {
    ghost = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];

    ghostMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        })
    );

    ghostMesh.position.set(0, 2, 0);
    scene.add(ghostMesh);
}

function updateGame() {
    sanity -= 0.5;
    document.getElementById("sanity").innerText =
        "Sanity: " + Math.floor(sanity) + "%";

    if (sanity <= 50 && Math.random() < 0.3) triggerEvent();
    if (sanity <= 20 && !huntActive) startHunt();

    if (sanity <= 0) gameOver("You lost your mind...");
}

function triggerEvent() {
    ghostMesh.material.opacity = 0.8;
    setTimeout(() => (ghostMesh.material.opacity = 0.3), 1000);

    if (ghost.emf5) {
        evidence.emf5 = true;
        document.getElementById("emfEvidence").innerText = "EMF 5: ✅";
    }
}

function startHunt() {
    huntActive = true;
    ghostMesh.material.opacity = 1;

    const huntInterval = setInterval(() => {
        const playerPos = controls.getObject().position;
        ghostMesh.position.lerp(playerPos, 0.05);

        if (ghostMesh.position.distanceTo(playerPos) < 2) {
            clearInterval(huntInterval);
            gameOver("The ghost caught you...");
        }
    }, 50);
}

function checkGuess() {
    const guess = document.getElementById("ghostSelect").value;

    if (guess === ghost.name) {
        alert("Correct! You survived!");
        location.reload();
    } else {
        gameOver("Wrong ghost...");
    }
}

function gameOver(message) {
    alert(message);
    location.reload();
}

function onKeyDown(event) {
    switch (event.code) {
        case "KeyW": moveForward = true; break;
        case "KeyS": moveBackward = true; break;
        case "KeyA": moveLeft = true; break;
        case "KeyD": moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case "KeyW": moveForward = false; break;
        case "KeyS": moveBackward = false; break;
        case "KeyA": moveLeft = false; break;
        case "KeyD": moveRight = false; break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 0.1;
        if (moveLeft || moveRight) velocity.x -= direction.x * 0.1;

        controls.moveRight(-velocity.x);
        controls.moveForward(-velocity.z);

        velocity.x *= 0.9;
        velocity.z *= 0.9;
    }

    renderer.render(scene, camera);
}
