/**
 * 
 */
function setupShaders() {
	  var vertexShader = loadShaderFromDOM("shader-vs");
	  var fragmentShader = loadShaderFromDOM("shader-fs");
	  
	  var shaderProgram = gl.createProgram();
	  gl.attachShader(shaderProgram, vertexShader);
	  gl.attachShader(shaderProgram, fragmentShader);
	  gl.linkProgram(shaderProgram);

	  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
	    alert("Failed to setup shaders");
	  }
	  gl.useProgram(shaderProgram);
	  pwgl.vertexPositionAttributeLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); 
	  pwgl.vertexTextureAttributeLoc = gl.getAttribLocation(shaderProgram, "aTextureCoordinates");
	  pwgl.uniformMVMatrixLoc = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	  pwgl.uniformProjMatrixLoc = gl.getUniformLocation(shaderProgram, "uPMatrix");
	  pwgl.uniformSampler0Loc = gl.getUniformLocation(shaderProgram, "uSampler0");
	  pwgl.uniformSampler1Loc = gl.getUniformLocation(shaderProgram, "uSampler1");
	  pwgl.uniformSampler2Loc = gl.getUniformLocation(shaderProgram, "uSampler2");
	  
	  for (var i=0; i<4; i++){
		  pwgl.uniformVertexTextureFactorLoc[i] = gl.getUniformLocation(shaderProgram, "uFactor"+i);
		  if (i == 0){
			  gl.uniform1f(pwgl.uniformVertexTextureFactorLoc[0], 1.0);
		  }else{
			  gl.uniform1f(pwgl.uniformVertexTextureFactorLoc[i], -99.0);
		  }
	  }

//	  pwgl.uniformVertexTextureFactor0Loc = gl.getUniformLocation(shaderProgram, "uFactor0");
//	  pwgl.uniformVertexTextureFactor1Loc = gl.getUniformLocation(shaderProgram, "uFactor1");
//	  pwgl.uniformVertexTextureFactor2Loc = gl.getUniformLocation(shaderProgram, "uFactor2");
//	  
//	  gl.uniform1f(pwgl.uniformVertexTextureFactor0Loc, 1.0);
//	  gl.uniform1f(pwgl.uniformVertexTextureFactor1Loc, -99.0);
//	  gl.uniform1f(pwgl.uniformVertexTextureFactor2Loc, -99.0);
	  
	  gl.enableVertexAttribArray(pwgl.vertexPositionAttributeLoc);
	  gl.enableVertexAttribArray(pwgl.vertexTextureAttributeLoc);

	  pwgl.modelViewMatrix = mat4.create(); 
	  pwgl.projectionMatrix = mat4.create();
	  pwgl.modelViewMatrixStack = [];
}


function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
    
    // If we don't find an element with the specified id
    // we do an early exit 
    if (!shaderScript) {
    	return null;
    }
    
    // Loop through the children for the found DOM element and
    // build up the shader source code as a string
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      		shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
    	shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
    	shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
    	return null;
    }
    
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    	alert(gl.getShaderInfoLog(shader));
    	return null;
    } 
    return shader;
}