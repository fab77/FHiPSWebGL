/**
 * 
 */
"use strict";
function handleContextLost(event){
	console.log("[handleContextLost]");
	event.preventDefault();
	cancelRequestAnimFrame(pwgl.requestId);
	
	// Ignore all ongoing image load by removing
	// their onload handler
//	for (var i=0; i < pwgl.ongoingImageLoads0.length; i++){
//		pwgl.ongoingImageLoads0[i] = undefined;
//	}
//	for (var i=0; i < pwgl.ongoingImageLoads1.length; i++){
//		pwgl.ongoingImageLoads1[i] = undefined;
//	}
//	
//	pwgl.ongoingImageLoads0 = [];
//	pwgl.ongoingImageLoads1 = [];
}

function handleContextRestored(event){
	console.log("[handleContextRestored]");
	setupShaders(); 
	setupBuffers();
	setupTextures();
	gl.clearColor(0.5, 0.5, 0.5, 1);
	gl.enable(gl.DEPTH_TEST);
	pwgl.requestId = requestAnimationFrame(draw, canvas);
}

function draw(){
	var xyz = getCoordsCenter();
	var currentcc = modelToRaDec(xyz);
	if (mouseDown && fovInRange()){
		addTextures();
    }
	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.ortho(-1-(-1+1/zoom), 1-(1-1/zoom), -1-(-1+1/zoom), 1-(1-1/zoom), -1, 1, pwgl.projectionMatrix);
	
	mat4.identity(pwgl.modelViewMatrix);

    mat4.multiply(pwgl.modelViewMatrix, pwgl.skyRotationMatrix);
	
	
	uploadModelViewMatrixToShader();
	uploadProjectionMatrixToShader();
	
	
	drawSkies();
	if (enableCatalogue){
		useCatalogueGLProgram();
		uploadModelViewMatrixToShader2();
		uploadProjectionMatrixToShader2();
		drawCatalogues();	
	}
	useHiPSGLProgram();
	pwgl.requestId = requestAnimationFrame(draw);
}


function drawCatalogues(){
		gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexCataloguePositionBuffer);
		gl.vertexAttribPointer(pwgl.vertexCatPositionAttributeLoc, 
				pwgl.VERTEX_POS_CAT_BUF_ITEM_SIZE, 
				gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(pwgl.vertexCatPositionAttributeLoc);
		gl.drawArrays(gl.POINTS, 0, pwgl.VERTEX_POS_CAT_BUF_NUM_ITEMS);
}

var max_iterations = 3;
var iterations = 0;
var debug = false;

function drawSkies(){
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexPositionBuffer);
    gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc,
			pwgl.VERTEX_POS_BUF_ITEM_SIZE, 
           	gl.FLOAT, false, 0, 0);
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexTextureCoordinateBuffer);
    gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc,
    					pwgl.VERTEX_TEX_COORD_BUF_ITEM_SIZE, 
                       	gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.vertexIndexBuffer);
    
    gl.enableVertexAttribArray(pwgl.vertexPositionAttributeLoc);
    gl.enableVertexAttribArray(pwgl.vertexTextureAttributeLoc);
    
    var sky;
    if (fov>=50){
    	
	 	for (var j=0; j<pwgl.selectedSkies.length && j<8;j++){
	 		sky = pwgl.selectedSkies[j];
	 		
	 		if (iterations < max_iterations && debug){
	 			console.log(sky);
	 			iterations += 1;
	 		}
	 		
	 		gl.activeTexture(gl.TEXTURE0+j);
			gl.bindTexture(gl.TEXTURE_2D, sky.textures.images[0]);
			gl.uniform1f(pwgl.uniformVertexTextureFactorLoc[j], sky.textures.opacity);
	 	}

	 	for (var i=pwgl.selectedSkies.length; i<8; i++){
	 		gl.uniform1f(pwgl.uniformVertexTextureFactorLoc[i], -99);	
	 	}
	 	
//    	for (var i=0;i<maxNPix;i++){
	 	for (var i=0;i<pwgl.pixels.length;i++){
        	gl.drawElements(gl.TRIANGLES, 6, 
                    gl.UNSIGNED_SHORT, 12*i);
//       	gl.drawElements(gl.TRIANGLES, 12, 
//                         gl.UNSIGNED_SHORT, 24*i);
        }
    }else {

//    	for (var i=0;i<maxNPix;i++){
    	for (var i=0;i<pwgl.pixels.length;i++){
			for(var j=0; j<pwgl.selectedSkies.length && j<8;j++){
				sky = pwgl.selectedSkies[j];
				gl.activeTexture(gl.TEXTURE0+j);
	    		gl.bindTexture(gl.TEXTURE_2D, sky.textures.images[i]);
	    		gl.uniform1f(pwgl.uniformVertexTextureFactorLoc[j], sky.textures.opacity);
	        }
			for (var k=pwgl.selectedSkies.length;k<8;k++){
				gl.uniform1f(pwgl.uniformVertexTextureFactorLoc[k], -99);
	    	}
			gl.drawElements(gl.TRIANGLES, 6, 
                    gl.UNSIGNED_SHORT, 12*i);
//         	gl.drawElements(gl.TRIANGLES, 12, 
//            gl.UNSIGNED_SHORT, 24*i);
		}
    }
}


function uploadModelViewMatrixToShader() {
	gl.uniformMatrix4fv(pwgl.uniformMVMatrixLoc, false, pwgl.modelViewMatrix);
}

function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(pwgl.uniformProjMatrixLoc, false, pwgl.projectionMatrix);
}

function uploadModelViewMatrixToShader2() {
	gl.uniformMatrix4fv(pwgl.catUniformMVMatrixLoc, false, pwgl.modelViewMatrix);
}

function uploadProjectionMatrixToShader2() {
	gl.uniformMatrix4fv(pwgl.catUniformProjMatrixLoc, false, pwgl.projectionMatrix);
}

function initWebGL(canvas) {
    gl = null;
    
    try {
        // Try to grab the standard context. If it fails, fallback to experimental.
	    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }catch(e) {}
    
    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        gl = null;
    }
    
    return gl;
}

function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i=0; i < names.length; i++) {
        try {
    		context = canvas.getContext(names[i]);
        } catch(e) {}
        if (context) {
      		break;
        }
    }
    if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
    } else {
    	alert("Failed to create WebGL context!");
    }
    return context;
}