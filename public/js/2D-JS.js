var canvas;
var gl; 
var squareVerticesBufffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var perspectiveMatrix;

function initWebGL(canvas) {
  gl = null;

  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }
  
  // If we don't have a GL context, bail out now
  if (!gl) {
    alert('Unable to initialize WebGL. You need a better browser or a better webGL coder.');
  }
  return gl;
}

function initShaders() {
  var fragmentShader = getShader(gl, 'shader-fs');
  var vertexShader   = getShader(gl, 'shader-vs');

  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttribute);
}

function getShader(gl, id) {

  var shaderScript = document.getElementById(id);

  // Abort if you cant find the element with the specified ID
  if (!shaderScript) {
    return null;
  }

  // Walk through the source elements children, building
  // the shader source string.
  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script
  // we have, bases on its MIME type
  var shader;

  if (shaderScript.type == 'x-shader/x-fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == 'x-shader/x-vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, theSource);

  // Compile the shader program
  gl.compileShader(shader);

  // Check if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initBuffers() {
  // Create a buffer for the square's verices.
  squareVerticesBuffer = gl.createBuffer();

  // Select the squareVerticesBuffer as the one to appy vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

    // Now create an array of vertices for the square. Note that the
    // Z coordinate is always 0 here.
  var vertices = [
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];

    // Now pass the list of vertices into webGL to build the shape.
    // We do this by creating a Float32Array from the JS array,
    // then use it to fill the current vertex buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function drawScene() {
  // Clear the canvas before drawing on it
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Establish the perspective (camera) with which we want to view the
    // scene. Our FOV is 45 degrees, with a width/height ratio
    // of 640:480, and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
  perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  loadIdentitiy();

  // Set the drawing position a bit to where we want to start
  // drawing the square.
  mvTranslate([-0.0, 0.0, -6.0]);

  // Draw the square by binding the array buffer to the square's 
  // vertices array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function loadIdentitiy() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

function start() {
  canvas = document.getElementById('glCanvas');

  // Initialize the GL context 
  initWebGL(canvas);

  // Only continue if WebGL is available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Set clear color  to black and fully opaque
    
    gl.clearDepth(1.0);                 // clear everything
    
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear the color and depth buffers

    // Initialize the shaders; this is where all of the 
    // lighting for the vertices and so forth is established.
    initShaders();

    // Call function to build all objects we'll be drawing
    initBuffers();

    // Set up to draw the scene periodically
    setInterval(drawScene, 15);
  }
}