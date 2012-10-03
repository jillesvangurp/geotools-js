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

    /**
     * @param bbox
     *            double array of [minLat,maxLat,minLon,maxLon}
     * @param latitude
     * @param longitude
     * @return true if the latitude and longitude are contained in the bbox
     */
    $.bboxContains=function(bbox, latitude, longitude) {
        return bbox[0] <= latitude && latitude <= bbox[1] && bbox[2] <= longitude && longitude <= bbox[3];
    };
    
        /**
     * Determine whether a point is contained in a polygon. Note, technically
     * the points that make up the polygon are not contained by it.
     *
     * @param latitude
     * @param longitude
     * @param polygonPoints
     *            polygonPoints points that make up the polygon as arrays of
     *            [latitude,longitude]
     * @return true if the polygon contains the coordinate
     */
    $.polygonContains=function(polygonPoints, latitude, longitude) {

        if (polygonPoints.length <= 2) {
            throw new Error("a polygon must have at least three points");
        }

        var bbox = $.bboxForPolygon(polygonPoints);
        if (!$.bboxContains(bbox, latitude, longitude)) {
            // outside the containing bbox
            return false;
        }

        var hits = 0;

        var lastLatitude = polygonPoints[polygonPoints.length - 1][0];
        var lastLongitude = polygonPoints[polygonPoints.length - 1][1];
        var currentLatitude, currentLongitude;

        // Walk the edges of the polygon
        for (var i = 0; i < polygonPoints.length; lastLatitude = currentLatitude, lastLongitude = currentLongitude, i++) {
            currentLatitude = polygonPoints[i][0];
            currentLongitude = polygonPoints[i][1];

            if (currentLongitude == lastLongitude) {
                continue;
            }

            var leftLatitude;
            if (currentLatitude < lastLatitude) {
                if (latitude >= lastLatitude) {
                    continue;
                }
                leftLatitude = currentLatitude;
            } else {
                if (latitude >= currentLatitude) {
                    continue;
                }
                leftLatitude = lastLatitude;
            }

            var test1, test2;
            if (currentLongitude < lastLongitude) {
                if (longitude < currentLongitude || longitude >= lastLongitude) {
                    continue;
                }
                if (latitude < leftLatitude) {
                    hits++;
                    continue;
                }
                test1 = latitude - currentLatitude;
                test2 = longitude - currentLongitude;
            } else {
                if (longitude < lastLongitude || longitude >= currentLongitude) {
                    continue;
                }
                if (latitude < leftLatitude) {
                    hits++;
                    continue;
                }
                test1 = latitude - lastLatitude;
                test2 = longitude - lastLongitude;
            }

            if (test1 < test2 / (lastLongitude - currentLongitude) * (lastLatitude - currentLatitude)) {
                hits++;
            }
        }

        return (hits & 1) != 0;
    };
    
        /**
     * Simple rounding method that allows you to get rid of some decimals in a
     * double.
     *
     * @param d
     * @param decimals
     * @return d rounded to the specified precision
     */
   $.roundToDecimals=function(d, decimals) {
        if (decimals > 17) {
            throw new Error(
                    "this probably doesn't do what you want; makes sense only for <= 17 decimals");
        }
        var factor = Math.pow(10, decimals);
        return Math.round(d * factor) / factor;
    };
    

	$.linesCross=function(x1, y1, x2, y2, u1, v1, u2, v2) {
        // formula for line: y= a+bx

        // vertical lines result in a divide by 0;
        var line1Vertical = x2 == x1;
        var line2Vertical = u2 == u1;
        if (line1Vertical && line2Vertical) {
            // x=a
            if(x1==u1) {
                // lines are the same
                return y1<=v1 && v1<y2 || y1<=v2 && v2<y2;
            } else {
                // parallel -> they don't intersect!
                return false;
            }
        } else if (line1Vertical && !line2Vertical) {
            var b2 = (v2 - v1) / (u2 - u1);
            var a2 = v1 - b2 * u1;

            var xi=x1;
            var yi=a2+b2*xi;

            return yi>=y1 && yi<=y2;

        } else if (!line1Vertical && line2Vertical) {
            var b1 = (y2 - y1) / (x2 - x1);
            var a1 = y1 - b1 * x1;

            var xi=u1;
            var yi=a1+b1*xi;

            return yi>=v1 && yi<=v2;
        } else {

            var b1 = (y2 - y1) / (x2 - x1);
            // divide by zero if second line vertical
            var b2 = (v2 - v1) / (u2 - u1);

            var a1 = y1 - b1 * x1;
            var a2 = v1 - b2 * u1;

            if (b1 - b2 == 0) {
                if(a1 == a2) {
                    // lines are the same
                    return x1<=u1 && u1<x2 || x1<=u2 && u2<x2;
                } else {
                    // parallel -> they don't intersect!
                    return false;
                }
            }
            // calculate intersection point xi,yi
            var xi = -(a1 - a2) / (b1 - b2);
            var yi = a1 + b1 * xi;
            if ((x1 - xi) * (xi - x2) >= 0 &&
                    (u1 - xi) * (xi - u2) >= 0 &&
                    (y1 - yi) * (yi - y2) >= 0 &&
                    (v1 - yi) * (yi - v2) >= 0) {
                return true;
            } else {
                return false;
            }
        }
    };

    /**
     * Earth's mean radius, in meters.
     *
     * @see http://en.wikipedia.org/wiki/Earth%27s_radius#Mean_radii
     */
    var EARTH_RADIUS = 6371000.0;

    var EARTH_RADIUS_METERS = 6371000.0;
    var EARTH_CIRCUMFERENCE_METERS = EARTH_RADIUS_METERS * Math.PI * 2.0;
    var DEGREE_LATITUDE_METERS = EARTH_RADIUS_METERS * Math.PI / 180.0;

    function toRadians(d) {
        return d / 180 * Math.PI;
    };

    function lengthOfLongitudeDegreeAtLatitude(latitude) {
        var latitudeInRadians = toRadians(latitude);
        return Math.cos(latitudeInRadians) * EARTH_CIRCUMFERENCE_METERS / 360.0;
    }

    /**
     * Translate a point along the longitude for the specified amount of meters.
     * Note, this method assumes the earth is a sphere and the result is not
     * going to be very precise for larger distances.
     *
     * @param latitude
     * @param longitude
     * @param meters
     * @return the translated coordinate.
     */
    $.translateLongitude=function(latitude, longitude, meters) {
        return [ latitude,  longitude + meters / lengthOfLongitudeDegreeAtLatitude(latitude)];
    }

    /**
     * Translate a point along the latitude for the specified amount of meters.
     * Note, this method assumes the earth is a sphere and the result is not
     * going to be very precise for larger distances.
     *
     * @param latitude
     * @param longitude
     * @param meters
     * @return the translated coordinate.
     */
    $.translateLatitude=function(latitude, longitude, meters) {
        return [ latitude + meters / DEGREE_LATITUDE_METERS, longitude ];
    }

    /**
     * Translate a point by the specified meters along the longitude and
     * latitude. Note, this method assumes the earth is a sphere and the result
     * is not going to be very precise for larger distances.
     *
     * @param latitude
     * @param longitude
     * @param lateralMeters
     * @param longitudalMeters
     * @return the translated coordinate.
     */
    $.translate=function(latitude, longitude, lateralMeters, longitudalMeters) {
        var longitudal = $.translateLongitude(latitude, longitude, longitudalMeters);
        return $.translateLatitude(latitude, longitudal[1], lateralMeters);
    }

    /**
     * Compute the Haversine distance between the two coordinates. Haversine is
     * one of several distance calculation algorithms that exist. It is not very
     * precise in the sense that it assumes the earth is a perfect sphere, which
     * it is not. This means precision drops over larger distances. According to
     * http://en.wikipedia.org/wiki/Haversine_formula there is a 0.5% error
     * margin given the 1% difference in curvature between the equator and the
     * poles.
     *
     * @param lat1
     *            the latitude in decimal degrees
     * @param long1
     *            the longitude in decimal degrees
     * @param lat2
     *            the latitude in decimal degrees
     * @param long2
     *            the longitude in decimal degrees
     * @return the distance in meters
     */
    $.distance=function(lat1,long1, lat2, long2) {
        var deltaLat = toRadians(lat2 - lat1);
        var deltaLon = toRadians(long2 - long1);

        var a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(toRadians(lat1))
                * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        var c = 2 * Math.asin(Math.sqrt(a));

        return EARTH_RADIUS * c;
    }

    /**
     * Simple/naive method for calculating the center of a polygon based on
     * averaging the latitude and longitude. Better algorithms exist but this
     * may be good enough for most purposes.
     *
     * Note, for some polygons, this may actually be located outside the
     * polygon.
     *
     * @param polygonPoints
     *            polygonPoints points that make up the polygon as arrays of
     *            [latitude,longitude]
     * @return the average latitude and longitude.
     */
    $.getPolygonCenter=function(polygonPoints) {
        var cumLat = 0;
        var cumLon = 0;
        for (var coordinate in polygonPoints) {
            cumLat += coordinate[0];
            cumLon += coordinate[1];
        }
        return [ cumLat / polygonPoints.length, cumLon / polygonPoints.length ];
    }
    
	return $;

}(geotools || {});

var isCommonJS = typeof window == "undefined";
if (isCommonJS)
	exports.geotools = geotools;
