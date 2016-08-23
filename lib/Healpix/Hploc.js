/**
 * 
 */



"use strict";


//function Hploc(params){
//	var properties = $.extend({
//        ptg: null
//    }, params);
//
//    console.log('Preset instantiated');
//    this.ptg = properties.ptg;
//    this.name = properties.name;
//    this.inItems = properties.inItems;
//    this.outItems = properties.outItems;
//}



function Hploc(){
	this.PI4_A = 0.7853981554508209228515625;
	this.PI4_B = 0.794662735614792836713604629039764404296875e-8;
	this.PI4_C = 0.306161699786838294306516483068750264552437361480769e-16;
	this.M_1_PI = 0.3183098861837906715377675267450287;
}

function Hploc(ptg) {
	this.PI4_A = 0.7853981554508209228515625;
	this.PI4_B = 0.794662735614792836713604629039764404296875e-8;
	this.PI4_C = 0.306161699786838294306516483068750264552437361480769e-16;
	this.M_1_PI = 0.3183098861837906715377675267450287;
//	console.log("[Hploc(ptg)] ptg "+ptg);
//	console.log(ptg);
	if (undefined != ptg ){
		if(  !( (ptg.theta>=0.0)&&(ptg.theta<=Math.PI))){
			alert("Hploc invalid theta value");
		}
//		else{
//			console.log("Hploc(ptg)");
//			console.log(ptg);
//		}
		this.sth = 0.0;
		this.have_sth=false;
		this.z = this.cos(ptg.theta);
		this.phi = ptg.phi;
		if (Math.abs(this.z)>0.99){
			this.sth = this.sin(ptg.theta);
			this.have_sth=true;
		}
	}
}

Hploc.prototype.setZ = function(z){
	this.z = z;
};

Hploc.prototype.setPhi = function(phi){
	this.phi = phi;
};

Hploc.prototype.setSth = function(sth){
	this.sth = sth;
};

Hploc.prototype.toVec3 = function(){
	var st = this.have_sth ? this.sth : Math.sqrt((1.0-this.z)*(1.0+this.z));
	var vector = new Vec3(st*this.cos(this.phi),st*this.sin(this.phi),this.z);
//	var vector = new Vec3(st*Math.cos(this.phi),st*Math.sin(this.phi),this.z);
    return vector;
};

Hploc.prototype.sin = function(d){
	
	var u = d * this.M_1_PI;
	var q = Math.floor(u < 0 ? u - 0.5 : u + 0.5);
	var x=4.0*q;
    d -= x*this.PI4_A;
    d -= x*this.PI4_B;
    d -= x*this.PI4_C;
    if ((q&1) != 0) {
    	d = -d;
    }
    return this.sincoshelper(d);
};


Hploc.prototype.cos = function(d){
	var u = d*this.M_1_PI - 0.5;
	var q = 1+2*Math.floor(u < 0 ? u - 0.5 : u + 0.5);
	var x=2.0*q;
    d -= x*this.PI4_A;
    d -= x*this.PI4_B;
    d -= x*this.PI4_C;
    if ((q&2) == 0){
    	d = -d;
    }
    return this.sincoshelper(d);
};


Hploc.prototype.sincoshelper = function(d){
	var s = d * d;
	var u = -7.97255955009037868891952e-18;
	  u = u*s +2.81009972710863200091251e-15;
	  u = u*s -7.64712219118158833288484e-13;
	  u = u*s +1.60590430605664501629054e-10;
	  u = u*s -2.50521083763502045810755e-08;
	  u = u*s +2.75573192239198747630416e-06;
	  u = u*s -0.000198412698412696162806809;
	  u = u*s +0.00833333333333332974823815;
	  u = u*s -0.166666666666666657414808;
//	  console.log(s*u*d + d);
	  return s*u*d + d;
};