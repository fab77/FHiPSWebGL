/**
 * 
 */
function setupTextures(forceReload){
	addTextures(forceReload);
}

function addTextures(forceReload){
	var currMap = currMapURL;
	
	if (!fovInRange()){
//		pwgl.pixels.splice(0, pwgl.pixels.length);
	}
//	console.log(pwgl.pixels);
	
	// fullZoom
	if (fov >=50){
	 	if (fovInRange() && !forceReload){
			return;
		}	 	
	 	var sky;
	 	for (var j=0; j<pwgl.selectedSkies.length && j<8;j++){
	 		
	 		sky = pwgl.selectedSkies[j];
	 		if (sky.textures.needsRefresh){
	 			sky.textures.images[0] = gl.createTexture();
		 		loadImageForTexture(sky.baseURL+"/Norder3/Allsky.jpg", sky.textures.images[0], j);	
		 		
		 		sky.textures.needsRefresh = false;
	 		}
	 		
	 	}
	 	pwgl.loadedTextures.splice(0, pwgl.loadedTextures.length);
	}else if (mouseDown || !fovInRange() || forceReload){
//		var toBeLoadedTextures = [];
		if (mouseDown){
			updateVisiblePixels(false);
		    setupBuffers();
		}
		for (var k=0; k<pwgl.selectedSkies.length && k<8;k++){
			
		    
			sky = pwgl.selectedSkies[k];

			if (sky.textures.needsRefresh){
				for (var d=0;d<sky.textures.images.length;d++){
					gl.deleteTexture(sky.textures.images[d]);
				}
				sky.textures.images.splice(0, sky.textures.images.length);
				sky.textures.needsRefresh = false;
			}
			if (!fovInRange()){
				for (var d=0;d<sky.textures.images.length;d++){
					gl.deleteTexture(sky.textures.images[d]);
				}
				sky.textures.images.splice(0, sky.textures.images.length);
				sky.textures.cache.splice(0, sky.textures.cache.length);
			}
			for (var n=0; n<pwgl.pixels.length;n++){
				var texCacheIdx = pwgl.pixelsCache.indexOf(pwgl.pixels[n]);
				if (texCacheIdx !== -1 ){
//					console.log("FROM CACHE");
					sky.textures.images[n] = gl.createTexture();
					sky.textures.images[n] = sky.textures.cache[texCacheIdx];
				}else{
//					console.log("NEW TEXTURE");
					sky.textures.images[n] = gl.createTexture();
					dirNumber = Math.floor(pwgl.pixels[n] / 10000) * 10000;
					loadImageForTexture(sky.baseURL+"/Norder"+this.norder+"/Dir"+dirNumber+"/Npix"+pwgl.pixels[n]+".jpg", sky.textures.images[n], k);
				}
			}
			sky.textures.cache = sky.textures.images.slice();
			
			
			
			
//			if (toBeLoadedTextures.length <= 0){
//				
//				for (var n=0; n<pwgl.pixels.length;n++){
//					if (pwgl.loadedTextures.indexOf(pwgl.pixels[n]) == -1 || sky.textures.needsRefresh){
//						toBeLoadedTextures.push(pwgl.pixels[n]);
//						pwgl.loadedTextures.push(pwgl.pixels[n]);
//					}
//				}
//			}
//			if (sky.textures.needsRefresh){
//				sky.textures.needsRefresh = false;
//			}
//			var dirNumber = "0";
//			var texIdx = sky.textures.images.length;
//			for (var i=0; i<toBeLoadedTextures.length;i++){
//				sky.textures.images[texIdx] = gl.createTexture();
//				dirNumber = Math.floor(toBeLoadedTextures[i] / 10000) * 10000;
//				loadImageForTexture(sky.baseURL+"/Norder"+this.norder+"/Dir"+dirNumber+"/Npix"+toBeLoadedTextures[i]+".jpg", sky.textures.images[texIdx], k);
//				texIdx++;
//			}
		}
	}
}


function addTexturesOLD(forceReload){
	var currMap = currMapURL;
	
	if (!fovInRange()){
//		pwgl.pixels.splice(0, pwgl.pixels.length);
	}
	console.log(pwgl.pixels);
	
	// fullZoom
	if (fov >=50){
	 	if (fovInRange() && !forceReload){
			return;
		}	 	
	 	var sky;
	 	for (var j=0; j<pwgl.selectedSkies.length && j<8;j++){
	 		sky = pwgl.selectedSkies[j];
	 		sky.textures.images[0] = gl.createTexture();
	 		loadImageForTexture(sky.baseURL+"/Norder3/Allsky.jpg", sky.textures.images[0], j);
	 	}
	 	pwgl.loadedTextures.splice(0, pwgl.loadedTextures.length);
	}else if (mouseDown || !fovInRange() || forceReload){
		var toBeLoadedTextures = [];
//		if (mouseDown){
//			updateVisiblePixels(false);
//		    setupBuffers();
//		}
		for (var k=0; k<pwgl.selectedSkies.length && k<8;k++){
			
		    
			sky = pwgl.selectedSkies[k];

			if (sky.textures.needsRefresh || !fovInRange()){
				sky.textures.images.splice(0, sky.textures.images.length);
			}
			if (toBeLoadedTextures.length <= 0){
				
				for (var n=0; n<pwgl.pixels.length;n++){
					if (pwgl.loadedTextures.indexOf(pwgl.pixels[n]) == -1 || sky.textures.needsRefresh){
						toBeLoadedTextures.push(pwgl.pixels[n]);
						pwgl.loadedTextures.push(pwgl.pixels[n]);
					}
				}
				
//				// DO NOT DELETE - OLD GASHION METHOD TO GET NEIGHBOURS
//				for (var i=-1; i<=1.1;i=i+0.25){
//					for (var j=-1; j<=1;j=j+0.25){
//						var xy = [i * 1/zoom,j * 1/zoom];
//						var xyz = worldToModel(xy);
//					    var rxyz = [];
//					    rxyz[0] = pwgl.skyRotationMatrix[0] * xyz[0] + pwgl.skyRotationMatrix[1] * xyz[1] + pwgl.skyRotationMatrix[2] * xyz[2];
//					    rxyz[1] = pwgl.skyRotationMatrix[4] * xyz[0] + pwgl.skyRotationMatrix[5] * xyz[1] + pwgl.skyRotationMatrix[6] * xyz[2];
//					    rxyz[2] = pwgl.skyRotationMatrix[8] * xyz[0] + pwgl.skyRotationMatrix[9] * xyz[1] + pwgl.skyRotationMatrix[10] * xyz[2];
//						
//						
//						var currPix = getPixNo(rxyz);
//						
//						if (pwgl.loadedTextures.indexOf(currPix) == -1  || sky.textures.needsRefresh){
//							pwgl.loadedTextures.push(currPix);
//							toBeLoadedTextures.push(currPix);
//						}
//					}
//				}
			}
			if (sky.textures.needsRefresh){
				sky.textures.needsRefresh = false;
			}
			var dirNumber = "0";
			var texIdx = sky.textures.images.length;
			for (var i=0; i<toBeLoadedTextures.length;i++){
				sky.textures.images[texIdx] = gl.createTexture();
				dirNumber = Math.floor(toBeLoadedTextures[i] / 10000) * 10000;
				loadImageForTexture(sky.baseURL+"/Norder"+this.norder+"/Dir"+dirNumber+"/Npix"+toBeLoadedTextures[i]+".jpg", sky.textures.images[texIdx], k);
				texIdx++;
			}
		}
	}
}

//function addTextures(forceReload){
//	var currMap = currMapURL;
//	// fullZoom
//	if (fov >=50){
//	 	if (fovInRange() && !forceReload){
//			return;
//		}	 	
//	 	var sky;
//	 	for (var j=0; j<pwgl.selectedSkies.length && j<8;j++){
//	 		sky = pwgl.selectedSkies[j];
//	 		sky.textures.images[0] = gl.createTexture();
//	 		loadImageForTexture(sky.baseURL+"/Norder3/Allsky.jpg", sky.textures.images[0], j);
//	 	}
//	 	pwgl.loadedTextures.splice(0, pwgl.loadedTextures.length);
//	}else if (mouseDown || !fovInRange() || forceReload){
//		var toBeLoadedTextures = [];
//		for (var k=0; k<pwgl.selectedSkies.length && k<8;k++){
//			
//			sky = pwgl.selectedSkies[k];
//			if (sky.textures.needsRefresh || !fovInRange() || forceReload){
//				sky.textures.images.splice(0, sky.textures.images.length);
//			}
//			if (toBeLoadedTextures.length <= 0){
//				var cc = getCoordsCenter();
//				var ccPixNo = getPixNo(cc);
//				if (pwgl.loadedTextures.indexOf(ccPixNo) == -1 || sky.textures.needsRefresh){
//					toBeLoadedTextures.push(ccPixNo);
//				}
//				var neighbours = this.healpix.neighbours(ccPixNo);
//				for(var n=0; n<neighbours.length; n++){
//					if ((pwgl.loadedTextures.indexOf(neighbours[n]) == -1  || sky.textures.needsRefresh) && neighbours[n] !== -1){
//						pwgl.loadedTextures.push(neighbours[n]);
//						toBeLoadedTextures.push(neighbours[n]);
//					}
//				}
//				for(var n=0; n<neighbours.length; n++){
//					var currNeighbours = this.healpix.neighbours(neighbours[n]);
//					for(var z=0; z<currNeighbours.length;z++){
//						if ((pwgl.loadedTextures.indexOf(currNeighbours[z]) == -1  || sky.textures.needsRefresh) && currNeighbours[z] !== -1){
//							pwgl.loadedTextures.push(currNeighbours[z]);
//							toBeLoadedTextures.push(currNeighbours[z]);
//						}	
//					}
//				}
//				
////				// DO NOT DELETE - OLD GASHION METHOD TO GET NEIGHBOURS
////				for (var i=-1; i<=1.1;i=i+0.25){
////					for (var j=-1; j<=1;j=j+0.25){
////						var xy = [i * 1/zoom,j * 1/zoom];
////						var xyz = worldToModel(xy);
////					    var rxyz = [];
////					    rxyz[0] = pwgl.skyRotationMatrix[0] * xyz[0] + pwgl.skyRotationMatrix[1] * xyz[1] + pwgl.skyRotationMatrix[2] * xyz[2];
////					    rxyz[1] = pwgl.skyRotationMatrix[4] * xyz[0] + pwgl.skyRotationMatrix[5] * xyz[1] + pwgl.skyRotationMatrix[6] * xyz[2];
////					    rxyz[2] = pwgl.skyRotationMatrix[8] * xyz[0] + pwgl.skyRotationMatrix[9] * xyz[1] + pwgl.skyRotationMatrix[10] * xyz[2];
////						
////						
////						var currPix = getPixNo(rxyz);
////						
////						if (pwgl.loadedTextures.indexOf(currPix) == -1  || sky.textures.needsRefresh){
////							pwgl.loadedTextures.push(currPix);
////							toBeLoadedTextures.push(currPix);
////						}
////					}
////				}
//			}
//			if (sky.textures.needsRefresh){
//				sky.textures.needsRefresh = false;
//			}
//			var dirNumber = "0"
//			for (var i=0; i<toBeLoadedTextures.length;i++){
//				sky.textures.images[toBeLoadedTextures[i]] = gl.createTexture();
//				dirNumber = Math.floor(toBeLoadedTextures[i] / 10000) * 10000;
////				loadImageForTexture(sky.baseURL+"/Norder"+this.norder+"/Dir0/Npix"+toBeLoadedTextures[i]+".jpg", sky.textures.images[toBeLoadedTextures[i]], k);
//				loadImageForTexture(sky.baseURL+"/Norder"+this.norder+"/Dir"+dirNumber+"/Npix"+toBeLoadedTextures[i]+".jpg", sky.textures.images[toBeLoadedTextures[i]], k);
//			}
//		}
//	}
//}

function loadImageForTexture(url, texture, texunit){
	var image = new Image();
	image.onload = function(){
		textureFinishedLoading(image, texture, texunit);
	}
	image.crossOrigin = "anonymous";
	image.src=url;
}

function textureFinishedLoading(image, texture, texunit){	
	gl.activeTexture(gl.TEXTURE0+texunit);
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
	
	
	gl.uniform1i(pwgl.uniformSamplerLoc[texunit], texunit);
//	if(texunit == 0){
//		gl.uniform1i(pwgl.uniformSampler0Loc, 0);
//    }else if(texunit == 1){
//    	gl.uniform1i(pwgl.uniformSampler1Loc, 1);
//    }else if(texunit == 2){
//    	gl.uniform1i(pwgl.uniformSampler2Loc, 2);
//    }
	if (!gl.isTexture(texture)){
    	console.log("error in texture");
    }
	gl.bindTexture(gl.TEXTURE_2D, null);
}