let model;

async function loadModel(){

  model = await tf.loadGraphModel(
    "model/faceswap_model.json"
  )

}

loadModel()
