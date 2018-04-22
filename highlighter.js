// function for plotting
export default function highlighting(val_search, val_transp, val_opacityMatch, val_opacityNoMatch) {

  var svg;
  var temp1 = [], temp2 = [], temp3 = [];
  var dict1 = {};

    // to remove the existing svg plot if any and clear side table
    document.getElementById("demo3").innerHTML = "";
    document.getElementById("predicted_words").innerHTML = "";
    document.getElementById("frequent_words").innerHTML = "";
    d3.select("svg").remove();
    d3.select("table").remove();

    // function zoom() {
    //  svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    //    }

    // the location of svg image will be determined
    svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    /* https://github.com/skokenes/D3-Lasso-Plugin
    plugin also handles selected and possible settings */
    // Lasso starts
    var lasso_start = function() {
      d3.select("table").remove();
      document.getElementById("demo3").innerHTML = "";
      lasso.items()
            .attr("r",3.5) // reset size
            .style("fill",null) // clear all of the fills (greys out)
            .classed({"not_possible":true,"selected":false}); // style as not possible
          };

          var lasso_draw = function() {
        // Style the possible dots
        lasso.items().filter(function(d) {return d.possible===true})
        .classed({"not_possible":false,"possible":true});

        // Style the not possible dot
        lasso.items().filter(function(d) {return d.possible===false})
        .classed({"not_possible":true,"possible":false})
        .style("stroke", "#000");
      };

      var lasso_end = function() {
        // Reset the color of all dots
        lasso.items()
        .style("fill", function(d) { return color(d[color_column]); });

        // Style the selected dots
        lasso.items().filter(function(d) {return d.selected===true})
        .classed({"not_possible":false,"possible":false})
        .attr("r",6.5);

        // get values for table -> array inside a list
        var zsx = lasso.items().filter(function(d) {return d.selected===true});
        x_values = [];
        y_values = [];
        // adjust the x and y values
        for (var i=0; i<zsx[0].length; i++) {
          x_values.push(((((zsx[0][i].getBBox().x+6.5) * (x_max - x_min))/width + x_min )));
          y_values.push(((((zsx[0][i].getBBox().y+6.5) * (y_min - y_max))/height + y_max)));
        }
        var selected_data=[], selected_data_indices=[];
        // Compare every selected point to all points (tempX)
        // in order to match coordinates with actual data
        for (var ii=0;ii<x_values.length;ii++) {
          console.log("lasso_end gathering selected data");
          console.log(temp1.length);
          for (var jj=0;jj<temp1.length;jj++) {
            x_values[ii] = +(x_values[ii].toFixed(3));
            y_values[ii] = +(y_values[ii].toFixed(5));
            if ( (x_values[ii] === +(temp1[jj].toFixed(3))) && (y_values[ii] === +(temp2[jj].toFixed(5))) ) {
              all_values = {};
              for (var k=1;k<categories.length;k++) {
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
        lasso.items().filter(function(d) {return d.selected===false})
        .classed({"not_possible":false,"possible":false})
        .attr("r",3)
        .style("stroke", "#000");
      };

    // Create the area where the lasso event can be triggered
    var lasso_area = svg.append("rect")
    .attr("width",width)
    .attr("height",height)
    .style("opacity",0);

    // Define the lasso
    var lasso = d3.lasso()
        .closePathDistance(75) // max distance for the lasso loop to be closed
        .closePathSelect(true) // can items be selected by closing the path?
        .hoverSelect(true) // can items by selected by hovering over them?
        .area(lasso_area) // area where the lasso can be started
        .on("start",lasso_start) // lasso start function
        .on("draw",lasso_draw) // lasso draw function
        .on("end",lasso_end); // lasso end function

    // Init the lasso object on the svg:g that contains the dots
    svg.call(lasso);

    var classify = function(indices, vs_source, weights_source, biases_source, vocab_source) {
      var sum_vectors = vs_source[indices[0]];
      for (i=1; i < indices.length; i++) {
        sum_vectors = math.add(sum_vectors, vs_source[indices[i]]);
      }
      var avg_vector = sum_vectors.map(function(x) { return x / indices.length; });
      var mul = math.multiply(avg_vector, weights_source);
      var add = math.add(mul, biases_source);
        // get indices of 10 greatest elements
        var topIndices = findIndicesOfMax(add, 10);
        console.log("Top predicted vocab words:");
        var strbuilder = "Predicted words:";
        for (i=0; i<10; i++) {
          console.log((i+1) + ": " + vocab_source[topIndices[i]]);
          strbuilder += " " + vocab_source[topIndices[i]] + ",";
        }
        document.getElementById("predicted_words").innerHTML = strbuilder.slice(0, -1);
      }
    var benchmark = function(indices, bow_source, vocab_source) { // may need to adjust
      var num_indices = indices.length;
      var vocab_freq = bow_source[indices[0]];
      for (i=1; i < num_indices; i++) {
        vocab_freq = math.add(vocab_freq, bow_source[indices[i]]);
      }
        // get indices of 10 greatest elements
        var topIndices = findIndicesOfMax(vocab_freq, 10);
        console.log("Most frequent words:");
        var strbuilder = "Most frequent words:";
        for (i=0; i<10; i++) {
          console.log((i+1) + ": " + vocab_source[topIndices[i]]);
          strbuilder += " " + vocab_source[topIndices[i]] + ",";
        }
        document.getElementById("frequent_words").innerHTML = strbuilder.slice(0, -1);
      }

    // Utility function used for predicting words in semantic setting
    // Source: https://stackoverflow.com/a/11792230/7100714
    function findIndicesOfMax(inp, count) {
      var outp = new Array();
      for (var i = 0; i < inp.length; i++) {
        outp.push(i);
        if (outp.length > count) {
          outp.sort(function(a, b) { return inp[b] - inp[a]; });
          outp.pop();
        }
      }
      return outp;
    }

    console.log('Loading main data, again') // load data
    d3.tsv(dataset, function(error, data) {

        // change string (from CSV) into number format
        var numerics = {}, symbol = {};
        //Omitting Select (0)
        for(var i=1;i<categories.length;i++) {
            // initialize the value for each category key to empty list
            dict1[categories[i]] = [];
            // initialize all categories as numeric
            numerics[categories[i]] = 1;
          }
          counter = 0;
          data.forEach(function(d) {
            // coerce the data to numbers
            d.x = +d.x;
            d["y"] = +d["y"];

            for(var i=1;i<categories.length;i++){
                // add every attribute of point to the {category:[val1,val2,...]}
                dict1[categories[i]].push(d[categories[i]]);
                // revoke a category's numerics status if find an entry has a non-Int or non-null value for that category
                numerics[categories[i]] = numerics[categories[i]] && (d[categories[i]] == "" || d[categories[i]] == parseFloat(d[categories[i]]));
              }
            // fill the symbol dictionary with all possible values of the shaping column as keys
            // value is the order of points
            if (!(d[shaping_column] in symbol)) {
              symbol[d[shaping_column]] = counter;
              counter = counter + 1;
            }
            // push all x values, y values, and all category search values into temp1/2/3
            temp1.push(d.x);
            temp2.push(d["y"]);
            temp3.push(d[category_search]);
          // console.log(d["z"] == parseInt(d["z"]));
        });
          console.log(numerics);
          console.log(color_column);
        // set color according to spectrum
        if (numerics[color_column] && document.getElementById('cbox1').checked) {
          console.log('using spectrum');
            // take log if log checkbox checked
            if (document.getElementById('cbox2').checked) {
              console.log('using log');
              m1 = (d3.min(data.map(function(d) {return Math.log(parseFloat(d[color_column])); })));
              m2 = (d3.max(data.map(function(d) {return Math.log(parseFloat(d[color_column])); })));
            } else{
              console.log('not using log');
              m1 = (d3.min(data.map(function(d) {return parseFloat(d[color_column])})));
              m2 = (d3.max(data.map(function(d) {return parseFloat(d[color_column])})));
            }

            console.log(m1, m2);
            m1 = Math.max(Number.MIN_VALUE, m1);
            console.log(m1, m2);

            color = d3.scale.linear()
            .domain(linspace(m1, m2,scale.length))
              //.domain(linspace(d3.min(data.map(function(d) {return parseInt(d[color_column])})), d3.max(data.map(function(d) {return parseInt(d[color_column])})),scale.length))
              .range(scale);
            } else {
              console.log('not using spectrum');
              color = d3.scale.ordinal().range(d3_category20_shuffled);
            }

        // don't want dots overlapping axis, so add in buffer to data domain
        var zoom = getParameterByName('Zoom'); // unused, capitalized Z anyway as changed above

        if (document.getElementById("cbox3").checked==false) {
          document.getElementById("zoomxy").value = "";
          zoomed = 0;
          needZoom = false;
          x_max = d3.max(data, xValue)+1;
          x_min = d3.min(data, xValue)-1;
          y_max = d3.max(data, yValue)+1;
          y_min = d3.min(data, yValue)-1;
        }

        // if zoom is checked and conditions are satisfied
        if (document.getElementById("cbox3").checked==true  && needZoom == true && coordinatesx.length >= 2) {

          x_max = xScale.invert(Math.max(coordinatesx[0], coordinatesx[1]))+1;
          x_min = xScale.invert(Math.min(coordinatesx[0], coordinatesx[1]))-1;
          y_max = yScale.invert(Math.min(coordinatesy[0], coordinatesy[1]))+1;
          y_min = yScale.invert(Math.max(coordinatesy[0], coordinatesy[1]))-1;

          console.log(x_max, x_min, y_max, y_min);
          document.getElementById("zoomxy").value = "X:["+parseInt(x_min)+", "+parseInt(x_max)+"] Y:["+parseInt(y_min)+", "+parseInt(y_max)+"]";

          zoomed = 1;
          needZoom = false;
                // document.getElementById("cbox3").checked = false;
                /*
                          zoom = zoom.substr(1, zoom.length-2);
                          commaIndex = zoom.indexOf(',');
                          x_min = parseFloat(zoom.substr(0, commaIndex));
                          zoom = zoom.substr(commaIndex+1);
                          commaIndex = zoom.indexOf(',');
                          x_max = parseFloat(zoom.substr(0, commaIndex));
                          zoom = zoom.substr(commaIndex+1);
                          commaIndex = zoom.indexOf(',');
                          y_min = parseFloat(zoom.substr(0, commaIndex));
                          y_max = parseFloat(zoom.substr(commaIndex+1));
                          */
                        }
                        xScale.domain([x_min, x_max]);
                        yScale.domain([y_min, y_max]);

        // xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
        // yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

        // x-axis
        cx = 0;
        cy = 0;
        ans = 0;

        // draw the x-axis of plot
        svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("");

        // draw the y-axis of plot
        svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("");

        // to identify the condition of transparent column values
        if (transparent_column !== "Select" && val_transp !== "" && val_opacityNoMatch !== "") {
          transparent_column = transparent_column.toString();
            val_transp = val_transp.toString(); // ?? no to lower case here?
          }
          else {
            val_transp = val_transp.toString();
          }

          var transpar = function(d) {
            if (val_transp !== "" && typeof d != 'undefined') {
                // if point's transp column value is equal to the value specified, return val_opacityMatch, else val_opacityNoMatch
                var match;
                if (document.getElementById('cbox6').checked) {
                    // console.log("Using exact match");
                    match = d[transparent_column] == val_transp;
                  } else {
                    match = d[transparent_column] && (d[transparent_column].toLowerCase().indexOf(val_transp.toLowerCase()) > -1);
                  }

                  if (match){
                    return parseFloat(val_opacityMatch);
                  } else{
                    return parseFloat(val_opacityNoMatch);
                  }
                }
                else {
                  return 1;
                }
              };

        // searching according to the substring given and searching column
        var searchFunc = function(d) {
          if (typeof d[category_search] == 'undefined' ) {
            return 1;
          }
            // noMatch truthy if not found
            var noMatch;
            if (document.getElementById('cbox5').checked) {
              noMatch = d[category_search] != val_search;
            } else {
              noMatch = d[category_search].toLowerCase().indexOf(val_search.toLowerCase()) < 0
              || val_search.length === 0;
            }
            return noMatch ? 1 : 2;
          };

          var searchFunc1 = function(d) {
            if (typeof d == 'undefined' ) {
              return 1;
            }
            // noMatch true if not found
            var noMatch;
            if (document.getElementById('cbox5').checked) {
              noMatch = d != val_search;
            } else {
              noMatch = d.toLowerCase().indexOf(val_search.toLowerCase()) < 0
              || val_search.length === 0;
            }
            return noMatch ? 1 : 2;
          };

          var searched_data = [], searched_data_indices = [], d_temp;
          /* temp3 holds the value of every point for the search column */
          for (var i=0;i<temp3.length;i++) {
            // 0 if found val in this point, 1 if not found
            if ( searchFunc1(temp3[i])-1 ) {
              d_temp = {};
                // enter all data into dictionary
                for(var j=1;j<categories.length;j++) {
                  d_temp[categories[j]] = dict1[categories[j]][i];
                }
                // only add to searched_data if not already in
                if(searchdic(searched_data, d_temp) === true) {
                  searched_data.push(d_temp);
                  searched_data_indices.push(i);
                }
              }
            }
        // create the table
        if ( val_search != "" && searched_data.length > 0) {
          var peopleTable1 = tabulate(searched_data, columns);
          if ("semantic_model" in dicts && dicts["semantic_model"] == "true") {
            console.log("Predicting words...");
            classify(searched_data_indices, vectorspace_2darray, weights_2darray, biases_1darray, vocab_1darray);
            benchmark(searched_data_indices, bow_2darray, vocab_1darray);
          }
        };

        // determines the rotation of symbols that can be done
        var sizes = {}
        sizes[0] = ["0", "90", "0", "0"]
        sizes[1] = ["0", "45", "0", "0"]
        sizes[2] = ["0", "90", "0", "0"]
        sizes[3] = ["0", "45", "0", "0"]
        sizes[4] = ["0", "90", "0", "0"]
        sizes[5] = ["0", "0", "0", "0"]
        var symbols = ["diamond", "cross", "triangle-up", "square", "triangle-down","circle"];

        /*** BEGIN drawing dots ***/

        // shaping of symbols according to the shaping column
        if (shaping_column !== "Select" ) {
          // color_column = shaping_column;
          var points = svg.selectAll(".dot")
          .data(data)
          .enter();

          points.append("path")
          .filter(function(d){ return (searchFunc(d) == 1); })
          .attr("class", "point")
          .style("stroke", "#000")
          .style("stroke-width", 1)
          // .attr("d", d3.svg.symbol().type(function(d) {return symbols[symbol[d[shaping_column]]%6];}).size( function(d) {return sizes[parseInt(symbol[d[shaping_column]]/6)%4];}))
          .attr("d", d3.svg.symbol().type(function(d) {return symbols[symbol[d[shaping_column]]%6];}).size(function(d) {return searchFunc(d)-1 ? 180:30;}))
          .attr("transform", function(d) { return "translate(" + xMap(d) + "," + yMap(d) + ") rotate(" + sizes[parseInt(symbol[d[shaping_column]]%6)][parseInt(symbol[d[shaping_column]]/6)%4] + ")"; })
          .style("fill", function(d) { return document.getElementById('cbox2').checked ? color(cValue2(d)) : color(cValue(d));})
          .style("opacity",function(d) { return transpar(d);})

          .on("mouseover", function(d) {
            tooltip.transition()
            .duration(200)
            .style("opacity", 1);
            tooltip.html(
              print_array(category_search_data, d))
            .style("left", 60 + "px")
            .style("top", 30 + "px");
          })
          .on("mouseout", function(d) {
            d3.select(this).attr("r", function(d){ return searchFunc(d)-1 ? 7:3 ; })
            .style("fill", function(d) { return color(cValue(d));});
            tooltip.transition()
            .duration(500)
            .style("opacity", 0);
          })
          .on("click", function(d) {
            svg.append("text")
            .text(d[feature_column])
            .attr("x", (d3.event.pageX-50))
            .attr("y", (d3.event.pageY-35));
          });

          points.append("path")
          .filter(function(d){ return (searchFunc(d) == 2); })
          .attr("class", "point")
          .style("stroke", "yellow")
          .style("stroke-width", 2)
          // .attr("d", d3.svg.symbol().type(function(d) {return symbols[symbol[d[shaping_column]]%6];}).size( function(d) {return sizes[parseInt(symbol[d[shaping_column]]/6)%4];}))
          .attr("d", d3.svg.symbol().type(function(d) {return symbols[symbol[d[shaping_column]]%6];}).size(function(d) {return searchFunc(d)-1 ? 180:30;}))
          .attr("transform", function(d) { return "translate(" + xMap(d) + "," + yMap(d) + ") rotate(" + sizes[parseInt(symbol[d[shaping_column]]%6)][parseInt(symbol[d[shaping_column]]/6)%4] + ")"; })
          .style("fill", function(d) { return document.getElementById('cbox2').checked ? color(cValue2(d)) : color(cValue(d));})
          .style("opacity",function(d) { return transpar(d);})

          .on("mouseover", function(d) {
            tooltip.transition()
            .duration(200)
            .style("opacity", 1);
            tooltip.html(
              print_array(category_search_data, d))
            .style("left", 60 + "px")
            .style("top", 30 + "px");
          })
          .on("mouseout", function(d) {
            d3.select(this).attr("r", function(d){ return searchFunc(d)-1 ? 7:3 ; })
            .style("fill", function(d) { return color(cValue(d));});
            tooltip.transition()
            .duration(500)
            .style("opacity", 0);
          })
          .on("click", function(d) {
            svg.append("text")
            .text(d[feature_column])
            .attr("x", (d3.event.pageX-50))
            .attr("y", (d3.event.pageY-35));
          });
        } else {
          // draw dots
          marked = {}
          var points = svg.selectAll(".dot")
          .data(data)
          .enter();

          points.append("circle")
          .filter(function(d){ return (searchFunc(d) == 1); })
          .attr("class", "dot")
          .attr("r", 3)
          .style("stroke", "#000")
          .style("stroke-width", 1)
          .attr("cx", xMap)
          .attr("cy", yMap)
          .style("fill", function(d) { return document.getElementById('cbox2').checked ? color(cValue2(d)) : color(cValue(d));})
          .style("opacity",function(d) { return transpar(d);})

          .on("mouseover", function(d) {
            tooltip.transition()
            .duration(200)
            .style("opacity", 1);
            tooltip.html(print_array(category_search_data, d))
            .style("left", 60 + "px")
            .style("top", 30 + "px");
          })

          .on("mouseout", function(d) {
            tooltip.transition()
            .duration(500)
            .style("opacity", 0);
          })

          .on("click", function(d) {
            if (!([d3.event.pageX, d3.event.pageY] in marked)) {
              marked[[d3.event.pageX, d3.event.pageY]] = true;
              marked[[d3.event.pageX-1, d3.event.pageY-1]] = true;
              marked[[d3.event.pageX+1, d3.event.pageY+1]] = true;
              marked[[d3.event.pageX-1, d3.event.pageY+1]] = true;
              marked[[d3.event.pageX+1, d3.event.pageY-1]] = true;
              marked[[d3.event.pageX+2, d3.event.pageY-2]] = true;
              marked[[d3.event.pageX-2, d3.event.pageY-2]] = true;
              marked[[d3.event.pageX-2, d3.event.pageY+2]] = true;
              marked[[d3.event.pageX+2, d3.event.pageY+2]] = true;
              svg.append("text")
              .text(d[feature_column])
              .attr("x", (d3.event.pageX-50))
              .attr("y", (d3.event.pageY-35));
                      /*
                      tooltip1.transition()
                         .attr("class", "tooltip1")
                               .style("opacity", 1);

                      tooltip1.html("<b>"+d[feature_column]+"</b>")
                               .style("left", (d3.event.pageX + 10) + "px")
                               .style("top", (d3.event.pageY - 10) + "px");
                               */
                             }
                           });
          points.append("circle")
          .filter(function(d){ return (searchFunc(d) == 2); })
          .attr("class", "dot")
          .attr("r", 7)
          .style("stroke", "yellow")
          .style("stroke-width", 2)
          .attr("cx", xMap)
          .attr("cy", yMap)
          .style("fill", function(d) { return document.getElementById('cbox2').checked ? color(cValue2(d)) : color(cValue(d));})
          .style("opacity",function(d) { return transpar(d);})
            // jann: here is the mouseover display
            .on("mouseover", function(d) {
              tooltip.transition()
              .duration(200)
              .style("opacity", 1);
              tooltip.html(
                print_array(category_search_data, d))
              .style("left", 60 + "px")
              .style("top", 30 + "px");
            })

            .on("mouseout", function(d) {
              tooltip.transition()
              .duration(500)
              .style("opacity", 0);
            })

            .on("click", function(d) {
              if (!([d3.event.pageX, d3.event.pageY] in marked)){
                marked[[d3.event.pageX, d3.event.pageY]] = true;
                marked[[d3.event.pageX-1, d3.event.pageY-1]] = true;
                marked[[d3.event.pageX+1, d3.event.pageY+1]] = true;
                marked[[d3.event.pageX-1, d3.event.pageY+1]] = true;
                marked[[d3.event.pageX+1, d3.event.pageY-1]] = true;
                marked[[d3.event.pageX+2, d3.event.pageY-2]] = true;
                marked[[d3.event.pageX-2, d3.event.pageY-2]] = true;
                marked[[d3.event.pageX-2, d3.event.pageY+2]] = true;
                marked[[d3.event.pageX+2, d3.event.pageY+2]] = true;
                svg.append("text")
                .text(d[feature_column])
                .attr("x", (d3.event.pageX-50))
                .attr("y", (d3.event.pageY-35));
              }
            });
          }
          /*** END drawing dots ***/

        // the event to call on click event
        svg.on("click",function() {
          // svg.select("#myText").remove();

          tooltip1.style("opacity", 0);
          var coordinates1 = d3.mouse(this);
          coordinatesx.unshift(coordinates1[0]);
          coordinatesy.unshift(coordinates1[1]);
          console.log(coordinatesx, coordinatesy);
        })

        /* can move up into the if/else, but more clear to separate functionality */
        if (shaping_column !== "Select" ) {
          lasso.items(d3.selectAll(".dot"));
        } else {
          lasso.items(d3.selectAll(".dot"));
        }

        var len = color.domain().length;
        // if spectrum
        if (numerics[color_column] && document.getElementById('cbox1').checked) {

          if (document.getElementById('cbox2').checked) {
            m1 = (d3.min(data.map(function(d) {return Math.log(parseFloat(d[color_column])); })));
            m2 = (d3.max(data.map(function(d) {return Math.log(parseFloat(d[color_column])); })));
          } else {
            m1 = (d3.min(data.map(function(d) {return parseFloat(d[color_column])})));
            m2 = (d3.max(data.map(function(d) {return parseFloat(d[color_column])})));

          }
          console.log(m1, m2);
          m1 = Math.max(Number.MIN_VALUE, m1);
          console.log(m1, m2);

          var legend = svg.selectAll(".legend")
          .data(color.domain())
          .enter().append("g")
          .attr("class", "legend");

          var gradient = legend.append('defs')
          .append('linearGradient')
          .attr('id', 'gradient')
                    .attr('x1', '0%') // bottom
                    .attr('y1', '100%')
                    .attr('x2', '0%') // to top
                    .attr('y2', '0%')
                    .attr('spreadMethod', 'pad');

                    var pct = linspace(0, 100, scale.length).map(function(d) {
                      return Math.round(d) + '%';
                    });

                    var colourPct = d3.zip(pct, scale);
                    colourPct.forEach(function(d) {
                      gradient.append('stop')
                      .attr('offset', d[0])
                      .attr('stop-color', d[1])
                      .attr('stop-opacity', 1);
                    });

                    legend.append('rect')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('width', 18)
                    .attr('height', 150)
                    .attr("transform", "translate(" + 582 + ", 0)")
                    .style('fill', 'url(#gradient)');

                    var legendScale = d3.scale.linear()
                    .domain([m1, m2])
                    .range([150, 0]);

                    var legendAxis = d3.svg.axis()
                    .scale(legendScale)
                    .orient("right")
                // .tickValues([m1, m2])
                .ticks(10);

                legend.append("g")
                .attr("class", "legend axis")
                .attr("transform", "translate(" + 600 + ", 0)")
                .call(legendAxis);
        } else { // no spectrum
          console.log(Object);
          var keys = Object.keys(symbol);
          leng = keys.length;
          if (leng<20 && shaping_column != "Select") {
              // draw legend
                // ?? Not sure why, but this legend appears not to show
                var legend = svg.selectAll(".legend")
                .data(keys)
                .enter().append("g");
                    // .attr("class", "legend");
                    // .attr("transform", function(d, i) { return "translate(30," + i * 20 + ")"; });
                    console.log(keys);
                    console.log(shaping_column);
                    console.log(symbol);
                    console.log(symbols);
                // draw legend colored rectangles
                legend.append("path")
                    // .attr("d", d3.svg.symbol().type(function(d) {return symbols[symbol[d]%6];}).size(function(d) {return sizes[parseInt(symbol[d]/6)%3];}))
                    .attr("d", d3.svg.symbol().type(function(d) {return symbols[symbol[d]%6];}))
                    .attr("x", width + 0)
                    .attr("width", 18)
                    .attr("height", 18)
                    // .attr("transform", function(d, i) { return "translate(" + 20 + "," + i*20 + ")"; });
                    .attr("transform", function(d, i) { return "translate(" + 20 + "," + i*20 + ") rotate(" + sizes[parseInt(symbol[d]%6)][parseInt(symbol[d]/6)%4] + ")"; });
                // draw legend text
                legend.append("text")
                    // .attr("x", 100 + 0)
                    // .attr("y", 4)
                    .attr("dy", ".35em")
                    .style("text-anchor", "begin")
                    .text(function(d) { return d;})
                    .attr("transform", function(d, i) { return "translate(30," + i * 20 + ")"; });
                  }

                  if(len <= 30 && color_column != "Select") {

                // draw legend
                var legend = svg.selectAll(".legend")
                .data(color.domain())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

                // draw legend colored rectangles
                legend.append("rect")
                .attr("x", width + 6)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", color);

                // draw legend text
                legend.append("text")
                .attr("x", width + 0)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) { return d;});
              }
            };
    }); // end load data
} // end highlighting