/**
 * Author: Fabrizio Giordano
 */
var norder = 3;
var nside = Math.pow(2, norder);
var healpix = new Healpix(nside);
var maxNPix = healpix.getNPix();
var skyRotationMatrix = mat4.create();
var mouseDown = false;
var lastMouseX, lastMouseY;
var zoom = 1;
var fovDiv = document.getElementById('fov');
var fov = 180/zoom;
canvasWidth = 600;
canvasHeight = 600;
var oldFov;
var oldcc;
var defaultMapURL = "http://alasky.u-strasbg.fr/MellingerRGB/";
var currMapURL;


console.log("maxNPix: "+maxNPix);

var gl;
var canvas;

var pwgl = {};
pwgl.ongoingImageLoads = [];
pwgl.loadedTextures = [];

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

    mat4.multiply(pwgl.modelViewMatrix, skyRotationMatrix);
	
	
	uploadModelViewMatrixToShader();
	uploadProjectionMatrixToShader();
	gl.uniform1i(pwgl.uniformSamplerLoc, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexPositionBuffer);
    gl.vertexAttribPointer(pwgl.vertexPositionAttributeLoc,
    					pwgl.VERTEX_POS_BUF_ITEM_SIZE, 
                       	gl.FLOAT, false, 0, 0);
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexTextureCoordinateBuffer);
    gl.vertexAttribPointer(pwgl.vertexTextureAttributeLoc,
    					pwgl.VERTEX_TEX_COORD_BUF_ITEM_SIZE, 
                       	gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.vertexIndexBuffer);
    
    gl.activeTexture(gl.TEXTURE0);
    
    if (fov>=50){
    	gl.bindTexture(gl.TEXTURE_2D, pwgl.texturesArray[0]);
    	for (var i=0;i<maxNPix;i++){
        	gl.drawElements(gl.TRIANGLES, 6, 
                    gl.UNSIGNED_SHORT, 12*i);
//         	gl.drawElements(gl.TRIANGLES, 12, 
//                     gl.UNSIGNED_SHORT, 24*i);
        }	
    }else {
    	for (var i=0;i<maxNPix;i++){
        	gl.bindTexture(gl.TEXTURE_2D, pwgl.texturesArray[i]);
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

function changeSkyURL(skyURL){
	currMapURL = skyURL;
	console.log("changeSkyURL "+pwgl.loadedTextures );
	setupTextures(true);
}

function setupTextures(forceReload){
	pwgl.texturesArray = [];
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
		pwgl.texturesArray[0] = gl.createTexture();
		loadImageForTexture(currMap+"/Norder3/Allsky.jpg", pwgl.texturesArray[0]);
		pwgl.loadedTextures = [];
	}else if (mouseDown || !fovInRange() || forceReload){
		if (forceReload){
			pwgl.texturesArray.splice(0, pwgl.texturesArray.length);
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
			    rxyz[0] = skyRotationMatrix[0] * xyz[0] + skyRotationMatrix[1] * xyz[1] + skyRotationMatrix[2] * xyz[2];
			    rxyz[1] = skyRotationMatrix[4] * xyz[0] + skyRotationMatrix[5] * xyz[1] + skyRotationMatrix[6] * xyz[2];
			    rxyz[2] = skyRotationMatrix[8] * xyz[0] + skyRotationMatrix[9] * xyz[1] + skyRotationMatrix[10] * xyz[2];
				
				
				var currPix = getPixNo(rxyz);
				if (pwgl.loadedTextures.indexOf(currPix) == -1){
					pwgl.loadedTextures[pwgl.loadedTextures.length] = currPix;
					toBeLoadedTextures[index] = currPix;
					index++;
				}
			}
		}
		for (var i=0; i<toBeLoadedTextures.length;i++){
			pwgl.texturesArray[toBeLoadedTextures[i]] = gl.createTexture();
			loadImageForTexture(currMap+"/Norder3/Dir0/Npix"+toBeLoadedTextures[i]+".jpg", pwgl.texturesArray[toBeLoadedTextures[i]]);
			
		}
	}
	console.log("end of addTextures: "+pwgl.loadedTextures);
	
}



function getPixNo(xyz){
	var p = new Pointing(new Vec3(xyz[0], xyz[1], xyz[2]));
	var pixNo = this.healpix.ang2pix(p);
	return pixNo;
}

function loadImageForTexture(url, texture){
	var image = new Image();
	image.onload = function(){
		pwgl.ongoingImageLoads.splice(pwgl.ongoingImageLoads.indexOf(image), 1);
		textureFinishedLoading(image, texture);
	}
	pwgl.ongoingImageLoads.push(image);
	image.crossOrigin = "anonymous";
	image.src=url;
}

function textureFinishedLoading(image, texture){
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
	  pwgl.uniformSamplerLoc = gl.getUniformLocation(shaderProgram, "uPMatrix");
	  pwgl.uniformFragColorLoc = gl.getUniformLocation(shaderProgram, "u_FragColor");
	  
	  
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
	for (var i=0; i < pwgl.ongoingImageLoads.length; i++){
		pwgl.ongoingImageLoads[i] = undefined;
	}
	pwgl.ongoingImageLoads = [];
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
    
    currMapURL = defaultMapURL;
    
    
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
	
	
    mat4.identity(skyRotationMatrix);

	
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
    rxyz[0] = skyRotationMatrix[0] * xyz[0] + skyRotationMatrix[1] * xyz[1] + skyRotationMatrix[2] * xyz[2];
    rxyz[1] = skyRotationMatrix[4] * xyz[0] + skyRotationMatrix[5] * xyz[1] + skyRotationMatrix[6] * xyz[2];
    rxyz[2] = skyRotationMatrix[8] * xyz[0] + skyRotationMatrix[9] * xyz[1] + skyRotationMatrix[10] * xyz[2];
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

	    mat4.multiply(newRotationMatrix, skyRotationMatrix, skyRotationMatrix);

	    lastMouseX = vx;
	    lastMouseY = vy;
    }
    var rxyz = [];
    rxyz[0] = skyRotationMatrix[0] * xyz[0] + skyRotationMatrix[1] * xyz[1] + skyRotationMatrix[2] * xyz[2];
    rxyz[1] = skyRotationMatrix[4] * xyz[0] + skyRotationMatrix[5] * xyz[1] + skyRotationMatrix[6] * xyz[2];
    rxyz[2] = skyRotationMatrix[8] * xyz[0] + skyRotationMatrix[9] * xyz[1] + skyRotationMatrix[10] * xyz[2];
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