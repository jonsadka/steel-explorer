var DEFAULT_Fy = 50; // ksi
var DEFAULT_E = 29000; // ksi
var DEFAULT_Cb = 1; //
var MAX_UNBRACED = 81; // ft
var UNBRACED_STEP = 1; // ft

// User inputs
var START_LENGTH = null;
var USER_WEIGHT = null;

// HEIGHTS
var CHARTS_HEIGHT = window.innerHeight;
var ROW_1_HEIGHT = 0.6 * CHARTS_HEIGHT;
var ROW_2_HEIGHT = 0.4 * CHARTS_HEIGHT;
// WIDTHS
var CHARTS_WIDTH = document.getElementById('right-column').offsetWidth;
var COL_1_WIDTH = CHARTS_WIDTH * 0.5;
var COL_2_WIDTH = CHARTS_WIDTH * 0.5;

// CACHED GLOBAL PROPERTIES
var W_BEAMS = [];
var SPECIAL = null;


d3.csv('data.csv', function(error, data) {
  if (error) throw error;

  var beams = d3.nest()
    .key(function(d){ return d.AISC_Manual_Label.split('X')[0]; })
    .entries(data)

  W_BEAMS = beams.filter(getWSections);
  W_BEAMS.forEach(calculateProperties);
  SPECIAL = calculateSpecialProperties(W_BEAMS, {});

  initializeMomentChart();
});

function getWSections (data){
  return (data.key.slice(0,1) === 'W') && (data.key.slice(0,2) !== 'WT');
}

function filterBeams (d){
  if (USER_WEIGHT){
    if (+d.W <= USER_WEIGHT) return 0.4;
    return 0.07;
  }
  return 0.1;
}

function calculateProperties (beamGroup){
  beamGroup.values.forEach(function(bm){
    bm.Mp = DEFAULT_Fy * +bm.Zx; // kip-in
    bm.Lp = 1.76 * +bm.ry * Math.sqrt(DEFAULT_E / DEFAULT_Fy) / 12; // ft. [AISC 16.1-48 (F2-5)]
    var c = 1;                                                 // [AISC 16.1-48 (F2-8a)]
    bm.Lr = 1.95 * +bm.rts * (DEFAULT_E / (0.7 * DEFAULT_Fy))  // ft. [AISC 16.1-48 (F2-6)]
                  * Math.sqrt(+bm.J * c / (+bm.Sx * +bm.ho))
                  * Math.sqrt(1 + Math.sqrt(1 + 6.76 * Math.pow(
                    0.7 * DEFAULT_Fy * +bm.Sx * +bm.ho / (DEFAULT_E * +bm.J * c)
                  , 2))) / 12;
    // Returns Mn
    // Lb expected in feet
    bm.MnFunction = function(Lb){
      if (Lb <= bm.Lp){
        return bm.Mp;
      } else if (bm.Lp < Lb && Lb <= bm.Lr){
        return Math.min(bm.Mp,
          DEFAULT_Cb * (bm.Mp - (bm.Mp - 0.7 * DEFAULT_Fy * +bm.Sx) * (Lb - bm.Lp)/(bm.Lr - bm.Lp))
        );
      } else {
      var Fcr = (DEFAULT_Cb * Math.pow(Math.PI, 2) * DEFAULT_E / Math.pow(Lb*12/+bm.rts, 2)) // kip-in. [AISC 16.1-47 (F2-4)]
                * Math.sqrt(1 + 0.078 * +bm.J * c / (+bm.Sx * +bm.ho) * Math.pow(Lb*12/+bm.rts, 2));
        return Math.min(bm.Mp, Fcr * +bm.Sx);
      }
    }
    bm.MnValues = d3.range(0, MAX_UNBRACED, UNBRACED_STEP).map(function(length){
      return { length: length, Mn: bm.MnFunction(length)/12 }
    })


  })
}

function updateLength() {
  userLength = +document.getElementById('length-input').value;
  if (START_LENGTH === (userLength - 10)) return;
  START_LENGTH = Math.max(0, userLength - 10);
  endLength = (userLength === 0) ? MAX_UNBRACED : Math.min(MAX_UNBRACED, userLength + 10);

  SPECIAL = calculateSpecialProperties(W_BEAMS, {});

  mUpdateLength();
}

function updateWeight() {
  if (USER_WEIGHT === +document.getElementById('weight-input').value) return;
  USER_WEIGHT = +document.getElementById('weight-input').value;
  SPECIAL = calculateSpecialProperties(W_BEAMS, {});

  mUpdateWeight();
}

function calculateSpecialProperties(beams, options){
  var startLength = START_LENGTH || 0;
  var maxWeight = !!USER_WEIGHT ? Math.max(9, USER_WEIGHT) : Infinity;
  var special = beams.slice().reduce(function(pv, cv){
    var groupMax = cv.values.reduce(function(pv, cv){
      if (+cv.W > maxWeight){
        return pv;
      } else {
        return Math.max(pv, cv.MnFunction(startLength));
      }
    }, 0);

    pv.yMax = Math.max(pv.yMax, groupMax);
    return pv;
  }, {yMax: 0});
  var roundingBuffer = special.yMax * 0.01;
  special.yBound = Math.ceil(special.yMax / 12 / roundingBuffer) * roundingBuffer;
  return special;
}

