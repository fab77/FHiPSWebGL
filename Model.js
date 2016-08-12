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