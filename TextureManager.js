/**
 * 
 */
"use strict";
function setupTextures(forceReload){
	addTextures(forceReload);
}

var skyWorking = false;

function addTextures(forceReload){
	skyWorking = true;
//	console.log("[addTextures]");
	// fullZoom
	if (fov >=50){
	 	if (fovInRange() && !forceReload){
	 		skyWorking = false;
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
					var dirNumber = Math.floor(pwgl.pixels[n] / 10000) * 10000;
					loadImageForTexture(sky.baseURL+"/Norder"+norder+"/Dir"+dirNumber+"/Npix"+pwgl.pixels[n]+".jpg", sky.textures.images[n], k);
				}
			}
			sky.textures.cache = sky.textures.images.slice();

		}
	}
	skyWorking = false;
}


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

	if (!gl.isTexture(texture)){
    	console.log("error in texture");
    }
	gl.bindTexture(gl.TEXTURE_2D, null);
	
}