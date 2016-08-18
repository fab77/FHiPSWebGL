/**
 * 
 */
var skies = [
	{
		"name":"DSS Color",
		"URL":"http://skies.esac.esa.int/DSSColor/",
		"index":0,
		"shaderIdx": null,
		"selected":true
	},{
		"name":"AllWISE Color",
		"URL":"http://skies.esac.esa.int/AllWISEColor/",
		"index":1,
		"shaderIdx": null,
		"selected":false
	},{
		"name":"Herschel PACS RGB 70+160",
		"URL":"http://skies.esac.esa.int/Herschel/PACS-color/",
		"index":2,
		"shaderIdx": null,
		"selected":false
	}
];

function getSkyDyIdx(idx){
	for (var i=0; i<skies.length; i++){
		if (skies[i].index == idx){
			return skies[i]; 
		}
	}
	return skies[0];
}

function getSkyByName(skyName){
	for (var i=0; i<skies.length; i++){
		if (skies[i].name == skyName){
			return skies[i];
		}
	}
	return skies[0];
}



function Sky(JSONSky, idx){
	this.baseURL = JSONSky.URL;
	this.name = JSONSky.name;
	this.initTextures();
	this.idx = idx;
}

Sky.prototype.initTextures = function(){
	this.textures = new SkyTexture();
};

//Sky.prototype.getShadersIndex = function(){
//	return pwgl.selectedSkies.indexOf(this);
//};

function SkyTexture(){
	this.needsRefresh = true;
	this.opacity = 1.00 * 100.0/100.0;
	this.images = [];
//	this.shaderIndex;
}


