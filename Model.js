/**
 * 
 */


"use strict";

var skies = [
	{
		"name":"DSS Color",
		"URL":"http://skies.esac.esa.int/DSSColor/",
		"index":0,
		"shaderIdx": null,
		"selected":false,
		"maxOrder": 9
	},{
		"name":"AllWISE Color",
		"URL":"http://skies.esac.esa.int/AllWISEColor/",
		"index":1,
		"shaderIdx": null,
		"selected":false,
		"maxOrder": 8
	},{
		"name":"Herschel PACS RGB 70+160",
		"URL":"http://skies.esac.esa.int/Herschel/PACS-color/",
		"index":2,
		"shaderIdx": null,
		"selected":false,
		"maxOrder": 9
	},{
		"name":"XMM-Newton EPIC color",
		"URL":"http://skies.esac.esa.int/XMM-Newton/EPIC-RGB/",
		"index":3,
		"shaderIdx": null,
		"selected":false,
		"maxOrder": 7
	},{
		"name":"INTEGRAL-IBIS RGB",
		"URL":"http://skies.esac.esa.int/Integral/color/",
		"index":4,
		"shaderIdx": null,
		"selected":false,
		"maxOrder": 3
	},{
		"name":"Planck 850",
		"URL":"http://skies.esac.esa.int/pla/HFI_SkyMap_857_2048_R2_02_full_HiPS/",
		"index":5,
		"shaderIdx": null,
		"selected":false,
		"maxOrder": 3
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
	this.maxOrder = JSONSky.maxOrder;
}

Sky.prototype.initTextures = function(){
	this.textures = new SkyTexture();
};

function SkyTexture(){
	this.needsRefresh = true;
	this.opacity = 1.00 * 100.0/100.0;
	this.images = [];
	this.cache = [];
}

function Catalogue(name){
	this.name = name;
	this.sources = [];
	this.length = this.sources.length;
}

Catalogue.prototype.addSource = function(src){
	this.sources.push(src);
	this.length = this.sources.length;
}

function Source(JSONsrc){
	this.url = JSONsrc.postcard_url;
	this.name = JSONsrc.name;
	this.ra = JSONsrc.ra;
	this.dec = JSONsrc.dec;
	this.flux = JSONsrc.flux;
	var xyz = raDecToModelXYZ([this.ra,this.dec]);
	this.x = xyz[0];
	this.y = xyz[1];
	this.z = xyz[2];
	
	if (isNaN(this.x) || isNaN(this.y) || isNaN(this.z)){
		console.log("NaN");
	}
}

var sources = [
{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=29020&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205352.4+442302",
"ra": 313.46866,
"dec": 44.383968,
"flux": 91.47864
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36159&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J203705.5+415008",
"ra": 309.27335,
"dec": 41.83554,
"flux": 56.26952
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=21862&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J202027.9+435113",
"ra": 305.11669,
"dec": 43.853506,
"flux": 47.17563
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36617&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205354.2+442257",
"ra": 313.47538,
"dec": 44.382361,
"flux": 40.03306
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11954&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205353.8+442309",
"ra": 313.47384,
"dec": 44.385807,
"flux": 33.93461
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11958&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205711.5+433141",
"ra": 314.2976,
"dec": 43.528023,
"flux": 11.23724
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11961&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J210057.2+414237",
"ra": 315.23831,
"dec": 41.71038,
"flux": 11.01322
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=633&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204437.6+441823",
"ra": 311.15629,
"dec": 44.306429,
"flux": 10.235033
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=635&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204557.9+444220",
"ra": 311.49132,
"dec": 44.705571,
"flux": 8.9905319
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11952&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205001.6+462018",
"ra": 312.50671,
"dec": 46.338162,
"flux": 8.454874
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36614&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205348.1+442450",
"ra": 313.45057,
"dec": 44.414022,
"flux": 8.096991
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11957&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205551.2+435218",
"ra": 313.96374,
"dec": 43.871808,
"flux": 7.854601
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=14922&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J210046.8+453008",
"ra": 315.19534,
"dec": 45.502071,
"flux": 7.790284
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=14971&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J210210.6+453908",
"ra": 315.54397,
"dec": 45.652164,
"flux": 7.460425
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36610&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205339.1+442700",
"ra": 313.41336,
"dec": 44.449879,
"flux": 5.70686
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=1300&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J202147.5+440043",
"ra": 305.44798,
"dec": 44.011995,
"flux": 5.6530156
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=14970&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J210046.8+453008",
"ra": 315.19434,
"dec": 45.501471,
"flux": 5.60435
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11956&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205443.2+442911",
"ra": 313.67975,
"dec": 44.486348,
"flux": 5.568717
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=634&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204508.2+444921",
"ra": 311.28505,
"dec": 44.822433,
"flux": 5.2841702
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=9009&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204352.3+463254",
"ra": 310.96832,
"dec": 46.548222,
"flux": 5.129332
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=28979&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204029.6+442432",
"ra": 310.12312,
"dec": 44.408906,
"flux": 5.03742
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=20768&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J202033.7+423534",
"ra": 305.14087,
"dec": 42.592723,
"flux": 4.57995
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=26555&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205454.7+433318",
"ra": 313.72859,
"dec": 43.554872,
"flux": 4.469551
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=636&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204709.6+415533",
"ra": 311.79059,
"dec": 41.925907,
"flux": 4.0636744
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=1301&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J202712.2+424722",
"ra": 306.80071,
"dec": 42.789525,
"flux": 3.4044542
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36608&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205318.6+443827",
"ra": 313.32794,
"dec": 44.640784,
"flux": 3.315569
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11953&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205130.6+454703",
"ra": 312.87783,
"dec": 45.784252,
"flux": 3.273324
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11955&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205354.9+442241",
"ra": 313.47885,
"dec": 44.378079,
"flux": 3.225971
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36605&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204624.2+455557",
"ra": 311.60146,
"dec": 45.932513,
"flux": 3.200888
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=29018&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204228.0+463506",
"ra": 310.61689,
"dec": 46.584995,
"flux": 3.087575
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=2990&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205256.6+425821",
"ra": 313.23646,
"dec": 42.972396,
"flux": 2.7608964
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=40438&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205811.6+455245",
"ra": 314.54792,
"dec": 45.879293,
"flux": 2.743617
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=18940&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J201803.6+451623",
"ra": 304.5149,
"dec": 45.273049,
"flux": 2.731625
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=14923&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J210305.7+450123",
"ra": 315.77425,
"dec": 45.023019,
"flux": 2.661609
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36812&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205042.7+423208",
"ra": 312.67779,
"dec": 42.535553,
"flux": 2.647675
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36607&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204825.9+452715",
"ra": 312.10828,
"dec": 45.454302,
"flux": 2.478368
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=632&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204433.0+460436",
"ra": 311.13687,
"dec": 46.076558,
"flux": 2.3694205
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=29074&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205130.6+454719",
"ra": 312.87682,
"dec": 45.788453,
"flux": 2.322923
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=26553&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J204125.4+451656",
"ra": 310.35577,
"dec": 45.282116,
"flux": 2.23509
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=38949&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J203320.5+462627",
"ra": 308.33582,
"dec": 46.440823,
"flux": 1.895043
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11959&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205733.4+431721",
"ra": 314.38895,
"dec": 43.289215,
"flux": 1.876148
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=36609&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205335.8+442849",
"ra": 313.3989,
"dec": 44.480422,
"flux": 1.833133
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=11960&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J205848.7+415734",
"ra": 314.70293,
"dec": 41.959487,
"flux": 1.766926
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=29288&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J203306.4+460219",
"ra": 308.27651,
"dec": 46.038593,
"flux": 1.696017
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=21863&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J202715.1+421357",
"ra": 306.81323,
"dec": 42.232599,
"flux": 1.692482
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=26552&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J203329.5+455448",
"ra": 308.37246,
"dec": 45.91342,
"flux": 1.689234
},{
"postcard_url": "http://nxsa.esac.esa.int/nxsa-sl/servlet/data-action?RETRIEVAL_TYPE=POSTCARD&SLEW_SOURCE_CAT_OID=13004&SLEW_SOURCE_CAT_PRODUCT_TYPE=DSS&PROTOCOL=HTTP",
"name": "XMMSL1 J202021.4+420347",
"ra": 305.09014,
"dec": 42.062993,
"flux": 1.667595
}

];
