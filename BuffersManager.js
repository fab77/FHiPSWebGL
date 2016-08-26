/**
 * 
 */
"use strict";
//function updateVisiblePixelsOLD(clean){
//	if (clean){
//		pwgl.pixels.splice(0, pwgl.pixels.length);
//	}
//	if (fov >= 50){
//		for (var i=0; i<768;i++){
//			pwgl.pixels.push(i);
//		}
//	}else{
//		var cc = getCoordsCenter();
//		var ccPixNo = getPixNo(cc);
//		if (pwgl.pixels.indexOf(ccPixNo) == -1){
//			pwgl.pixels.push(ccPixNo);	
//		}
//		var neighbours = this.healpix.neighbours(ccPixNo);
//		for(var n=0; n<neighbours.length; n++){
//			if (pwgl.pixels.indexOf(neighbours[n]) == -1 && neighbours[n] !== -1){
//				pwgl.pixels.push(neighbours[n]);
//			}
//			var currNeighbours = this.healpix.neighbours(neighbours[n]);
//			for(var z=0; z<currNeighbours.length;z++){
//				if (pwgl.pixels.indexOf(currNeighbours[z]) == -1  && currNeighbours[z] !== -1){
//					pwgl.pixels.push(currNeighbours[z]);
//				}	
//			}
//		}
//	}
//	console.log("pixels.length "+pwgl.pixels.length);
//}


function updateVisiblePixels(clean){
	if (clean){
		pwgl.pixels.splice(0, pwgl.pixels.length);
		pwgl.pixelsCache.splice(0, pwgl.pixelsCache.length);
	}
	
	
	
	if (fov >= 50){
		console.log("ALL SKY");
		for (var i=0; i<768;i++){
			pwgl.pixels.push(i);
		}
	}else{
		pwgl.pixelsCache = pwgl.pixels.slice();
		pwgl.pixels.splice(0, pwgl.pixels.length);
		
		var cc = getCoordsCenter();
		var ccPixNo = getPixNo(cc);
//		console.log("ccPixNo: "+ccPixNo)
		if (pwgl.pixels.indexOf(ccPixNo) == -1){
			pwgl.pixels.push(ccPixNo);	
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
				
				if (pwgl.pixels.indexOf(currPix) == -1){
					pwgl.pixels.push(currPix);
				}
			}
		}
	}
}

function setupBuffers(){
	setupSkiesBuffers();
	setupCataloguesBuffers();
	
}

function setupCataloguesBuffers(){
	console.log("[setupCataloguesBuffers]");
	
	for (var i=0; i<pwgl.catalogues.length;i++){
		pwgl.vertexCataloguePositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexCataloguePositionBuffer);
		var catalogue = pwgl.catalogues[i];
		var nSources = catalogue.sources.length;
		var vertexCataloguePosition = new Float32Array(nSources*3);
		var positionIndex = 0;
		var epsilon = 0.00000001;
		for(var j=0; j<nSources;j++){
			vertexCataloguePosition[positionIndex] = catalogue.sources[j].x + epsilon;
			vertexCataloguePosition[positionIndex+1] = catalogue.sources[j].y + epsilon;
			vertexCataloguePosition[positionIndex+2] = catalogue.sources[j].z + epsilon;
			positionIndex +=3;
		}
		gl.bufferData(gl.ARRAY_BUFFER, vertexCataloguePosition, gl.STATIC_DRAW);
		pwgl.VERTEX_POS_CAT_BUF_ITEM_SIZE = 3;
		pwgl.VERTEX_POS_CAT_BUF_NUM_ITEMS = vertexCataloguePosition.length/3; 
		
	}	
}

function setupSkiesBuffers(){
	console.log("[setupSkiesBuffers]");
	pwgl.vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexPositionBuffer);
	var nPixels = pwgl.pixels.length;
	var vertexPosition = new Float32Array(12*nPixels);
// 	var vertexPosition = new Float32Array(15*maxNPix);
	var facesVec3Array;
	var p = [];
// 	var epsilon = 0.001;
	var epsilon = 0.0;
	for (var i=0; i < nPixels; i++){
		facesVec3Array = new Array();
		facesVec3Array = healpix.getBoundaries(pwgl.pixels[i]);
		
		vertexPosition[12*i] = facesVec3Array[0].x ;
		vertexPosition[12*i+1] = facesVec3Array[0].y ;
		vertexPosition[12*i+2] = facesVec3Array[0].z;
		
		vertexPosition[12*i+3] = facesVec3Array[1].x;
		vertexPosition[12*i+4] = facesVec3Array[1].y;
		vertexPosition[12*i+5] = facesVec3Array[1].z;
		
		vertexPosition[12*i+6] = facesVec3Array[2].x;
		vertexPosition[12*i+7] = facesVec3Array[2].y;
		vertexPosition[12*i+8] = facesVec3Array[2].z;
		
		vertexPosition[12*i+9] = facesVec3Array[3].x;
		vertexPosition[12*i+10] = facesVec3Array[3].y ;
		vertexPosition[12*i+11] = facesVec3Array[3].z;
		
//		vertexPosition[12*i] = (facesVec3Array[0].x).toFixed(17) ;
//		vertexPosition[12*i+1] = (facesVec3Array[0].y).toFixed(17) ;
//		vertexPosition[12*i+2] = (facesVec3Array[0].z).toFixed(17) ;
//		
//		vertexPosition[12*i+3] = (facesVec3Array[1].x).toFixed(17) ;
//		vertexPosition[12*i+4] = (facesVec3Array[1].y).toFixed(17) ;
//		vertexPosition[12*i+5] = (facesVec3Array[1].z).toFixed(17) ;
//		
//		vertexPosition[12*i+6] = (facesVec3Array[2].x).toFixed(17) ;
//		vertexPosition[12*i+7] = (facesVec3Array[2].y).toFixed(17) ;
//		vertexPosition[12*i+8] = (facesVec3Array[2].z).toFixed(17) ;
//		
//		vertexPosition[12*i+9] = (facesVec3Array[3].x).toFixed(17) ;
//		vertexPosition[12*i+10] = (facesVec3Array[3].y).toFixed(17) ;
//		vertexPosition[12*i+11] = (facesVec3Array[3].z).toFixed(17) ;
		
		
		
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
    var textureCoordinates = new Float32Array(8*nPixels);
//     var textureCoordinates = new Float32Array(10*maxNPix);
    if (fov>=50){
    	//0.037037037
    	var s_step=1/27;
    	//0.034482759
    	var t_step=1/29;
    	
    	var sindex = 0;
    	var tindex = 0;
    	for (var i=0; i < nPixels; i++){
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
    	for (var i=0; i < nPixels; i++){
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
    var vertexIndices = new Uint16Array(6*nPixels);
    var baseFaceIndex = 0; 
    for (var j=0; j< nPixels; j++){
    	
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
	
}

//function setupBuffers(){
//	
//	pwgl.vertexPositionBuffer = gl.createBuffer();
//	gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexPositionBuffer);
//	var vertexPosition = new Float32Array(12*maxNPix);
//// 	var vertexPosition = new Float32Array(15*maxNPix);
//	var facesVec3Array;
//	var p = [];
//// 	var epsilon = 0.001;
//	var epsilon = 0.0;
//	for (var i=0; i < maxNPix; i++){
//		facesVec3Array = new Array();
//		facesVec3Array = healpix.getBoundaries(i);
//
//		vertexPosition[12*i] = (facesVec3Array[0].x).toFixed(17) ;
//		vertexPosition[12*i+1] = (facesVec3Array[0].y).toFixed(17) ;
//		vertexPosition[12*i+2] = (facesVec3Array[0].z).toFixed(17) ;
//		
//		vertexPosition[12*i+3] = (facesVec3Array[1].x).toFixed(17) ;
//		vertexPosition[12*i+4] = (facesVec3Array[1].y).toFixed(17) ;
//		vertexPosition[12*i+5] = (facesVec3Array[1].z).toFixed(17) ;
//		
//		vertexPosition[12*i+6] = (facesVec3Array[2].x).toFixed(17) ;
//		vertexPosition[12*i+7] = (facesVec3Array[2].y).toFixed(17) ;
//		vertexPosition[12*i+8] = (facesVec3Array[2].z).toFixed(17) ;
//		
//		vertexPosition[12*i+9] = (facesVec3Array[3].x).toFixed(17) ;
//		vertexPosition[12*i+10] = (facesVec3Array[3].y).toFixed(17) ;
//		vertexPosition[12*i+11] = (facesVec3Array[3].z).toFixed(17) ;
//		
//// 		p.x = (facesVec3Array[0].x + facesVec3Array[2].x)/2 +epsilon;
//// 		p.y = (facesVec3Array[0].y + facesVec3Array[2].y)/2 +epsilon;
//// 		p.z = (facesVec3Array[0].z + facesVec3Array[2].z)/2 +epsilon;
//		
//// 		vertexPosition[15*i+12] = p.x;
//// 		vertexPosition[15*i+13] = p.y;
//// 		vertexPosition[15*i+14] = p.z;
//
//	}
//	gl.bufferData(gl.ARRAY_BUFFER, vertexPosition, gl.STATIC_DRAW);
//	pwgl.VERTEX_POS_BUF_ITEM_SIZE = 3;
//	pwgl.VERTEX_POS_BUF_NUM_ITEMS = vertexPosition.length; 
//	
//	
//    pwgl.vertexTextureCoordinateBuffer = gl.createBuffer();
//    gl.bindBuffer(gl.ARRAY_BUFFER, pwgl.vertexTextureCoordinateBuffer);
//    var textureCoordinates = new Float32Array(8*maxNPix);
////     var textureCoordinates = new Float32Array(10*maxNPix);
//    if (fov>=50){
//    	//0.037037037
//    	var s_step=1/27;
//    	//0.034482759
//    	var t_step=1/29;
//    	
//    	var sindex = 0;
//    	var tindex = 0;
//    	for (var i=0; i < maxNPix; i++){
//        	// [1, 0],[1, 1],[0, 1],[0, 0]
//        	textureCoordinates[8*i] = (s_step + (s_step * sindex)).toFixed(9);
//        	textureCoordinates[8*i+1] = (1 - (t_step + t_step * tindex)).toFixed(9);
//        	textureCoordinates[8*i+2] = (s_step + (s_step * sindex)).toFixed(9);
//        	textureCoordinates[8*i+3] = (1 - (t_step * tindex)).toFixed(9);
//        	textureCoordinates[8*i+4] = (s_step * sindex).toFixed(9);
//        	textureCoordinates[8*i+5] = (1 - (t_step * tindex)).toFixed(9);
//        	textureCoordinates[8*i+6] = (s_step * sindex).toFixed(9);
//        	textureCoordinates[8*i+7] = (1 - (t_step + t_step * tindex)).toFixed(9);
////         	textureCoordinates[10*i+8] = ((s_step/2) + s_step * sindex).toFixed(9);
////         	textureCoordinates[10*i+9] = (1 - (t_step/2) - t_step * tindex ).toFixed(9);
//        	sindex++;
//        	if(sindex == 27){
//        		tindex++;
//        		sindex=0;
//        	}
//        }
//    }else{
//    	for (var i=0; i < maxNPix; i++){
//        	// [1, 0],[1, 1],[0, 1],[0, 0]
//        	textureCoordinates[8*i] = 1.0;
//        	textureCoordinates[8*i+1] = 0.0;
//        	textureCoordinates[8*i+2] = 1.0;
//        	textureCoordinates[8*i+3] = 1.0;
//        	textureCoordinates[8*i+4] = 0.0;
//        	textureCoordinates[8*i+5] = 1.0;
//        	textureCoordinates[8*i+6] = 0.0;
//        	textureCoordinates[8*i+7] = 0.0;
////         	textureCoordinates[10*i+8] = 0.5;
////         	textureCoordinates[10*i+9] = 0.5;
//        }
//    }
//    
//    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
//    pwgl.VERTEX_TEX_COORD_BUF_ITEM_SIZE = 2;
//    pwgl.VERTEX_TEX_COORD_BUF_NUM_ITEMS = textureCoordinates.length;
//    
//	
//	pwgl.vertexIndexBuffer = gl.createBuffer();
//    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pwgl.vertexIndexBuffer);
////     var vertexIndices = new Uint16Array(12*maxNPix);
//    var vertexIndices = new Uint16Array(6*maxNPix);
//    var baseFaceIndex = 0; 
//    for (var j=0; j< maxNPix; j++){
//    	
////     	vertexIndices[12*j] = baseFaceIndex + 4;
////     	vertexIndices[12*j+1] = baseFaceIndex;
////     	vertexIndices[12*j+2] = baseFaceIndex + 1;
//    	
////     	vertexIndices[12*j+3] = baseFaceIndex + 4;
////     	vertexIndices[12*j+4] = baseFaceIndex + 1;
////     	vertexIndices[12*j+5] = baseFaceIndex + 2;
//    	
////     	vertexIndices[12*j+6] = baseFaceIndex + 4;
////     	vertexIndices[12*j+7] = baseFaceIndex + 2;
////     	vertexIndices[12*j+8] = baseFaceIndex + 3;
//    	
////     	vertexIndices[12*j+9] = baseFaceIndex + 4;
////     	vertexIndices[12*j+10] = baseFaceIndex + 3;
////     	vertexIndices[12*j+11] = baseFaceIndex;
//    	
//    	
//    	vertexIndices[6*j] = baseFaceIndex;
//    	vertexIndices[6*j+1] = baseFaceIndex + 1;
//    	vertexIndices[6*j+2] = baseFaceIndex + 2;
//    	
//    	vertexIndices[6*j+3] = baseFaceIndex;
//    	vertexIndices[6*j+4] = baseFaceIndex + 2;
//    	vertexIndices[6*j+5] = baseFaceIndex + 3;
//    		
////     	baseFaceIndex = baseFaceIndex+5;
//    	baseFaceIndex = baseFaceIndex+4;
//    	
//    }
//    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);
//    pwgl.VERTEX_INDEX_BUF_ITEM_SIZE = 1;
//    pwgl.VERTEX_INDEX_BUF_NUM_ITEMS = vertexIndices.length;
//
//	
////    console.log(textureCoordinates);
////    console.log(vertexPosition);
////    console.log(vertexIndices);
//    
//	
////    console.log(textureCoordinates.length);
////	console.log(vertexPosition.length);
////	console.log(vertexIndices.length);
//	
//}