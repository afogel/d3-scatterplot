import { width, height, plotClearer, tabulate, searchdic } from './utilities.js';

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