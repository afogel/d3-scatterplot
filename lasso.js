import { 
  plotClearer, 
  plotDimensions, 
  tabulate,
  searchdic
} from './utilities.js';

/* https://github.com/skokenes/D3-Lasso-Plugin
   plugin also handles selected and possible settings */

export const lasso = {
  wrapper: d3.lasso()
             .closePathDistance(75) // max distance for the lasso loop to be closed
             .closePathSelect(true) // can items be selected by closing the path?
             .hoverSelect(true), // can items by selected by hovering over them?
                  // .area(lassoArea) // area where the lasso can be started
                  // .on("start", lasso.start) // lasso start function
                  // .on("draw", lasso.draw) // lasso draw function
                  // .on("end", lasso.end),
  lassoArea: (svg) => {
    return svg.append("rect")
              .attr("width", plotDimensions.width)
              .attr("height", plotDimensions.height)
              .style("opacity", 0)
  },
  items: () => (lasso.wrapper.items()),
  selectedDots: (state) => (lasso.items().filter((dot) => ( d.selected === state ))),
  possibleDots: (state) => (lasso.items().filter((dot) => ( dot.possible === state ))),
  start: () => {
    plotClearer.clearTable();
    lasso.items()
         .attr("r", 3.5) // reset size
         .style("fill", null) // clear all of the fills (greys out)
         .classed({ "not_possible": true, "selected":false }); // style as not possible
  },
  draw: () => {
    // Style the possible dots
    lasso.possibleDots(true)
         .classed({ "not_possible": false, "possible": true });

    // AJF NOTE: I'm curious why there's additional style added instead of an 
    // additional CSS class. Replace?
    // Style the not possible dot
    lasso.possibleDots(false)
         .classed({ "not_possible": true, "possible": false })
         .style("stroke", "#000");
  },

  end: () => {
    // Reset the color of all dots
    lasso.items()
         .style("fill", (dot) => ( color(dot[color_column])));

    // Style the selected dots
    lasso.selectedDots(true)
         .classed({"not_possible":false,"possible":false})
         .attr("r",6.5);

    // get values for table -> array inside a list
    // TODO: potentially algorithm so it's not running at O^2 or O^3
    let zsx = lasso.selectedDots(true);
    x_values = [];
    y_values = [];
    // adjust the x and y values
    for (let i=0; i<zsx[0].length; i++) {
      x_values.push(((((zsx[0][i].getBBox().x+6.5) * (x_max - x_min))/width + x_min )));
      y_values.push(((((zsx[0][i].getBBox().y+6.5) * (y_min - y_max))/height + y_max)));
    }
    let selected_data=[], selected_data_indices=[];
    // Compare every selected point to all points (tempX)
    // in order to match coordinates with actual data
    for (let ii=0;ii<x_values.length;ii++) {
      console.log("lasso_end gathering selected data");
      console.log(temp1.length);
      for (let jj=0;jj<temp1.length;jj++) {
        x_values[ii] = +(x_values[ii].toFixed(3));
        y_values[ii] = +(y_values[ii].toFixed(5));
        if ( (x_values[ii] === +(temp1[jj].toFixed(3))) && (y_values[ii] === +(temp2[jj].toFixed(5))) ) {
          all_values = {};
          for (let k=1;k<categories.length;k++) {
            all_values[categories[k]] = (dict1[categories[k]][jj]);
          }
          if(searchdic(selected_data,all_values)==true){
            selected_data.push(all_values);
            selected_data_indices.push(jj);
            break;
          }
        }
      }
    }
    // render the table for the points selected by lasso
    if (selected_data.length > 0) {
      console.log("Rendering table...");
      console.log(selected_data);
      console.log(columns);
      console.log(x_values);
      var peopleTable = tabulate(selected_data, columns, x_values);
      if ("semantic_model" in dicts && dicts["semantic_model"] == "true") {
        console.log("Predicting words...");
        classify(selected_data_indices, vectorspace_2darray, weights_2darray, biases_1darray, vocab_1darray);
        benchmark(selected_data_indices, bow_2darray, vocab_1darray);
      }
    }

    // Reset the style of the not selected dots (we made them 0.5 smaller)
    lasso.selectedDots(false)
         .classed({ "not_possible": false, "possible": false})
         .attr("r",3)
         .style("stroke", "#000");
  },
  init: (svg) => {
    lasso.wrapper.area(lasso.lassoArea(svg))
                 .on("start", lasso.start)
                 .on("draw", lasso.draw) // lasso draw function
                 .on("end", lasso.end)
  }
}