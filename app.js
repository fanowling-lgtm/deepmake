const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const videoInput = document.getElementById("videoInput")

let renderer
let scene
let camera
let mesh
let material

let faceMesh

let clock = new THREE.Clock()

/* Load video */

videoInput.onchange = ()=>{

 const file = videoInput.files[0]
 video.src = URL.createObjectURL(file)

}

/* Setup Three.js */

function setupThree(w,h){

 renderer = new THREE.WebGLRenderer({canvas})
 renderer.setSize(w,h)

 scene = new THREE.Scene()

 camera =
  new THREE.OrthographicCamera(-1,1,1,-1,0.1,10)

 camera.position.z = 1

}

/* Create Face Geometry */

function createMesh(landmarks){

 const vertices=[]

 for(let p of landmarks){

  vertices.push(
   (p.x-0.5)*2,
   -(p.y-0.5)*2,
   p.z
  )

 }

 const geometry =
  new THREE.BufferGeometry()

 geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices,3)
 )

 material =
  new THREE.ShaderMaterial({

   vertexShader,
   fragmentShader,

   uniforms:{
    time:{value:0}
   }

  })

 mesh = new THREE.Points(
  geometry,
  material
 )

 scene.add(mesh)

}

/* Update Geometry from Face Tracking */

function updateGeometry(landmarks){

 const pos =
  mesh.geometry.attributes.position.array

 for(let i=0;i<landmarks.length;i++){

  let p = landmarks[i]

  pos[i*3] = (p.x-0.5)*2
  pos[i*3+1] = -(p.y-0.5)*2
  pos[i*3+2] = p.z

 }

 mesh.geometry.attributes.position.needsUpdate=true

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

/* Frame Processing */

async function processFrame(){

 if(video.paused || video.ended) return

 await faceMesh.send({image:video})

 requestAnimationFrame(processFrame)

}

/* Results Handler */

function onResults(results){

 if(results.multiFaceLandmarks){

  const landmarks =
   results.multiFaceLandmarks[0]

  if(!mesh){

   createMesh(landmarks)

  }

  updateGeometry(landmarks)

 }

 material.uniforms.time.value =
  clock.getElapsedTime()

 renderer.render(scene,camera)

}

/* Start */

document.getElementById("startBtn").onclick=()=>{

 video.onloadedmetadata=()=>{

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  setupThree(canvas.width,canvas.height)

  setupFaceMesh()

  video.play()

  processFrame()

 }

}
