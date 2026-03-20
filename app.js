const video = document.getElementById("video")
const canvas = document.getElementById("outputCanvas")
const ctx = canvas.getContext("2d")

const videoInput = document.getElementById("videoInput")
const startBtn = document.getElementById("startBtn")
const downloadBtn = document.getElementById("downloadBtn")

let faceMesh
let renderer
let scene
let camera
let mesh

let recorder
let chunks=[]

/* Load Video */

videoInput.onchange = () => {

 const file = videoInput.files[0]
 video.src = URL.createObjectURL(file)

}

/* Setup Three.js */

function setupThree(width,height){

 renderer = new THREE.WebGLRenderer({canvas:canvas})
 renderer.setSize(width,height)

 scene = new THREE.Scene()

 camera = new THREE.OrthographicCamera(
  -1,1,1,-1,0.1,10
 )

 camera.position.z = 1

}

/* Build Mesh */

function createMesh(landmarks){

 const vertices=[]

 for(let p of landmarks){

  vertices.push(
   (p.x-0.5)*2,
   -(p.y-0.5)*2,
   p.z
  )

 }

 const geometry = new THREE.BufferGeometry()

 geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices,3)
 )

 const material = new THREE.PointsMaterial({
  color:0xffffff,
  size:0.01
 })

 mesh = new THREE.Points(geometry,material)

 scene.add(mesh)

}

/* Warp Face Geometry */

function warpGeometry(landmarks){

 const positions = mesh.geometry.attributes.position.array

 for(let i=0;i<landmarks.length;i++){

  let p = landmarks[i]

  let x = (p.x-0.5)*2
  let y = -(p.y-0.5)*2

  /* Example warp: stretch lower face */

  if(p.y > 0.65){

   x *= 1.2
   y *= 1.1

  }

  positions[i*3] = x
  positions[i*3+1] = y
  positions[i*3+2] = p.z

 }

 mesh.geometry.attributes.position.needsUpdate=true

}

/* Watermark */

function drawWatermark(){

 ctx.fillStyle="white"
 ctx.font="20px Arial"

 ctx.fillText(
  "SYNTHETIC VFX",
  10,
  30
 )

}

/* FaceMesh Setup */

function setupFaceMesh(){

 faceMesh = new FaceMesh({
  locateFile:(file)=>
   `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
 })

 faceMesh.setOptions({

  maxNumFaces:1,
  refineLandmarks:true,
  minDetectionConfidence:0.5,
  minTrackingConfidence:0.5

 })

 faceMesh.onResults(onResults)

}

/* Process Each Frame */

async function processFrame(){

 if(video.paused || video.ended) return

 await faceMesh.send({image:video})

 requestAnimationFrame(processFrame)

}

/* FaceMesh Results */

function onResults(results){

 ctx.drawImage(video,0,0,canvas.width,canvas.height)

 if(results.multiFaceLandmarks){

  const landmarks = results.multiFaceLandmarks[0]

  if(!mesh){

   createMesh(landmarks)

  }

  warpGeometry(landmarks)

  renderer.render(scene,camera)

 }

 drawWatermark()

}

/* Start Processing */

startBtn.onclick = () => {

 video.onloadedmetadata = () => {

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  setupThree(canvas.width,canvas.height)

  setupFaceMesh()

  const stream = canvas.captureStream(30)

  recorder = new MediaRecorder(stream)

  recorder.ondataavailable=e=>{
   chunks.push(e.data)
  }

  recorder.start()

  video.play()

  processFrame()

 }

}

/* Download Video */

downloadBtn.onclick = () => {

 recorder.stop()

 const blob = new Blob(chunks,{
  type:"video/webm"
 })

 const url = URL.createObjectURL(blob)

 const a = document.createElement("a")

 a.href = url
 a.download = "face_vfx_output.webm"

 a.click()

}
