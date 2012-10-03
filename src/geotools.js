try{

var geotools = function($) {
	var DEFAULT_PRECISION = 12;
	var BITS = [ 16, 8, 4, 2, 1 ]
	var BASE32_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
	var BASE32_DECODE_MAP = {};
	for ( i = 0; i < BASE32_CHARS.length; i++) {
		BASE32_DECODE_MAP[BASE32_CHARS[i]] = i;
	}
	
	
	$.decode = function(geohash) {
        var lat_interval = [ -90.0, 90.0 ];
        var lon_interval = [ -180.0, 180.0 ];

        var is_even = true;
        
        for (var i=0; i < geohash.length; i++) {
        	var currentChar = BASE32_DECODE_MAP[geohash[i]];
            for (var z = 0; z < BITS.length; z++) {
            	var mask = BITS[z];
                if (is_even) {
                    if ((currentChar & mask) != 0) {
                        lon_interval[0] = (lon_interval[0] + lon_interval[1]) / 2;
                    } else {
                        lon_interval[1] = (lon_interval[0] + lon_interval[1]) / 2;
                    }

                } else {
                    if ((currentChar & mask) != 0) {
                        lat_interval[0] = (lat_interval[0] + lat_interval[1]) / 2;
                    } else {
                        lat_interval[1] = (lat_interval[0] + lat_interval[1]) / 2;
                    }
                }
                is_even = is_even ? false : true;
            }
        };
        var latitude = (lat_interval[0] + lat_interval[1]) / 2;
        var longitude = (lon_interval[0] + lon_interval[1]) / 2;

        return [ latitude, longitude ];
	};

	$.encode = function(latitude, longitude, length) {
		if(!length) length=DEFAULT_PRECISION;
		
		if (length < 1 || length > 12) {
            throw new Error("length must be between 1 and 12");
        }
        
        var latInterval = [ -90.0, 90.0 ];
        var lonInterval = [ -180.0, 180.0 ];
        
        var geohash='';
        var isEven=true;
        
        var bit=0;
        var ch=0;
        
        while(geohash.length < length) {
        	var mid=0.0;
        	if(isEven) {
        		mid = (lonInterval[0] + lonInterval[1]) / 2;
                if (longitude > mid) {
                    ch |= BITS[bit];
                    lonInterval[0] = mid;
                } else {
                    lonInterval[1] = mid;
                }
        	} else {
                mid = (latInterval[0] + latInterval[1]) / 2;
                if (latitude > mid) {
                    ch |= BITS[bit];
                    latInterval[0] = mid;
                } else {
                    latInterval[1] = mid;
                }        		
        	}
            isEven = isEven ? false : true;

            if (bit < 4) {
                bit++;
            } else {
                geohash += BASE32_CHARS[ch];
                bit = 0;
                ch = 0;
            }
        	
        }
		return geohash;
	}
	
	    /**
     * @param geohash
     * @return double array representing the bounding box for the geohash of
     *         [nort latitude, south latitude, east longitude, west longitude]
     */
    $.decode_bbox = function(geohash) {
        var lat_interval = [ -90.0, 90.0 ];
        var lon_interval = [ -180.0, 180.0 ];

        var is_even = true;
        
        for (var i=0; i < geohash.length; i++) {
        	var currentChar = BASE32_DECODE_MAP[geohash[i]];
            for (var z = 0; z < BITS.length; z++) {
            	var mask = BITS[z];
                if (is_even) {
                    if ((currentChar & mask) != 0) {
                        lon_interval[0] = (lon_interval[0] + lon_interval[1]) / 2;
                    } else {
                        lon_interval[1] = (lon_interval[0] + lon_interval[1]) / 2;
                    }

                } else {
                    if ((currentChar & mask) != 0) {
                        lat_interval[0] = (lat_interval[0] + lat_interval[1]) / 2;
                    } else {
                        lat_interval[1] = (lat_interval[0] + lat_interval[1]) / 2;
                    }
                }
                is_even = is_even ? false : true;
            }
        };
        var latitude = (lat_interval[0] + lat_interval[1]) / 2;
        var longitude = (lon_interval[0] + lon_interval[1]) / 2;

        return [lat_interval[0], lat_interval[1],
                lon_interval[0], lon_interval[1] ];
	};

	$.bboxForPolygon = function(polygonPoints) {
        var minLat = 91;
        var minLon = 181;
        var maxLat = -91;
        var maxLon = -181;
        
        for (var i = 0; i < polygonPoints.length; i++) {
            minLat = Math.min(minLat, polygonPoints[i][0]);
            minLon = Math.min(minLon, polygonPoints[i][1]);
            maxLat = Math.max(maxLat, polygonPoints[i][0]);
            maxLon = Math.max(maxLon, polygonPoints[i][1]);
        }

        return [ minLat, maxLat, minLon, maxLon ];
	};

	return $;
}(geotools || {});

var isCommonJS = typeof window == "undefined";
if (isCommonJS)
	exports.geotools = geotools;


} catch(e) { alert(e); }
