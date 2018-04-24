import { width, height, d3_category20_shuffled } from './modules/constants.js';
import { 
  xValue,
  yValue,
  xScale,
  yScale,
  xMap,
  yMap,
  xAxis,
  yAxis 
} from './modules/utilities.js';
import { highlighting } from './modules/highlighting.js';

// This step is performed to parse the url to identify the dataset and the default coloring column
var query = window.location.search.substring(1);
var temp_query = query.split("&");
var dicts = {};
var tvars, dataset;
for(var i=0;i<temp_query.length;i++) {
  tvars = temp_query[i].split("=");
  dicts[tvars[0]]=tvars[1].replace(/%20/g, " ");
}
if ("dataset" in dicts) {
  dataset = dicts["dataset"];
} else {
  dataset = "joined_data.csv";
}
var weights_2darray = [], biases_1darray = [], vocab_1darray = [], vectorspace_2darray = [], bow_2darray = [];
// Semantic model option set up
if ("semantic_model" in dicts && dicts["semantic_model"] == "true") {
  console.log('Using semantic model.\nGetting matrices...');
  var weightsfile = dataset.split(/\.t[a-z]{2}$/)[0]+'_weights.txt';
  var biasesfile = dataset.split(/\.t[a-z]{2}$/)[0]+'_biases.txt';
  var vocabfile = dataset.split(/\.t[a-z]{2}$/)[0]+'_vocab.txt';
  var vectorfile = 'VS-' + dataset.split("_semantic")[0]+'.txt';
  var bowfile = dataset.split(/\.t[a-z]{2}$/)[0]+'_bow.txt';

  console.log("Reading " + bowfile);
  d3.tsv(bowfile, function(text){
    bow_2darray = text.map( Object.values );
    bow_2darray = bow_2darray.map(function(entry) {
      return entry.map(function(elem) {
        return Math.round(parseFloat(elem));
      });
    });
  });
  console.log("Reading " + vectorfile);
  d3.tsv(vectorfile, function(text){
    vectorspace_2darray = text.map( Object.values );
    vectorspace_2darray = vectorspace_2darray.map(function(arr) {
            // username column ends up last in the dictionary, due to alphanumeric sort
            return arr.slice(0,-1).map(function(elem) {
              return parseFloat(elem);
            });
          });
  });
  console.log("Reading " + weightsfile);
  d3.tsv(weightsfile, function(text){
    weights_2darray = text.map( Object.values );
    weights_2darray = weights_2darray.map(function(entry) {
      return entry.map(function(elem) {
        return parseFloat(elem);
      });
    });
  });
  console.log("Reading " + biasesfile);
  d3.tsv(biasesfile, function(text){
    biases_1darray = text.map( Object.values );
    biases_1darray = Object.values(biases_1darray.map(Number));
  });
  console.log("Reading " + vocabfile);
  d3.tsv(vocabfile, function(text){
    vocab_1darray = text.map( Object.values );
    vocab_1darray = Object.values(vocab_1darray.map(String));
  });
}

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

var tooltip1 = d3.select("body").append("div")
.attr("class", "tooltip1")
.style("opacity", 0);

// to print all the key values pairs of a point (used to display the summary on the webpage)
var print_array = function(arr, d) {
  var x = "";
  for (var i=0; i<arr.length; i++) {
    x = x + "<b>" + arr[i] + "</b>: " + d[arr[i]] + "<br>"
  }
  x = x + d.x + "<br>" + d["y"];
  return x;
};

// setup fill color
var color_column;

// coloring will be done according to the values determined by cValue
var cValue = function(d) {return d[color_column];},
cValue2 = function(d) {return Math.log(parseFloat(d[color_column]));},
color = d3.scale.ordinal().range(d3_category20_shuffled);


// create the dropdown menu
// Coloring
var dropDown = d3.select("body").append("select")
.attr("class", "select1")
.attr("name", "color_column");

// Searching
var dropDown1 = d3.select("body").append("select")
.attr("class", "select2")
.attr("name", "color_column");

// Transparent
var dropDown2 = d3.select("body").append("select")
.attr("class", "select4")
.attr("name", "color_column");

// Click on feature
var dropDown3 = d3.select("body").append("select")
.attr("class", "select5")
.attr("name", "color_column");

// Shaping
var dropDown4 = d3.select("body").append("select")
.attr("class", "select6")
.attr("name", "color_column");

var categories = [];
// category_search stores the name of column according to which searching is to be done
var category_search_data = [];
// categories stores the name of all the columns
var category_search;

categories.push("Select");
// check whether the searching column is provided in the url or not
if ("search" in dicts) {
  category_search = dicts["search"];
  category_search_data.push(category_search);
}


// color_column stores the name of column according to which coloring is to be done
// check whether the coloring column is provided in the url or not
if ("color" in dicts) {
  color_column = dicts["color"];
  categories.push(color_column);
} else {
  color_column = "Select";
}

// categories_copy_color is just the copy of categories
var categories_copy_color = [];
categories_copy_color.push(color_column);

var columns = [], temp = [];

// column for the transparent value
var transparent_column = "Select", feature_column = "", shaping_column = "Select";

console.log('Loading main data')
// getting header from csv file to make drowdown menus
d3.tsv(dataset, function(data) {
  console.log(data[0]);
  temp = Object.keys(data[0]);
    // remove x and y
    temp.splice(temp.indexOf('x'), 1);
    temp.splice(temp.indexOf('y'), 1);

    for(var i=0;i<temp.length;i++)
      if (temp[i] != category_search) {
        category_search_data.push(temp[i]);
      }

      for(var i=0;i<temp.length;i++) {
        // color_column already pushed
        if (temp[i] != color_column) {
          categories.push(temp[i]);
          categories_copy_color.push(temp[i]);
        }
        columns.push(temp[i]);
      }
    // check whether the coloring column is provided in the url or not
    // ?? is this necessary? color_column is already defined with the same procedure outside the function
    if ("color" in dicts) {
      color_column = categories[1]; // since color would be first, start with next
    } else {
      // color_column = "Select"
      color_column = categories[0];
    }
    category_search = category_search_data[0];
    // Searching
    dropDown1.selectAll("option")
    .data(category_search_data)
    .enter()
    .append("option")
    .text(function(d) { return d;})
    .text(function(d) {return d;});
    // Coloring
    dropDown.selectAll("option")
    .data(categories_copy_color)
    .enter()
    .append("option")
    .text(function(d) { return d;})
    .text(function(d) {return d;});
    // Transparent
    dropDown2.selectAll("option")
    .data(category_search_data)
    .enter()
    .append("option")
    .text(function(d) { return d;})
    .text(function(d) {return d;});
    // Click on feature
    dropDown3.selectAll("option")
    .data(category_search_data)
    .enter()
    .append("option")
    .text(function(d) { return d;})
    .text(function(d) {return d;});
    // Shaping
    dropDown4.selectAll("option")
    .data(categories)
    .enter()
    .append("option")
    .text(function(d) { return d;})
    .text(function(d) {return d;});
    shaping_column = categories[0];
    feature_column = category_search_data[0];
    transparent_column = category_search_data[0];
  });

// whenever any one of the drowdown menu's selected column is changes the plot is generated according to the value of dropdown menu selected
// Coloring
dropDown.on("change", plotting);
// Searching
dropDown1.on("change", plotting2);
// Transparent
dropDown2.on("change", plotting3);
// Click on feature
dropDown3.on("change", plotting4);
// Shaping
dropDown4.on("change", plotting5);

if ("q" in dicts) {
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, dicts["q"], "", "");
} else {
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, "", "", "");
}

// the functions to call when the value of dropdown menu is changes
// Click on feature
function plotting4(){
  feature_column = d3.event.target.value;
}
// Transparent
function plotting3(){
  transparent_column = d3.event.target.value;
}
// Searching
function plotting2(){
  category_search = d3.event.target.value;
}

// function to call for change event
// Coloring
function plotting(){
  color_column = d3.event.target.value;
  cValue = function(d) { return d[color_column];};
  
  val_transp = document.getElementById("transpText").value;
  val_opacityMatch = document.getElementById("opacityMatch").value;
  val_opacityNoMatch = document.getElementById("opacityNoMatch").value;
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, val_transp, val_opacityMatch, val_opacityNoMatch);
}

// function to call for change event
// Shaping
function plotting5(){
  shaping_column = d3.event.target.value;
  cValue = function(d) { return d[color_column];};
  val_transp = document.getElementById("transpText").value;
  val_opacityMatch = document.getElementById("opacityMatch").value;
  val_opacityNoMatch = document.getElementById("opacityNoMatch").value;
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, val_transp, val_opacityMatch, val_opacityNoMatch);
}

var zoomed = 0;
var needZoom = false;
var needDrawCircle = false;

// search event
// it will be executed when search button is pressed and points that matches the searched string will be highlighted
function handleClick(event) {
  console.log(document.getElementById("searchText").value);
  val_transp = document.getElementById("transpText").value;
  val_opacityMatch = document.getElementById("opacityMatch").value;
  val_opacityNoMatch = document.getElementById("opacityNoMatch").value;
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, val_transp, val_opacityMatch, val_opacityNoMatch);
  return false;
}
function handleCheck(event) {
  if (document.getElementById("searchText").value) {
    handleClick();
  }
}

// transparent event
// it will be executed when Transparent button is pressed and points that satisfies the condition will be highlighted
function handleClick1(event) {
  console.log(document.getElementById("transpText").value);
  val_transp = document.getElementById("transpText").value;
  val_opacityMatch = document.getElementById("opacityMatch").value;
  val_opacityNoMatch = document.getElementById("opacityNoMatch").value;
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, val_transp, val_opacityMatch, val_opacityNoMatch);
  return false;
}
function handleCheck1(event) {
  if (document.getElementById("transpText").value) {
    handleClick1();
  }
}

// ?? I believe this function is unused, and draw also maps to handleClick4
// it will be executed when Draw button is pressed and the plot will highlight those points that covers fixed percentage of point from the point obtained by mouse click
function handleClick2(event){
  shaping_column = "Select";
  color_column = "Select";
  myForm.searchText.value = 0;
  myForm1.transpText.value = 0;
  myForm1.opacityMatch.value = 0;
  myForm1.opacityNoMatch.value = 0;
  dropDown4.property( "value", "Select" );
  dropDown.property( "value", "Select" );
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, "", "", "");
  return false;
}

// spectrum / log event
// it will be executed when spectrum/log is checked
// ?? Can we collapse handleClick1,3,4?
function handleClick3(event) {
  val_transp = document.getElementById("transpText").value;
  val_opacityMatch = document.getElementById("opacityMatch").value;
  val_opacityNoMatch = document.getElementById("opacityNoMatch").value;
  highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, val_transp, val_opacityMatch, val_opacityNoMatch);
}

// it will be executed when (?? draw and) zoom button is pressed and the plot will zoomed out according to the points obtained by mouse click event
function handleClick4(){
  if (!document.getElementById('cbox3').checked) {
      document.getElementById("zoomxy").value = ""; // clear the textbox
    }
    val_transp = document.getElementById("transpText").value;
    val_opacityMatch = document.getElementById("opacityMatch").value;
    val_opacityNoMatch = document.getElementById("opacityNoMatch").value;
    needZoom = true;
    highlighting(dataset, categories, shaping_column, category_search, color_column, color, zoomed, needZoom, transparent_column, cValue, val_transp, val_opacityMatch, val_opacityNoMatch);
  }




function linspace(start, end, n) {
  var out = [];
  var delta = (end - start) / (n - 1);
  var i = 0;
  while(i < (n - 1)) {
    out.push(start + (i * delta));
    i++;
  }
  out.push(end);
  return out;
}

let coordinatesx = [];
let coordinatesy = [];

// provides different colored spectrum
var scale_d = {
  'puOr11': ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
  'spectral8': ['#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#e6f598', '#abdda4', '#66c2a5', '#3288bd'],
  'redBlackGreen': ['#ff0000', '#AA0000', '#550000', '#005500', '#00AA00', '#00ff00'],
};
let scale = scale_d['spectral8'];
