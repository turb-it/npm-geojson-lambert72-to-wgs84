#!/usr/bin/env node
const [,,...args] = process.argv
const  inputFile = args[0];
let pointIndex = inputFile.lastIndexOf('.')
const  outputFile = inputFile.substring(0,pointIndex)+'_processed'+inputFile.substring(pointIndex);

console.log('\r');
console.log('\r');
console.log(`geojson-lambert72-to-wgs84 will process your file`);
console.log(`Results will be stored in the same folder`);
console.log('\r');

//var json = require("/Users/guillaumelancrenon/Downloads/secteurs_premier_depart_sdis91.geojson");
//var json = require("/Users/guillaumelancrenon/Downloads/test.geojson");

const fs = require('fs');
console.log('\r');

try {
    var json = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    //two options: Feature VS FeatureCollection
    if (json.type === 'Feature') {
        let jsonOutput = {};
        jsonOutput = transformFeature(json);
        fs.writeFileSync(outputFile,JSON.stringify(jsonOutput));

        console.log('\r');
        console.log('\r');
        console.log(`Your file is now converted. You can see read the result under ${outputFile}.`);
    }else if (json.type === 'FeatureCollection' && json.features.length > 0) {
        let featuresConverted = [];
        json.features.forEach(function(feature){
           featuresConverted.push( transformFeature(feature) )
        })
        json.features = featuresConverted
        fs.writeFileSync(outputFile,JSON.stringify(json));

        console.log('\r');
        console.log('\r');
        console.log(`Your file is now converted. You can see read the result under ${outputFile}.`);
    }else{
        console.log('\r');
        console.log('\r');
        console.log('Feature or FeatureCollection not recognised in the GeoJSON');
    }
} catch (err) {
    console.log('error detected: ',err.toString().substring(0, 150).replace(/[\r\n\v]/,' ') + '...\r\r')
    console.log('Maybe your geojson is in a wrong format? \rSee http://geojson.org/ for more information about the expected format');
}



console.log('\r');
console.log('\r');



//function definition
function lambert72toWGPS(lambertE, lambertN) {
  var x = lambertE
  var y = lambertN
  var LongRef = 0.076042943,
  nLamb = 0.7716421928,
  aCarre = Math.pow( 6378388, 2 ),
  bLamb = 6378388 * ( 1 - ( 1 / 297 ) ),
  eCarre = ( aCarre - Math.pow( bLamb, 2 ) ) / aCarre,
  KLamb = 11565915.812935,
  eLamb = Math.sqrt( eCarre ),
  eSur2 = eLamb / 2,
  Tan1 = ( x - 150000.01256 ) / ( 5400088.4378 - y ),
  Lambda = LongRef + ( 1 / nLamb ) * ( 0.000142043 + Math.atan( Tan1 ) ),
  RLamb = Math.sqrt( Math.pow( ( x - 150000.01256 ), 2 ) + Math.pow( ( 5400088.4378 - y ), 2 ) ),
  TanZDemi = Math.pow( ( RLamb / KLamb ), ( 1 / nLamb ) ),
  Lati1 = 2 * Math.atan( TanZDemi ),
  Haut = 0,
  eSin, Mult1, Mult2, Mult, LatiN, Diff, lat, lng,
  Lat, Lng, LatWGS84, LngWGS84, DLat, DLng, Dh, dy, dx, dz, da, df, LWa, Rm, Rn,
  LWb, LWf, LWe2, SinLat, SinLng, CoSinLat, CoSinLng, Adb;
do {
  eSin = eLamb * Math.sin( Lati1 );
  Mult1 = 1 - eSin;
  Mult2 = 1 + eSin;
  Mult = Math.pow( ( Mult1 / Mult2 ), ( eLamb / 2 ) );
  LatiN = ( Math.PI / 2 ) - ( 2 * ( Math.atan( TanZDemi * Mult ) ) );
  Diff = LatiN - Lati1;
  Lati1 = LatiN;
} while( Math.abs( Diff ) > 0.0000000277777 );
lat = ( LatiN * 180 ) / Math.PI;
lng = ( Lambda * 180 ) / Math.PI;

  Lat = ( Math.PI / 180 ) * lat;
  Lng = ( Math.PI / 180 ) * lng;

  SinLat = Math.sin( Lat );
  SinLng = Math.sin( Lng );
  CoSinLat = Math.cos( Lat );
  CoSinLng = Math.cos( Lng );

  dx = -125.8;
  dy = 79.9;
  dz = -100.5;
  da = -251.0;
  df = -0.000014192702;

  LWf = 1 / 297;
  LWa = 6378388;
  LWb = ( 1 - LWf ) * LWa;
  LWe2 = ( 2 * LWf ) - ( LWf * LWf );
  Adb = 1 / ( 1 - LWf );

  Rn = LWa / Math.sqrt( 1 - LWe2 * SinLat * SinLat );
  Rm = LWa * ( 1 - LWe2 ) / Math.pow( ( 1 - LWe2 * Lat * Lat ), 1.5 );

  DLat = -dx * SinLat * CoSinLng - dy * SinLat * SinLng + dz * CoSinLat;
  DLat = DLat + da * ( Rn * LWe2 * SinLat * CoSinLat ) / LWa;
  DLat = DLat + df * ( Rm * Adb + Rn / Adb ) * SinLat * CoSinLat;
  DLat = DLat / ( Rm + Haut );

  DLng = ( -dx * SinLng + dy * CoSinLng ) / ( ( Rn + Haut ) * CoSinLat );
  Dh = dx * CoSinLat * CoSinLng + dy * CoSinLat * SinLng + dz * SinLat;
  Dh = Dh - da * LWa / Rn + df * Rn * Lat * Lat / Adb;

  LatWGS84 = ( ( Lat + DLat ) * 180 ) / Math.PI;
  LngWGS84 = ( ( Lng + DLng ) * 180 ) / Math.PI;

    // return {longitude: longitude, latitude: latitude};
    return [LngWGS84,LatWGS84]
}

function transformFeature(json){
      let coord = json.geometry.coordinates;
      //console.log(JSON.stringify(coord).match(/[^\]]*/ || [])[0]);
      let arrayDepth = JSON.stringify(coord).match(/[^\]]*/ || [])[0].match(/\[/g).length;
      let newCoordinates, fileToWrite;
      switch (arrayDepth) {
        case 1:
          console.log('Format type "Point" detected');
          newCoordinates = lambert72toWGPS(coord[0], coord[1])
          fileToWrite = json
          fileToWrite.geometry.coordinates = newCoordinates;
          return fileToWrite;
          break;
        case 2:
          console.log('Format type "LineString" or "MultiPoint" detected');
          newCoordinates = [];
          for (var i = 0; i < coord.length; i++) {
              newCoordinates[i] = lambert72toWGPS(coord[i][0], coord[i][1])
          }
          fileToWrite = json
          fileToWrite.geometry.coordinates = newCoordinates;
          return fileToWrite;
          break;
        case 3:
          console.log('Format type "Polygon" or "MultiLineString" detected');
          newCoordinates = [];
          for (var i = 0; i < coord.length; i++) {
              newCoordinates[i] = []
              for (var j = 0; j < coord[i].length; j++) {
                  newCoordinates[i][j] = lambert72toWGPS(coord[i][j][0], coord[i][j][1])
              }
          }
          fileToWrite = json
          fileToWrite.geometry.coordinates = newCoordinates;
          return fileToWrite;
          break;
          case 4:
            console.log('Format type "MultiPolygon" detected');
            newCoordinates = [];
            for (var i = 0; i < coord.length; i++) {
                newCoordinates[i] = []
                for (var j = 0; j < coord[i].length; j++) {
                    newCoordinates[i][j] = []
                    for (var k = 0; k < coord[i][j].length; k++) {
                        newCoordinates[i][j][k] = lambert72toWGPS(coord[i][j][k][0], coord[i][j][k][1])
                    }
                }
            }
            fileToWrite = json
            fileToWrite.geometry.coordinates = newCoordinates;
            return fileToWrite;
            break;
        default:
          console.log('GeoJSON format not yet supported');
          return {};
      }
}
