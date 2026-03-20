const vertexShader = `

uniform float time;

void main(){

 vec3 pos = position;

 float wave = sin(time + pos.y * 10.0) * 0.05;

 pos.x += wave;

 pos.y += sin(time*0.5) * 0.02;

 gl_Position =
  projectionMatrix *
  modelViewMatrix *
  vec4(pos,1.0);

}
`

const fragmentShader = `

void main(){

 gl_FragColor =
  vec4(1.0,1.0,1.0,1.0);

}
`
