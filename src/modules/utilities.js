export const plotClearer = {
  clearTable: () => {
    document.getElementById("demo3").innerHTML = "";
    d3.select("table").remove();
  },
  clearAll: () => {
    plotClearer.clearTable();
    document.getElementById("predicted_words").innerHTML = "";
    document.getElementById("frequent_words").innerHTML = "";
    d3.select("svg").remove();
  }
};

// AJF: Curious to figure out what is arri
// used to search a particular substring in the list of requested feature column
// used to determine whether we should add find to arri, hence the t/f -> f/t

export function searchdic(arri, find) {
  for(var i=0;i<arri.length;i++) {
    if(JSON.stringify(find) === JSON.stringify(arri[i])){
      return false;
    }
  }
  return true;
}

// Checks the url query for name=value and extracts the value
// *************************************************************
// TODO: This can likely be accomplished using newer browser APIS, e.g.:
// let queryParams = (new URL(location)).searchParams;
// let dataset = queryParams.get("dataset") || "joined_data.csv";
export function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}