/**
 * 
 */
function Pointing(vec3){
	    this.theta = Math.atan2(Math.sqrt(vec3.x*vec3.x+vec3.y*vec3.y),vec3.z);
	    this.phi = Math.atan2 (vec3.y,vec3.x);
	    if (this.phi<0.){
	    	this.phi += 2*Math.PI;
	    }
	    if (this.phi>=2*Math.PI){
	    	this.phi -= 2*Math.PI;
	    }
}

