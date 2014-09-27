var shapefile 	= require('shapefile'),
	geocolor 	= require('geocolor'),
	shp2stl 	= require('shp2stl'),
	fs 			= require('fs'),
	topojson 	= require('topojson'),
	ogr2ogr 	= require('ogr2ogr'),
	brewer 		= require('colorbrewer');

var fileRoot 	= "pgv",
	shpFile 	= fileRoot + ".shp",
	attribute 	= "VALUE",
	numBreaks 	= 9,
	colorScheme = "YlOrRd";

var sourceProjection = fileRoot + ".prj";

var filterFunction = function(feature) {
	return feature.properties[attribute] >= 6;
}

shapefile.read(shpFile, function(err, geojson) {
	ogr2ogr(geojson)
		//let's get the geojson and topojson into WGS84 (simple lat/lng coords) since that's what 
		//most web maps are expecting
		.project("CRS:84", sourceProjection)
		.exec(function (err, geojson) {
			geojson.features = geojson.features.filter(filterFunction);

			//color using jenks breaks
	  		geojson = geocolor.jenks(geojson, attribute, numBreaks, brewer[colorScheme][numBreaks], {'stroke-width':.3})
			
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

		filterFunction: filterFunction,

		//Google Mercator projection, since most people are used to seeing the 
		//world like this now, for better or worse
		destSRS: 'EPSG:900913' 
	},
	function(err, stl) {
		fs.writeFileSync(fileRoot + '.stl',  stl);
	}
);
