/**
 * Author: Fabrizio Giordano
 */
var norder = 3;
var nside = Math.pow(2, norder);
var healpix = new Healpix(nside);
var maxNPix = healpix.getNPix();
 
var mouseDown = false;
var lastMouseX, lastMouseY;
var zoom = 1;
var fovDiv = document.getElementById('fov');
var fov = 180/zoom;
canvasWidth = 600;
canvasHeight = 600;
var oldFov;
var oldcc;
var defaultMapURL = "http://skies.esac.esa.int/DSSColor/";
var currMapURL;


console.log("maxNPix: "+maxNPix);

var gl;
var canvas;

var pwgl = {
		"defaultMapId": 0,
		"ongoingImageLoads0" : [],
		"ongoingImageLoads1" : [],
		"loadedTextures" : [],
		"texturesArray0" : [],
		"texturesArray1" : [],
		"texturesArray" : [[]],
		"loadedSkiesIds": [],
		"requestId" : "",
		"projectionMatrix" : mat4.create(),
		"modelViewMatrix" : mat4.create(),
		"skyRotationMatrix": mat4.create(),
		"modelViewMatrixStack" : [],
		"vertexPositionBuffer" : "",
		"vertexTextureCoordinateBuffer" : "",
		"vertexIndexBuffer" : "",
		"VERTEX_POS_BUF_ITEM_SIZE" : 3,
		"VERTEX_POS_BUF_NUM_ITEMS" : 0,
		"VERTEX_TEX_COORD_BUF_ITEM_SIZE" : 2,
		"VERTEX_TEX_COORD_BUF_NUM_ITEMS" : 0,
		"VERTEX_INDEX_BUF_ITEM_SIZE" : 1,
		"VERTEX_INDEX_BUF_NUM_ITEMS" : 0,
		"vertexTextureAttributeLoc" : "",
		"vertexPositionAttributeLoc" : "",
		"uniformMVMatrixLoc": "",
		"uniformProjMatrixLoc": "",
		"uniformSampler0Loc": "",
		"uniformSampler1Loc": "",
		"uniformSampler2Loc": "",
		"uniformVertexTextureFactor0Loc" : "",
		"uniformVertexTextureFactor1Loc" : "",
		"uniformVertexTextureFactor2Loc" : ""
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



function draw(){
	var xyz = getCoordsCenter();
	currentcc = modelToRaDec(xyz);
	if (!fovInRange()){
		console.log("redraw");
		setupBuffers();
		setupTextures();
		oldFov = fov;
	}else if (mouseDown){
		addTextures();
    }

	
	pwgl.requestId = requestAnimationFrame(draw);
	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.ortho(-1-(-1+1/zoom), 1-(1-1/zoom), -1-(-1+1/zoom), 1-(1-1/zoom), -1, 1, pwgl.projectionMatrix);
	
	mat4.identity(pwgl.modelViewMatrix);

    mat4.multiply(pwgl.modelViewMatrix, pwgl.skyRotationMatrix);
	
	
	uploadModelViewMatrixToShader();
	uploadProjectionMatrixToShader();
//	gl.uniform1i(pwgl.uniformSamplerLoc, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexPositionBuffer);
    gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc,
    					pwgl.VERTEX_POS_BUF_ITEM_SIZE, 
                       	gl.FLOAT, false, 0, 0);
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexTextureCoordinateBuffer);
    gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc,
    					pwgl.VERTEX_TEX_COORD_BUF_ITEM_SIZE, 
                       	gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.vertexIndexBuffer);
    
    
    
    if (fov>=50){
//    	if (g_texUnit0 && g_texUnit1) {
			for(var j=0; j<pwgl.texturesArray.length;j++){
				gl.activeTexture(gl.TEXTURE0+j);
				gl.bindTexture(gl.TEXTURE_2D, pwgl.texturesArray[j][0]);
			}
//			gl.activeTexture(gl.TEXTURE0);
//			gl.bindTexture(gl.TEXTURE_2D, pwgl.texturesArray0[0]);
//			gl.activeTexture(gl.TEXTURE1);
//			gl.bindTexture(gl.TEXTURE_2D, pwgl.texturesArray1[0]);
        	for (var i=0;i<maxNPix;i++){
            	gl.drawElements(gl.TRIANGLES, 6, 
                        gl.UNSIGNED_SHORT, 12*i);
//             	gl.drawElements(gl.TRIANGLES, 12, 
//                         gl.UNSIGNED_SHORT, 24*i);
            }	
//    	}
    	
    		
    }else {
    	gl.activeTexture(gl.TEXTURE0);
    	
    	for (var i=0;i<maxNPix;i++){
    		gl.bindTexture(gl.TEXTURE_2D, pwgl.texturesArray0[i]);
        	gl.drawElements(gl.TRIANGLES, 6, 
                    gl.UNSIGNED_SHORT, 12*i);
//         	gl.drawElements(gl.TRIANGLES, 12, 
//                     gl.UNSIGNED_SHORT, 24*i);
        }	
    }
    
    
//     gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexTextureCoordinateBuffer);
//     for (var k=0;k<4;k++){
//     	gl.uniform4f(pwgl.uniformFragColorLoc, 1.0, 0.0, 0.0, 1.0);
//     	gl.vertexAttrib3f(pwgl.vertexPositionAttributeLoc, points[k][0], points[k][1], points[k][2]);
//     	gl.drawArrays(gl.POINTS,0,4);
//     }
    
}

function uploadModelViewMatrixToShader() {
	gl.uniformMatrix4fv(pwgl.uniformMVMatrixLoc, false, pwgl.modelViewMatrix);
}

function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(pwgl.uniformProjMatrixLoc, false, pwgl.projectionMatrix);
}

function setupBuffers(){
	
	pwgl.vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexPositionBuffer);
	var vertexPosition = new Float32Array(12*maxNPix);
// 	var vertexPosition = new Float32Array(15*maxNPix);
	var facesVec3Array;
	var p = [];
// 	var epsilon = 0.001;
	var epsilon = 0.0;
	for (var i=0; i < maxNPix; i++){
		facesVec3Array = new Array();
		facesVec3Array = healpix.getBoundaries(i);

		vertexPosition[12*i] = (facesVec3Array[0].x).toFixed(17) ;
		vertexPosition[12*i+1] = (facesVec3Array[0].y).toFixed(17) ;
		vertexPosition[12*i+2] = (facesVec3Array[0].z).toFixed(17) ;
		
		vertexPosition[12*i+3] = (facesVec3Array[1].x).toFixed(17) ;
		vertexPosition[12*i+4] = (facesVec3Array[1].y).toFixed(17) ;
		vertexPosition[12*i+5] = (facesVec3Array[1].z).toFixed(17) ;
		
		vertexPosition[12*i+6] = (facesVec3Array[2].x).toFixed(17) ;
		vertexPosition[12*i+7] = (facesVec3Array[2].y).toFixed(17) ;
		vertexPosition[12*i+8] = (facesVec3Array[2].z).toFixed(17) ;
		
		vertexPosition[12*i+9] = (facesVec3Array[3].x).toFixed(17) ;
		vertexPosition[12*i+10] = (facesVec3Array[3].y).toFixed(17) ;
		vertexPosition[12*i+11] = (facesVec3Array[3].z).toFixed(17) ;
		
// 		p.x = (facesVec3Array[0].x + facesVec3Array[2].x)/2 +epsilon;
// 		p.y = (facesVec3Array[0].y + facesVec3Array[2].y)/2 +epsilon;
// 		p.z = (facesVec3Array[0].z + facesVec3Array[2].z)/2 +epsilon;
		
// 		vertexPosition[15*i+12] = p.x;
// 		vertexPosition[15*i+13] = p.y;
// 		vertexPosition[15*i+14] = p.z;

	}
	gl.bufferData(gl.ARRAY_BUFFER, vertexPosition, gl.STATIC_DRAW);
	pwgl.VERTEX_POS_BUF_ITEM_SIZE = 3;
	pwgl.VERTEX_POS_BUF_NUM_ITEMS = vertexPosition.length; 
	
	
    pwgl.vertexTextureCoordinateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexTextureCoordinateBuffer);
    var textureCoordinates = new Float32Array(8*maxNPix);
//     var textureCoordinates = new Float32Array(10*maxNPix);
    if (fov>=50){
    	//0.037037037
    	var s_step=1/27;
    	//0.034482759
    	var t_step=1/29;
    	
    	var sindex = 0;
    	var tindex = 0;
    	for (var i=0; i < maxNPix; i++){
        	// [1, 0],[1, 1],[0, 1],[0, 0]
        	textureCoordinates[8*i] = (s_step + (s_step * sindex)).toFixed(9);
        	textureCoordinates[8*i+1] = (1 - (t_step + t_step * tindex)).toFixed(9);
        	textureCoordinates[8*i+2] = (s_step + (s_step * sindex)).toFixed(9);
        	textureCoordinates[8*i+3] = (1 - (t_step * tindex)).toFixed(9);
        	textureCoordinates[8*i+4] = (s_step * sindex).toFixed(9);
        	textureCoordinates[8*i+5] = (1 - (t_step * tindex)).toFixed(9);
        	textureCoordinates[8*i+6] = (s_step * sindex).toFixed(9);
        	textureCoordinates[8*i+7] = (1 - (t_step + t_step * tindex)).toFixed(9);
//         	textureCoordinates[10*i+8] = ((s_step/2) + s_step * sindex).toFixed(9);
//         	textureCoordinates[10*i+9] = (1 - (t_step/2) - t_step * tindex ).toFixed(9);
        	sindex++;
        	if(sindex == 27){
        		tindex++;
        		sindex=0;
        	}
        }
    }else{
    	for (var i=0; i < maxNPix; i++){
        	// [1, 0],[1, 1],[0, 1],[0, 0]
        	textureCoordinates[8*i] = 1.0;
        	textureCoordinates[8*i+1] = 0.0;
        	textureCoordinates[8*i+2] = 1.0;
        	textureCoordinates[8*i+3] = 1.0;
        	textureCoordinates[8*i+4] = 0.0;
        	textureCoordinates[8*i+5] = 1.0;
        	textureCoordinates[8*i+6] = 0.0;
        	textureCoordinates[8*i+7] = 0.0;
//         	textureCoordinates[10*i+8] = 0.5;
//         	textureCoordinates[10*i+9] = 0.5;
        }
    }
    
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
    pwgl.VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
    pwgl.VERTEX_TEX_COORD_BUF_NUM_ITEMS = textureCoordinates.length;
    
	
	pwgl.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.vertexIndexBuffer);
//     var vertexIndices = new Uint16Array(12*maxNPix);
    var vertexIndices = new Uint16Array(6*maxNPix);
    var baseFaceIndex = 0; 
    for (var j=0; j< maxNPix; j++){
    	
//     	vertexIndices[12*j] = baseFaceIndex + 4;
//     	vertexIndices[12*j+1] = baseFaceIndex;
//     	vertexIndices[12*j+2] = baseFaceIndex + 1;
    	
//     	vertexIndices[12*j+3] = baseFaceIndex + 4;
//     	vertexIndices[12*j+4] = baseFaceIndex + 1;
//     	vertexIndices[12*j+5] = baseFaceIndex + 2;
    	
//     	vertexIndices[12*j+6] = baseFaceIndex + 4;
//     	vertexIndices[12*j+7] = baseFaceIndex + 2;
//     	vertexIndices[12*j+8] = baseFaceIndex + 3;
    	
//     	vertexIndices[12*j+9] = baseFaceIndex + 4;
//     	vertexIndices[12*j+10] = baseFaceIndex + 3;
//     	vertexIndices[12*j+11] = baseFaceIndex;
    	
    	
    	vertexIndices[6*j] = baseFaceIndex;
    	vertexIndices[6*j+1] = baseFaceIndex + 1;
    	vertexIndices[6*j+2] = baseFaceIndex + 2;
    	
    	vertexIndices[6*j+3] = baseFaceIndex;
    	vertexIndices[6*j+4] = baseFaceIndex + 2;
    	vertexIndices[6*j+5] = baseFaceIndex + 3;
    		
//     	baseFaceIndex = baseFaceIndex+5;
    	baseFaceIndex = baseFaceIndex+4;
    	
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);
    pwgl.VERTEX_INDEX_BUF_ITEM_SIZE = 1;
    pwgl.VERTEX_INDEX_BUF_NUM_ITEMS = vertexIndices.length;

	
    console.log(textureCoordinates);
    console.log(vertexPosition);
    console.log(vertexIndices);
    
	
    console.log(textureCoordinates.length);
	console.log(vertexPosition.length);
	console.log(vertexIndices.length);
	
}


function changeSkyTransparency(skyidx, transpValue){
	console.log(pwgl.loadedSkiesIds);
	console.log("skyidx "+skyidx);
	var shaderIndex = pwgl.loadedSkiesIds.indexOf(parseInt(skyidx));
	
	if (shaderIndex == -1){
		console.log("not found "+shaderIndex);
		return;
	}
	
	
	console.log("indexOf "+shaderIndex);
	if (shaderIndex == 0){
		console.log("Factor Shader 0: "+transpValue/100);
		gl.uniform1f(pwgl.uniformVertexTextureFactor0Loc, transpValue/100);	
	}else if (shaderIndex == 1){
		console.log("Factor Shader 1: "+transpValue/100);
		gl.uniform1f(pwgl.uniformVertexTextureFactor1Loc, transpValue/100);
	}else if (shaderIndex == 2){
		console.log("Factor Shader 2: "+transpValue/100);
		gl.uniform1f(pwgl.uniformVertexTextureFactor2Loc, transpValue/100);
	}
	var currMap = getSkyDyIdx(skyidx);
	
}

function addSky(skyidx){
	console.log("skyidx "+skyidx);
	var shaderIndex = pwgl.loadedSkiesIds.indexOf(parseInt(skyidx));
	console.log("shaderIndex "+shaderIndex);
	if (shaderIndex !== -1){
		return;
	}
	
	var currMap = getSkyDyIdx(parseInt(skyidx));
	currMap.selected = true;
	pwgl.loadedSkiesIds[pwgl.loadedSkiesIds.length++] = currMap.index;
	
	if (pwgl.loadedSkiesIds.length == 1){
		console.log("Factor Shader 0: "+1.0);
		gl.uniform1f(pwgl.uniformVertexTextureFactor0Loc, 1.0);	
	}else if (pwgl.loadedSkiesIds.length == 2){
		console.log("Factor Shader 1: "+1.0);
		gl.uniform1f(pwgl.uniformVertexTextureFactor1Loc, 1.0);
	}else if (pwgl.loadedSkiesIds.length == 3){
		console.log("Factor Shader 2: "+1.0);
		gl.uniform1f(pwgl.uniformVertexTextureFactor2Loc, 1.0);
	}
	
	console.log("addSky "+pwgl.loadedTextures );
	setupTextures(true);
}

function setupTextures(forceReload){
	pwgl.texturesArray0 = [];
	pwgl.texturesArray1 = [];
	pwgl.texturesArray2 = [];
	pwgl.loadedTextures.splice(0, pwgl.loadedTextures.length);
//	pwgl.loadedTextures = [];
	console.log("setupTexture "+pwgl.loadedTextures );
	addTextures(forceReload);
}

function fovInRange(){
	if ( fov >= 50 && oldFov >= 50){
		return true;
	}
	if ( fov < 50 && oldFov < 50){
		return true;
	}
	return false;
}

function addTextures(forceReload){
	var currMap = currMapURL;

	
	console.log("begin of addTextures "+pwgl.loadedTextures );
	// fullZoom
	if (fov >=50){
	 	if (fovInRange() && !forceReload){
			return;
		}
		console.log("loading texture AllSky");
		
		for (var j=0; j<pwgl.loadedSkiesIds.length && j<8;j++){
			pwgl.texturesArray[j] = [];
			pwgl.texturesArray[j][0] = gl.createTexture();
			currMap = getSkyDyIdx(pwgl.loadedSkiesIds[j]);
			console.log(currMap);
			loadImageForTexture(currMap.URL+"/Norder3/Allsky.jpg", pwgl.texturesArray[j][0], j);
		}
		console.log(pwgl.texturesArray);
//		pwgl.texturesArray0[0] = gl.createTexture();
//		loadImageForTexture("http://skies.esac.esa.int/AllWISEColor/Norder3/Allsky.jpg", pwgl.texturesArray0[0], 0);
//		
//		pwgl.texturesArray1[0] = gl.createTexture();
//		loadImageForTexture(currMap+"/Norder3/Allsky.jpg", pwgl.texturesArray1[0], 1);
			
		pwgl.loadedTextures = [];
	}else if (mouseDown || !fovInRange() || forceReload){
		if (forceReload){
			pwgl.texturesArray0.splice(0, pwgl.texturesArray0.length);
		}
			
	
		console.log("loading single textures");
		var toBeLoadedTextures = [];
		var cc = getCoordsCenter();
		console.log("center coords in texture: "+cc);
		var ccPixNo = getPixNo(cc);;
		var index = 0;
		
		if (pwgl.loadedTextures.indexOf(ccPixNo) == -1){
			console.log("Adding ccpix: "+ccPixNo);
			toBeLoadedTextures[index] = ccPixNo;
			index++;
		}
		for (var i=-1; i<=1.1;i=i+0.25){
			for (var j=-1; j<=1;j=j+0.25){
				var xy = [i * 1/zoom,j * 1/zoom];
				var xyz = worldToModel(xy);
			    var rxyz = [];
			    rxyz[0] = pwgl.skyRotationMatrix[0] * xyz[0] + pwgl.skyRotationMatrix[1] * xyz[1] + pwgl.skyRotationMatrix[2] * xyz[2];
			    rxyz[1] = pwgl.skyRotationMatrix[4] * xyz[0] + pwgl.skyRotationMatrix[5] * xyz[1] + pwgl.skyRotationMatrix[6] * xyz[2];
			    rxyz[2] = pwgl.skyRotationMatrix[8] * xyz[0] + pwgl.skyRotationMatrix[9] * xyz[1] + pwgl.skyRotationMatrix[10] * xyz[2];
				
				
				var currPix = getPixNo(rxyz);
				if (pwgl.loadedTextures.indexOf(currPix) == -1){
					pwgl.loadedTextures[pwgl.loadedTextures.length] = currPix;
					toBeLoadedTextures[index] = currPix;
					index++;
				}
			}
		}
		for (var i=0; i<toBeLoadedTextures.length;i++){
			pwgl.texturesArray0[toBeLoadedTextures[i]] = gl.createTexture();
			loadImageForTexture(currMap+"/Norder3/Dir0/Npix"+toBeLoadedTextures[i]+".jpg", pwgl.texturesArray0[toBeLoadedTextures[i]]);
			
		}
	}
	console.log("end of addTextures: "+pwgl.loadedTextures);
	
}



function getPixNo(xyz){
	var p = new Pointing(new Vec3(xyz[0], xyz[1], xyz[2]));
	var pixNo = this.healpix.ang2pix(p);
	return pixNo;
}

function loadImageForTexture(url, texture, texunit){
	var image = new Image();
	image.onload = function(){
		if (texunit == 0){
			pwgl.ongoingImageLoads0.splice(pwgl.ongoingImageLoads0.indexOf(image), 1);	
		}else if (texunit == 1){
			pwgl.ongoingImageLoads1.splice(pwgl.ongoingImageLoads1.indexOf(image), 1);
		}
		textureFinishedLoading(image, texture, texunit);
	}
	if (texunit == 0){
		pwgl.ongoingImageLoads0.push(image);	
	}else if (texunit == 1){
		pwgl.ongoingImageLoads1.push(image);
	}
		
	
	image.crossOrigin = "anonymous";
	image.src=url;
	
//	if (texunit == 0){
//		image.style.filter       = "alpha(opacity=15)";
//		image.style.MozOpacity   = "0.15";
//		image.style.opacity      = "0.15";
//		image.style.KhtmlOpacity = "0.15";
//	}
}
//var g_texUnit0 = false, g_texUnit1 = false, g_texUnit2 = false;
function textureFinishedLoading(image, texture, texunit){	
	// !!! NEL DRAW C'E' IL  CONTROLLO SU g_texUnit0 E g_texUnit1
	console.log("activating TEX "+texunit);
	gl.activeTexture(gl.TEXTURE0+texunit);
//	if(texunit == 0){
//		console.log("activating TEX 0");
//    	gl.activeTexture(gl.TEXTURE0);
//    }else if (texunit == 1){
//    	console.log("activating TEX 1");
//    	gl.activeTexture(gl.TEXTURE1);
//    }else if (texunit == 1){
//    	console.log("activating TEX 2");
//    	gl.activeTexture(gl.TEXTURE2);
//    }
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	if (fov>=50){
		// it's not a power of 2. Turn of mips and set wrapping to clamp to edge
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	    
	}else{
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	}
	
	if(texunit == 0){
		gl.uniform1i(pwgl.uniformSampler0Loc, 0);
//    	g_texUnit0 = true;
    }else if(texunit == 1){
    	gl.uniform1i(pwgl.uniformSampler1Loc, 1);
//    	g_texUnit1 = true;
    }else if(texunit == 2){
    	gl.uniform1i(pwgl.uniformSampler2Loc, 2);
//    	g_texUnit1 = true;
    }
	if (!gl.isTexture(texture)){
    	console.log("error in texture");
    }
	gl.bindTexture(gl.TEXTURE_2D, null);
}

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
	  
	  pwgl.uniformVertexTextureFactor0Loc = gl.getUniformLocation(shaderProgram, "uFactor0");
	  pwgl.uniformVertexTextureFactor1Loc = gl.getUniformLocation(shaderProgram, "uFactor1");
	  pwgl.uniformVertexTextureFactor2Loc = gl.getUniformLocation(shaderProgram, "uFactor2");
	  
	  gl.uniform1f(pwgl.uniformVertexTextureFactor0Loc, 1.0);
	  gl.uniform1f(pwgl.uniformVertexTextureFactor1Loc, -99.0);
	  gl.uniform1f(pwgl.uniformVertexTextureFactor2Loc, -99.0);
	  
	  
	  
	  
	  
	  
//	  pwgl.uniformSamplerLoc = gl.getUniformLocation(shaderProgram, "uPMatrix");
//	  pwgl.uniformFragColorLoc = gl.getUniformLocation(shaderProgram, "u_FragColor");
	  
	  
	  gl.enableVertexAttribArray(pwgl.vertexPositionAttributeLoc);
	  gl.enableVertexAttribArray(pwgl.vertexTextureAttributeLoc);

	  pwgl.modelViewMatrix = mat4.create(); 
	  pwgl.projectionMatrix = mat4.create();
	  pwgl.modelViewMatrixStack = [];
}



function handleContextLost(event){
	event.preventDefault();
	cancelRequestAnimFrame(pwgl.requestId);
	
	// Ignore all ongoing image load by removing
	// their onload handler
	for (var i=0; i < pwgl.ongoingImageLoads0.length; i++){
		pwgl.ongoingImageLoads0[i] = undefined;
	}
	for (var i=0; i < pwgl.ongoingImageLoads1.length; i++){
		pwgl.ongoingImageLoads1[i] = undefined;
	}
	
	pwgl.ongoingImageLoads0 = [];
	pwgl.ongoingImageLoads1 = [];
}

function handleContextRestored(event){
	setupShaders(); 
	setupBuffers();
	setupTextures();
	gl.clearColor(0.5, 0.5, 0.5, 1);
// 	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	pwgl.requestId = requestAnimationFrame(draw, canvas);
}

function getCoordsCenter(){
	var vxy = [offset.left + canvas.width / 2, offset.top + canvas.height / 2];
	var rcc = convertXY2World(vxy[0],vxy[1]);
    return rcc; 
}



function degToRad(degrees) {
    return degrees * Math.PI / 180;
}



function onMouseWheel(ev){
	// WebKit
	if ( ev.wheelDeltaY ) {
		zoom -= ev.wheelDeltaY * 0.05;
	// Opera / Explorer 9
	} else if ( ev.wheelDelta ) {
		zoom -= ev.wheelDelta * 0.05;
	// Firefox
	} else if ( ev.detail ) {
		zoom += ev.detail * 0.03;
	}
	if (zoom<=1){
		zoom = 1;
	}
	oldFov = fov;
	fov = 180/zoom;
	fovDiv.innerHTML = "fov: "+fov+"<sup>&#8728;</sup>";
}

function handleMouseDown(event) {
	console.log("center coords:"+getCoordsCenter());
	
// 	console.log(getCoordsCenter());
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    var rxyz = convertXY2World(event.clientX, event.clientY);
    
    console.log("clicked coords:");
    console.log(rxyz);
    
//     console.log("HTML coords: "+event.clientX+" "+event.clientY);
//     var xy = viewToWorld(event.clientX, event.clientY);
//     console.log("World coords: "+xy);
//     var pixNo = getPixNo(xy[0], xy[1]);
	var pixNo = getPixNo(rxyz);
    console.log("pixNo clicked: "+pixNo);
}


function handleMouseUp(event) {
    mouseDown = false;
}

function onWindowResized(ev){
	console.log("Window resize");
	offset = (document.getElementById("myGLCanvas")).getBoundingClientRect();
	console.log(offset);
}

var offset;



function modelToRaDec(xyz){
	var ra, dec;
	ra = Math.atan2(xyz[1], xyz[0]);
	if (ra < 0){
		ra += 2*Math.PI;
	}
	if (ra >= 2*Math.PI){
		ra -= 2*Math.PI;
	}
	dec = Math.atan2(Math.sqrt(xyz[0]*xyz[0] + xyz[1]*xyz[1]), xyz[2]);

	return [ra* 180 / Math.PI, 90 - dec* (180 / Math.PI)];
}


function startup() {
	canvas = document.createElement('canvas');
	div = document.getElementById("container");
    canvas.id     = "myGLCanvas";
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.zIndex   = 8;
    canvas.style.position = "absolute";
    canvas.style.border   = "1px solid";
    
//    currMapURL = defaultMapURL;
//    currMapURL = getSkyDyIdx(pwgl.defaultMapId).URL;
    var defaultMap = getSkyDyIdx(pwgl.defaultMapId); 
    defaultMap.selected = true;
    defaultMap.shaderIdx = 0;
    
    
    
    pwgl.loadedSkiesIds[pwgl.loadedSkiesIds.length++] = pwgl.defaultMapId;
    
    div.appendChild(canvas)
    offset = (document.getElementById("myGLCanvas")).getBoundingClientRect();
	console.log(offset);
	canvas.addEventListener('webglcontextlost', handleContextLost, false);
	canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
	
	gl = createGLContext(canvas);
	setupShaders();
	setupBuffers();
	setupTextures();
	gl.clearColor(0.5,0.5,0.5, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	
    mat4.identity(pwgl.skyRotationMatrix);

	
    var coordsDiv = document.getElementById('coords');
    var coordsHMSDiv = document.getElementById('coordsHMS');
    fovDiv = document.getElementById('fov');
    fovDiv.innerHTML = "fov: "+fov+"<sup>&#8728;</sup>";
	
	canvas.onmousemove = function(ev) {   

		var rxyz = rotateViewXY(ev.clientX, ev.clientY);;
	    var radec = modelToRaDec(rxyz);
	    coordsDiv.innerHTML = "ra: "+radec[0]+" dec: "+radec[1];
	    var raHMS = convertRa2HMS(radec[0]);
	    var decDMS = convertDec2DMS(radec[1]);
	    coordsHMSDiv.innerHTML = raHMS[0]+" "+raHMS[1]+" "+raHMS[2]+" "+decDMS[0]+" "+decDMS[1]+" "+decDMS[2];
	    
// 	    if (mouseDown){
// 			addTextures();
// 	    }
	}
	
	var container = document.getElementById("container");
	container.addEventListener( 'mousewheel', onMouseWheel, false );
	container.addEventListener( 'DOMMouseScroll', onMouseWheel, false);
	window.addEventListener( 'resize', onWindowResized, false );
	canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    
	draw();
}

function convertXY2World(x,y){
	var vx = x; // x coordinate of a mouse pointer
    var vy = y; // y coordinate of a mouse pointer
    vxy = [vx, vy];
    
    var xy = viewToWorld(vxy[0], vxy[1]);
    xy[0] = xy[0] * 1/zoom;
	xy[1] = xy[1] * 1/zoom;
    
    var xyz = worldToModel(xy);
    var rxyz = [];
    rxyz[0] = pwgl.skyRotationMatrix[0] * xyz[0] + pwgl.skyRotationMatrix[1] * xyz[1] + pwgl.skyRotationMatrix[2] * xyz[2];
    rxyz[1] = pwgl.skyRotationMatrix[4] * xyz[0] + pwgl.skyRotationMatrix[5] * xyz[1] + pwgl.skyRotationMatrix[6] * xyz[2];
    rxyz[2] = pwgl.skyRotationMatrix[8] * xyz[0] + pwgl.skyRotationMatrix[9] * xyz[1] + pwgl.skyRotationMatrix[10] * xyz[2];
    return rxyz;
}

function rotateViewXY(x,y){
	var vx = x; // x coordinate of a mouse pointer
    var vy = y; // y coordinate of a mouse pointer
    vxy = [vx, vy];
    
    var xy = viewToWorld(vxy[0], vxy[1]);
    xy[0] = xy[0] * 1/zoom;
	xy[1] = xy[1] * 1/zoom;
    
    var xyz = worldToModel(xy);
    if (mouseDown) {
	    var deltaX = vx - lastMouseX
	    var newRotationMatrix = mat4.create();
	    mat4.identity(newRotationMatrix);
	    mat4.rotate(newRotationMatrix, degToRad(deltaX / 3), [0, 1, 0]);

	    var deltaY = vy - lastMouseY;
	    mat4.rotate(newRotationMatrix, degToRad(deltaY / 3), [1, 0, 0]);

	    mat4.multiply(newRotationMatrix, pwgl.skyRotationMatrix, pwgl.skyRotationMatrix);

	    lastMouseX = vx;
	    lastMouseY = vy;
    }
    var rxyz = [];
    rxyz[0] = pwgl.skyRotationMatrix[0] * xyz[0] + pwgl.skyRotationMatrix[1] * xyz[1] + pwgl.skyRotationMatrix[2] * xyz[2];
    rxyz[1] = pwgl.skyRotationMatrix[4] * xyz[0] + pwgl.skyRotationMatrix[5] * xyz[1] + pwgl.skyRotationMatrix[6] * xyz[2];
    rxyz[2] = pwgl.skyRotationMatrix[8] * xyz[0] + pwgl.skyRotationMatrix[9] * xyz[1] + pwgl.skyRotationMatrix[10] * xyz[2];
    return rxyz;
}

function viewToWorld(vx, vy){
	var x = ((vx - offset.left) - canvas.width/2)/(canvas.width/2);
    var y = (canvas.height/2 - (vy - offset.top))/(canvas.height/2);
    return [x, y];
}

function worldToModel(xy){
	var x = xy[0];
	var y = xy[1];
	var z = Math.sqrt(1 - xy[0]*xy[0] - xy[1]*xy[1]);
	
	return [x, y, z];
}

function convertDec2DMS(dec){
	var d = Math.floor(dec);
	var m = Math.floor((dec-d)*60);
	var s = (dec-d- m/60) * 3600;
	return [d, m ,s];
}

function convertRa2HMS(ra){
	var h = Math.floor(ra/15);
	var m = Math.floor((ra/15 - h)*60);
	var s = (ra/15 - h) *60;
	return [h,m,s];
}