let model
let sourceFaceCanvas

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const video = document.getElementById("video")

let mediaRecorder
let recordedChunks = []

async function loadModel(){

 model = await tf.loadGraphModel(
   "model/faceswap_model.json"
 )

}

loadModel()

async function loadImage(file){

 return new Promise(resolve=>{

  const img = new Image()
  img.src = URL.createObjectURL(file)

  img.onload=()=>resolve(img)

 })

}

function cropFace(img){

 const c = document.createElement("canvas")
 const cx = c.getContext("2d")

 c.width = 128
 c.height = 128

 cx.drawImage(img,0,0,128,128)

 return c

}

async function runModel(faceCanvas){

 const tensor = tf.browser.fromPixels(faceCanvas)
   .resizeBilinear([128,128])
   .toFloat()
   .div(255)
   .expandDims(0)

 const output = await model.executeAsync(tensor)

 return output.squeeze()
}

function tensorToCanvas(tensor){

 const data = tensor.mul(255).dataSync()

 const c = document.createElement("canvas")
 c.width = 128
 c.height = 128

 const cx = c.getContext("2d")

 const imageData = cx.createImageData(128,128)

 for(let i=0;i<data.length;i++){
  imageData.data[i]=data[i]
 }

 cx.putImageData(imageData,0,0)

 return c
}

function watermark(){

 ctx.fillStyle="white"
 ctx.font="20px Arial"

 ctx.fillText(
  "SYNTHETIC VIDEO",
  10,
  30
 )
}

async function processFrame(){

 ctx.drawImage(video,0,0,canvas.width,canvas.height)

 const swappedTensor = await runModel(sourceFaceCanvas)

 const swappedCanvas = tensorToCanvas(swappedTensor)

 ctx.drawImage(
  swappedCanvas,
  canvas.width/2-64,
  canvas.height/2-64,
 128,
 128
 )

 watermark()

 if(!video.paused && !video.ended){

  requestAnimationFrame(processFrame)

 }

}

async function startProcessing(){

 const sourceFile =
  document.getElementById("sourceImage").files[0]

 const videoFile =
  document.getElementById("targetVideo").files[0]

 const sourceImg = await loadImage(sourceFile)

 sourceFaceCanvas = cropFace(sourceImg)

 video.src = URL.createObjectURL(videoFile)

 video.onloadedmetadata=()=>{

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const stream = canvas.captureStream(30)

  mediaRecorder =
   new MediaRecorder(stream)

  mediaRecorder.ondataavailable=e=>{
   recordedChunks.push(e.data)
  }

  mediaRecorder.start()

  video.play()

  processFrame()

 }

 video.onended=()=>{

  mediaRecorder.stop()

 }

}

function downloadVideo(){

 const blob =
  new Blob(recordedChunks,{
   type:"video/webm"
  })

 const url = URL.createObjectURL(blob)

 const a = document.createElement("a")

 a.href = url
 a.download = "synthetic_video.webm"

 a.click()

}
