import { plotClearer, searchdic } from './utilities.js';

/* https://github.com/skokenes/D3-Lasso-Plugin
  plugin also handles selected and possible settings */

export function lassoStart () {
	plotClearer.clearTable();
	console.log(lasso)
  lasso.items()
       .attr("r",3.5) // reset size
       .style("fill",null) // clear all of the fills (greys out)
       .classed({"not_possible":true,"selected":false}); // style as not possible
}

export function lassoDraw() {
  // Style the possible dots
  lasso.items()
  		 .filter((dot) => ( dot.possible === true ))
  		 .classed({ "not_possible": false, "possible": true });

  // Style the not possible dot
  lasso.items()
  		 .filter((d) => ( d.possible === false ))
  		 .classed({"not_possible":true,"possible":false})
  		 .style("stroke", "#000");
};

