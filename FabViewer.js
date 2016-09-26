/**
 * Author: Fabrizio Giordano
 */

"use strict";
var norder = 3;
var nside = Math.pow(2, norder);
var healpix = new Healpix(nside);
var maxNPix = healpix.getNPix();
 
var mouseDown = false;
var lastMouseX, lastMouseY;
var zoom = 1;
var fovDiv = document.getElementById('fov');
var fov = 180/zoom;
var oldFov = fov;
var canvasWidth = 600;
var canvasHeight = 600;
//var oldFov;
var oldcc;
var defaultMapURL = "http://skies.esac.esa.int/DSSColor/";
var currMapURL;


console.log("maxNPix: "+maxNPix);

var gl;
var canvas;
 
var shaderProgram;
var catalogueProgram;
var pwgl = {
		"catalogues": [],
		"pixels": [],
		"pixelsCache": [],
		"selectedSkies": [],
		"availableSkies": [],
		"defaultSkyName": "DSS Color",
		"loadedTextures" : [],
		"texturesArray" : [[]],
		"texturesTransparencyArray" : [],
		"loadedSkiesIds": [],
		"requestId" : "",
		"projectionMatrix" : mat4.create(),
		"modelViewMatrix" : mat4.create(),
		"skyRotationMatrix": mat4.create(),
		"modelViewMatrixStack" : [],
		"vertexPositionBuffer" : "",
		"vertexTextureCoordinateBuffer" : "",
		"vertexIndexBuffer" : "",
		
		"vertexCataloguePositionBuffer" : "",
		"vertexCatalogueIndexBuffer" : "",
		
		"VERTEX_POS_BUF_ITEM_SIZE" : 3,
		"VERTEX_POS_BUF_NUM_ITEMS" : 0,
		
		"VERTEX_POS_CAT_BUF_ITEM_SIZE" : 3,
		"VERTEX_POS_CAT_BUF_NUM_ITEMS" : 0,
		
		"VERTEX_TEX_COORD_BUF_ITEM_SIZE" : 2,
		"VERTEX_TEX_COORD_BUF_NUM_ITEMS" : 0,
		"VERTEX_INDEX_BUF_ITEM_SIZE" : 1,
		"VERTEX_INDEX_BUF_NUM_ITEMS" : 0,
		"vertexTextureAttributeLoc" : "",
		"vertexPositionAttributeLoc" : "",
		"vertexCatPositionAttributeLoc" : "",
		"uniformMVMatrixLoc": "",
		"uniformProjMatrixLoc": "",
		"uniformSamplerLoc": [],
		"uniformVertexTextureFactorLoc" : []
}



function changeSkyTransparency(skyidx, transpValue){
	console.log("-------ChangeSkyTransparency-------");
	var sky;
	for (var i=0; i<pwgl.selectedSkies.length && i<8; i++){
		sky = pwgl.selectedSkies[i];
		if (sky.idx == skyidx){
			sky.textures.opacity = transpValue/100;
			break;
		}
	}
	console.log("-------End of ChangeSkyTransparency-------");
}

function removeSky(skyidx){
	console.log("-------Inside RemoveSky-------");
	var sky;
	for (var i=0; i<pwgl.selectedSkies.length && i<8; i++){
		sky = pwgl.selectedSkies[i];
		if (sky.idx == skyidx){
			pwgl.selectedSkies.splice(i,1);
			addTextures(true);
			break;
		}
	}
	console.log("-------End of RemoveSky-------");
}

function addSky(skyidx){
	console.log("-------Inside AddSky-------");
	var sky = pwgl.availableSkies[skyidx];
	sky.textures.needsRefresh = true;
	var shaderIndex = pwgl.selectedSkies.push(sky);
//	console.log(sky);
	addTextures(true);
	console.log("-------End of AddSky-------");
	debug=true;
}

function getPixNo(xyz){
	var p = new Pointing(new Vec3(xyz[0], xyz[1], xyz[2]));
//	console.log("Pointing");
//	console.log(p);
//	console.log(this.healpix);
	
	var pixNo = healpix.ang2pix(p);
	return pixNo;
}

function getCoordsCenter(){
	var vxy = [offset.left + canvas.width / 2, offset.top + canvas.height / 2];
	var rcc = convertXY2World(vxy[0],vxy[1]);
    return rcc; 
}



function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function fovInRange(){
	
	if ( fov >= 50 && oldFov >= 50){
		console.log("fov >= 50 && oldFov >= 50");
		return true;
	}
	
	if ( fov < 2 && oldFov < 2 && oldFov >=1){
//		console.log("fov < 8 && oldFov < 8");
		return true;
	}else if ( fov < 2 && (oldFov >= 2 || oldFov <1)){
		console.log("fov < 8 && (oldFov >= 8 || oldFov <4)");
		console.log("oldFov "+oldFov);
		return false;
	}
	
	if ( fov < 4 && oldFov < 4 && oldFov >=2){
//		console.log("fov < 4 && oldFov < 4");
		return true;
	}else if ( fov < 4 && (oldFov >= 4 || oldFov <2)){
		console.log("fov < 4 && (oldFov >= 4 || oldFov <2)");
		return false;
	}
	
	if ( fov < 8 && oldFov < 8 && oldFov >=4){
//		console.log("fov < 8 && oldFov < 8");
		return true;
	}else if ( fov < 8 && (oldFov >= 8 || oldFov <4)){
		console.log("fov < 8 && (oldFov >= 8 || oldFov <4)");
		return false;
	}
	if ( fov < 16 && oldFov < 16 && oldFov >=8){
//		console.log("fov < 16 && oldFov < 16");
		return true;
	}else if ( fov < 16 && (oldFov >= 16 || oldFov <8)){
		console.log("fov < 16 && (oldFov >= 16 || oldFov <8)");
		return false;
	}
	if ( fov < 50 && oldFov < 50 && oldFov >= 16){
//		console.log("fov < 50 && oldFov < 50");
		return true;
	}else if (fov < 50 && (oldFov >= 50 || oldFov<16)){
		console.log("fov < 50 && (oldFov >= 50 || oldFov<16)");
		return false;
	}
	return false;
}

function refreshHealpix(){
	console.log("refreshing Healpix");
//	console.log("refreshing Healpix [nside]"+this.nside);
	if (fov >= 16){
		norder = 3;
		nside = Math.pow(2, norder);
		healpix = new Healpix(nside);
		maxNPix = healpix.getNPix();
	}else if (fov < 2){
		norder = 7;
		nside = Math.pow(2, norder);
		healpix = new Healpix(nside);
		maxNPix = healpix.getNPix();
	}else if (fov < 4){
		norder = 6;
		nside = Math.pow(2, norder);
		healpix = new Healpix(nside);
		maxNPix = healpix.getNPix();
	}else if (fov < 8){
		norder = 5;
		nside = Math.pow(2, norder);
		healpix = new Healpix(nside);
		maxNPix = healpix.getNPix();
	}else if (fov < 16){
		norder = 4;
		nside = Math.pow(2, norder);
		healpix = new Healpix(nside);
		maxNPix = healpix.getNPix();
	}
//	console.log("refreshing Healpix [nside]"+this.nside);
	for (var k=0; k<pwgl.selectedSkies.length && k<8;k++){
		pwgl.selectedSkies[k].textures.needsRefresh = true;
	}
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
	if (!fovInRange()){
		console.log("redraw");
		refreshHealpix();
		updateVisiblePixels(true);
		setupBuffers();
		setupTextures();
		oldFov = fov;
	}
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    var rxyz = convertXY2World(event.clientX, event.clientY);
	var pixNo = getPixNo(rxyz);
    console.log("pixNo clicked: "+pixNo);
}


function handleMouseUp(event) {
    mouseDown = false;
}

function onWindowResized(ev){
	console.log("Window resize");
	canvas.width = canvas.height = Math.min(window.innerWidth, window.innerHeight);
	createGLContext(canvas)
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

function raDecToModelXYZ(radecdeg){
	var xyz = [];
	var radecrad = [(radecdeg[0]) * Math.PI / 180.0, radecdeg[1] * Math.PI / 180.0];
	xyz[0] = Math.cos(radecrad[1]) * Math.cos(radecrad[0]);
	xyz[1] = Math.cos(radecrad[1]) * Math.sin(radecrad[0]);
	xyz[2] = Math.sin(radecrad[1]);
	return xyz;
}


function handleMouseMove(ev){
	var coordsDiv = document.getElementById('coords');
	var coordsHMSDiv = document.getElementById('coordsHMS');
	var rxyz = rotateViewXY(ev.clientX, ev.clientY);;
    var radec = modelToRaDec(rxyz);
    coordsDiv.innerHTML = "ra: "+radec[0]+" dec: "+radec[1];
    var raHMS = convertRa2HMS(radec[0]);
    var decDMS = convertDec2DMS(radec[1]);
    coordsHMSDiv.innerHTML = raHMS[0]+" "+raHMS[1]+" "+raHMS[2]+" "+decDMS[0]+" "+decDMS[1]+" "+decDMS[2];
}

function convertXY2World(x,y){
	var vx = x; // x coordinate of a mouse pointer
    var vy = y; // y coordinate of a mouse pointer
    var vxy = [vx, vy];
    
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
    var vxy = [vx, vy];
    
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

function initCatalogues(){
	var catDiv = document.getElementById("catalogues");
	var catalogue = new Catalogue("XMM Slew");
	for (var i=0; i<sources.length; i++){
		var sourceJSON = new Source(sources[i]);
		catalogue.addSource(sourceJSON);
	}
	pwgl.catalogues.push(catalogue);
	
	var checkbox = document.createElement('input');
	checkbox.type = "checkbox";
	checkbox.name = "cat";
	checkbox.value = 0;
	checkbox.id = "cat"+0;
	checkbox.checked = false;
	
	var label = document.createElement('label')
	label.htmlFor = checkbox.id;
	label.appendChild(document.createTextNode(catalogue.name));
	
	catDiv.appendChild(checkbox);
	catDiv.appendChild(label);
	
	document.getElementById(checkbox.id).addEventListener("click", function(){
		if (this.checked){
			enableCatalogue = true;
		}else{
			enableCatalogue = false;
		}
	});
}

var enableCatalogue = false;

function initSkies(){
	var curJSONSky;
	var skiesDiv = document.getElementById("skies");
	for (var i =0; i<skies.length; i++){
		curJSONSky = skies[i];
//		console.log(curJSONSky);
		var sky = new Sky(curJSONSky, i);
		var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
		checkbox.name = "hips";
		checkbox.value = i;
		checkbox.id = "hips"+i;
		if (curJSONSky.name == pwgl.defaultSkyName){
			checkbox.checked = true;
			pwgl.selectedSkies.push(sky);
		}
		
		var label = document.createElement('label')
		label.htmlFor = checkbox.id;
		label.appendChild(document.createTextNode(curJSONSky.name));

		
		var range = document.createElement('input');
		range.type = "range";
		range.name = "transparency";
		range.id = i;
		range.value = "100";
		range.min = "0";
		range.max = "100";

 		skiesDiv.appendChild(checkbox);
 		skiesDiv.appendChild(label);
 		skiesDiv.appendChild(range);
 		skiesDiv.appendChild(document.createElement("br"));
 		
		document.getElementById(checkbox.id).addEventListener("click", function(){
			if (this.checked){
				addSky(this.value);
			}else{
				removeSky(this.value);
			}
		});
		
		document.getElementById(range.id).addEventListener("input", function(){
			changeSkyTransparency(this.id, this.value);
		});
		pwgl.availableSkies.push(sky);
	}
}

function startup() {
	canvas = document.createElement('canvas');
	var container = document.getElementById("container");
    canvas.id     = "myGLCanvas";

    canvas.width = canvas.height = Math.min(window.innerWidth, window.innerHeight);
    
    canvas.style.zIndex   = 8;
    canvas.style.position = "absolute";
    canvas.style.border   = "1px solid";

    
    initSkies();
    initCatalogues();
    
    container.appendChild(canvas)
    offset = (document.getElementById("myGLCanvas")).getBoundingClientRect();

	canvas.addEventListener('webglcontextlost', handleContextLost, false);
	canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
	
	gl = createGLContext(canvas);
	updateVisiblePixels();
	setupShaders2();
	setupShaders();
	pwgl.modelViewMatrix = mat4.create(); 
	pwgl.projectionMatrix = mat4.create();
	pwgl.modelViewMatrixStack = [];
	setupBuffers();
	setupTextures(true);
	gl.clearColor(0.5,0.5,0.5, 1.0);
	gl.enable(gl.DEPTH_TEST);

	
	
    mat4.identity(pwgl.skyRotationMatrix);

    fovDiv = document.getElementById('fov');
    fovDiv.innerHTML = "fov: "+fov+"<sup>&#8728;</sup>";

//	var container = document.getElementById("container");
	container.addEventListener( 'mousewheel', onMouseWheel, false );
	container.addEventListener( 'DOMMouseScroll', onMouseWheel, false);
	window.addEventListener( 'resize', onWindowResized, false );
	canvas.onmousemove = handleMouseMove;
	canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    
	draw();
}