var MATCHES_SHOWN = 15;

function initializeMatchList(){
  var container = document.getElementById('middle-container'),
      table  = document.createElement('table');
  table.style.width  = '100px';
  table.style.border = '1px solid black';

  // Sort beams by those with highest unbraced length of 0
  var wBeamsList = Object.keys(W_BEAMS_MAP)
        .map(function(shape){ return W_BEAMS_MAP[shape]; })
        .sort(function(a, b){ return +b.MnValues[0].Mn - +a.MnValues[0].Mn; });
  // Get top 15 sorted by Weight
  wByWeight = wBeamsList.slice(0, MATCHES_SHOWN)
        .sort(function(a, b){ return +a.W - +b.W; })
        .map(function(beam){ return beam.AISC_Manual_Label + '(' + beam.W + ')'; })
  // Get top 15 sorted by Weight
  wByDepth = wBeamsList.slice(0, MATCHES_SHOWN)
        .sort(function(a, b){ return +a.d - +b.d; })
        .map(function(beam){ return beam.AISC_Manual_Label + '(' + beam.d + ')'; })

  var tr = table.insertRow();
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('Weight'));
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('Depth'));

  for(var i = 0; i < MATCHES_SHOWN; i++){
    var tr = table.insertRow();
    for(var j = 0; j < 2; j++){
      var td = tr.insertCell();
      td.style.border = '1px solid black';
      if (j === 0){
        td.appendChild(document.createTextNode(wByWeight[i]));
      } else if (j === 1){
        td.appendChild(document.createTextNode(wByDepth[i]));
      }
      // td.setAttribute('rowSpan', '2');
    }
  }
  container.appendChild(table);
}

function updateMatchList(){
  console.log(W_BEAMS_FILTERED)
}
