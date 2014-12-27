var shapefile 	= require('shapefile'),
	geocolor 	= require('geocolor'),
	shp2stl 	= require('shp2stl'),
	fs 			= require('fs'),
	topojson 	= require('topojson'),
	ogr2ogr 	= require('ogr2ogr'),
	brewer 		= require('colorbrewer');

var fileRoot 	= "SanFranciscoPopulation",
	shpFile 	= fileRoot + ".shp",
	attribute 	= "Pop_psmi",
	numBreaks 	= 9,
	colorScheme = "YlOrRd";

//NAD_1983_StatePlane_California_III_FIPS_0403_Feet
var sourceProjection = "+proj=lcc +lat_1=37.06666666666667 +lat_2=38.43333333333333 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000 +y_0=500000.0000000002 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 no_defs";


shapefile.read(shpFile, function(err, geojson) {
	ogr2ogr(geojson)
		//let's get the geojson and topojson into WGS84 (simple lat/lng coords) since that's what 
		//most web maps are expecting
		.project("CRS:84", sourceProjection)
		.exec(function (err, geojson) {
			//color using jenks breaks
	  		geojson = geocolor.jenks(geojson, attribute, numBreaks, brewer[colorScheme][numBreaks], {'stroke-width':.5, 'stoke': 0x777777 })
			
			fs.writeFileSync(fileRoot + ".geojson",  JSON.stringify(geojson));

			//turn into topojson with all feature attributes preserved
			var topology = topojson.topology(geojson.features, {"property-transform": function(feature) { return feature.properties; }});
			
			fs.writeFileSync(fileRoot + ".topojson", JSON.stringify(topology));
		});
});

shp2stl.shp2stl(shpFile, 
	{
		width: 100, //in STL arbitrary units, but typically 3D printers use mm
		height: 40,
		extrudeBy: attribute,
		sourceSRS: sourceProjection,
		//Google Mercator projection, since most people are used to seeing the 
		//world like this now, for better or worse
		destSRS: 'EPSG:900913' 
	},
	function(err, stl) {
		fs.writeFileSync(fileRoot + '.stl',  stl);
	}
);
