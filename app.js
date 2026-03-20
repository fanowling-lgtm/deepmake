const video = document.getElementById("video")
const canvas = document.getElementById("canvas")

let renderer
let scene
let camera
let mesh
let material

let faceMesh

let photoTexture

/* Webcam */

navigator.mediaDevices
.getUserMedia({video:true})
.then(stream => {

 video.srcObject = stream

})

/* Load Photo */

document
.getElementById("photoInput")
.onchange = e => {

 const file = e.target.files[0]

 const img = new Image()
 img.src = URL.createObjectURL(file)

 img.onload = () => {

  createPhotoTexture(img)

 }

}

/* Create texture */

function createPhotoTexture(img){

 const texture = new THREE.Texture(img)
 texture.needsUpdate = true

 photoTexture = texture

}

/* Three.js */

function setupThree(w,h){

 renderer = new THREE.WebGLRenderer({canvas})
 renderer.setSize(w,h)

 scene = new THREE.Scene()

 camera =
  new THREE.OrthographicCamera(-1,1,1,-1,0.1,10)

 camera.position.z = 1

}

/* Create face mesh */

function createMesh(landmarks){

 const vertices=[]
 const uvs=[]

 for(let p of landmarks){

  vertices.push(
   (p.x-0.5)*2,
   -(p.y-0.5)*2,
   0
  )

  uvs.push(p.x,1-p.y)

 }

 const geometry =
  new THREE.BufferGeometry()

 geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices,3)
 )

 geometry.setAttribute(
  "uv",
  new THREE.Float32BufferAttribute(uvs,2)
 )

 material =
  new THREE.MeshBasicMaterial({
   map:photoTexture
  })

 mesh =
  new THREE.Points(geometry,material)

 scene.add(mesh)

}

/* Update animation */

function updateMesh(landmarks){

 const pos =
  mesh.geometry.attributes.position.array

 for(let i=0;i<landmarks.length;i++){

  const p = landmarks[i]

  pos[i*3] = (p.x-0.5)*2
  pos[i*3+1] = -(p.y-0.5)*2

 }

 mesh.geometry.attributes.position.needsUpdate = true

}

/* FaceMesh */

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

/* Frame loop */

async function processFrame(){

 await faceMesh.send({image:video})

 requestAnimationFrame(processFrame)

}

/* Results */

function onResults(results){

 if(results.multiFaceLandmarks){

  const landmarks =
   results.multiFaceLandmarks[0]

  if(!mesh && photoTexture){

   createMesh(landmarks)

  }

  if(mesh){

   updateMesh(landmarks)

  }

 }

 renderer.render(scene,camera)

}

/* Start */

video.onloadedmetadata = () => {

 canvas.width = video.videoWidth
 canvas.height = video.videoHeight

 setupThree(canvas.width,canvas.height)

 setupFaceMesh()

 processFrame()

}
