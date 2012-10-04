var geotools = function($) {
    var DEFAULT_PRECISION = 12;
    var BITS = [16, 8, 4, 2, 1];
    var BASE32_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    var BASE32_DECODE_MAP = {};
    for ( i = 0; i < BASE32_CHARS.length; i++) {
        BASE32_DECODE_MAP[BASE32_CHARS[i]] = i;
    };

    $.decode = function(geohash) {
        var lat_interval = [-90.0, 90.0];
        var lon_interval = [-180.0, 180.0];

        var is_even = true;

        for (var i = 0; i < geohash.length; i++) {
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

        return [latitude, longitude];
    };

    /**
     * @param geohash
     * @return var array representing the bounding box for the geohash of
     *         [nort latitude, south latitude, east longitude, west longitude]
     */
    $.decode_bbox = function(geohash) {
        var lat_interval = [-90.0, 90.0];
        var lon_interval = [-180.0, 180.0];

        var is_even = true;

        for (var i = 0; i < geohash.length; i++) {
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

        return [lat_interval[0], lat_interval[1], lon_interval[0], lon_interval[1]];
    };

    $.encode = function(latitude, longitude, length) {
        if (!length)
            length = DEFAULT_PRECISION;

        if (length < 1 || length > 12) {
            throw new Error("length must be between 1 and 12");
        }

        var latInterval = [-90.0, 90.0];
        var lonInterval = [-180.0, 180.0];

        var geohash = '';
        var isEven = true;

        var bit = 0;
        var ch = 0;

        while (geohash.length < length) {
            var mid = 0.0;
            if (isEven) {
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
    };

    /**
     * @return the geo hash of the same length directly north of the bounding
     *         box.
     */
    $.north = function(geoHash) {
        var bbox = $.decode_bbox(geoHash);
        var latDiff = bbox[1] - bbox[0];
        var lat = bbox[0] - latDiff / 2;
        var lon = (bbox[2] + bbox[3]) / 2;
        return $.encode(lat, lon, geoHash.length);
    };

    /**
     * @return the geo hash of the same length directly south of the bounding
     *         box.
     */
    $.south = function(geoHash) {
        var bbox = $.decode_bbox(geoHash);
        var latDiff = bbox[1] - bbox[0];
        var lat = bbox[1] + latDiff / 2;
        var lon = (bbox[2] + bbox[3]) / 2;
        return $.encode(lat, lon, geoHash.length);
    };

    /**
     * @return the geo hash of the same length directly west of the bounding
     *         box.
     */
    $.west = function(geoHash) {
        var bbox = $.decode_bbox(geoHash);
        var lonDiff = bbox[3] - bbox[2];
        var lat = (bbox[0] + bbox[1]) / 2;
        var lon = bbox[2] - lonDiff / 2;
        if (lon < -180) {
            lon = 180 - (lon + 180);
        }

        return $.encode(lat, lon, geoHash.length);
    };

    /**
     * @return the geo hash of the same length directly east of the bounding
     *         box.
     */
    $.east = function(geoHash) {
        var bbox = $.decode_bbox(geoHash);
        var lonDiff = bbox[3] - bbox[2];
        var lat = (bbox[0] + bbox[1]) / 2;
        var lon = bbox[3] + lonDiff / 2;

        if (lon > 180) {
            lon = -180 + (lon - 180);
        }

        return $.encode(lat, lon, geoHash.length);
    };

    /**
     * @param geoHash
     * @param latitude
     * @param longitude
     * @return true if the coordinate is contained by the bounding box for this
     *         geo hash
     */
    $.geohashContains = function(geoHash, latitude, longitude) {
        return $.bboxContains($.decode_bbox(geoHash), latitude, longitude);
    };

    /**
     * Return the 32 geo hashes this geohash can be divided into.
     *
     * They are returned alpabetically sorted but in the real world they follow
     * this pattern:
     *
     * <pre>
     * u33dbfc0 u33dbfc2 | u33dbfc8 u33dbfcb
     * u33dbfc1 u33dbfc3 | u33dbfc9 u33dbfcc
     * -------------------------------------
     * u33dbfc4 u33dbfc6 | u33dbfcd u33dbfcf
     * u33dbfc5 u33dbfc7 | u33dbfce u33dbfcg
     * -------------------------------------
     * u33dbfch u33dbfck | u33dbfcs u33dbfcu
     * u33dbfcj u33dbfcm | u33dbfct u33dbfcv
     * -------------------------------------
     * u33dbfcn u33dbfcq | u33dbfcw u33dbfcy
     * u33dbfcp u33dbfcr | u33dbfcx u33dbfcz
     * </pre>
     *
     * the first 4 share the north east 1/8th the first 8 share the north east
     * 1/4th the first 16 share the north 1/2 and so on.
     *
     * They are ordered as follows:
     *
     * <pre>
     *  0  2  8 10
     *  1  3  9 11
     *  4  6 12 14
     *  5  7 13 15
     * 16 18 24 26
     * 17 19 25 27
     * 20 22 28 30
     * 21 23 29 31
     * </pre>
     *
     * Some useful properties: Anything ending with
     *
     * <pre>
     * 0-g = N
     * h-z = S
     *
     * 0-7 = NW
     * 8-g = NE
     * h-r = SW
     * s-z = SE
     * </pre>
     *
     * @param geoHash
     * @return String array with the geo hashes.
     */
    $.subHashes = function(geoHash) {
        var list = [];
        for (var i = 0; i < BASE32_CHARS.length; i++) {
            list[i] = geoHash + BASE32_CHARS[i];
        }
        return list;
    };

    /**
     * @param geoHash
     * @return the 16 northern sub hashes of the geo hash
     */
    $.subHashesN = function(geoHash) {
        var list = [];
        var n = 0;
        for (var i in BASE32_CHARS) {
            var c = BASE32_CHARS[i];
            if (c >= '0' && c <= 'g') {
                list[n] = geoHash + c;
                n++;
            }
        }
        return list;
    };

    /**
     * @param geoHash
     * @return the 16 southern sub hashes of the geo hash
     */
    $.subHashesS = function(geoHash) {
        var list = [];
        var n = 0;
        for (var i in BASE32_CHARS) {
            var c = BASE32_CHARS[i];
            if (c >= 'h' && c <= 'z') {
                list[n] = geoHash + c;
                n++;
            }
        }
        return list;
    };

    /**
     * @param geoHash
     * @return the 8 north-west sub hashes of the geo hash
     */
    $.subHashesNW = function(geoHash) {
        var list = [];
        var n = 0;
        for (var i in BASE32_CHARS) {
            var c = BASE32_CHARS[i];
            if (c >= '0' && c <= '7') {
                list[n] = geoHash + c;
                n++;
            }
        }
        return list;
    };

    /**
     * @param geoHash
     * @return the 8 north-east sub hashes of the geo hash
     */
    $.subHashesNE = function(geoHash) {
        var list = [];
        var n = 0;
        for (var i in BASE32_CHARS) {
            var c = BASE32_CHARS[i];
            if (c >= '8' && c <= 'g') {
                list[n] = geoHash + c;
                n++;
            }
        }
        return list;
    };

    /**
     * @param geoHash
     * @return the 8 south-west sub hashes of the geo hash
     */
    $.subHashesSW = function(geoHash) {
        var list = [];
        var n = 0;
        for (var i in BASE32_CHARS) {
            var c = BASE32_CHARS[i];
            if (c >= 'h' && c <= 'r') {
                list[n] = geoHash + c;
                n++;
            }
        }
        return list;
    };

    /**
     * Cover the polygon with geo hashes. This is useful for indexing mainly.
     *
     * @param maxLength
     *            maximum length of the geoHash; the more you specify, the more
     *            expensive it gets
     * @param polygonPoints
     *            polygonPoints points that make up the polygon as arrays of
     *            [latitude,longitude]
     * @return a set of geo hashes that cover the polygon area.
     */
    $.getGeoHashesForPolygon = function(polygonPoints, maxLength) {
        if (maxLength < 2 || maxLength >= DEFAULT_PRECISION) {
            throw new Error("maxLength should be between 2 and " + DEFAULT_PRECISION + " was " + maxLength);
        }

        var bbox = $.bboxForPolygon(polygonPoints);
        // first lets figure out an appropriate geohash length
        var diagonal = $.distance(bbox[0], bbox[2], bbox[1], bbox[3]);
        var hashLength = $.getSuitableHashLength(diagonal, bbox[0], bbox[2]);

        var partiallyContained = [];
        // now lets generate all geohashes for the containing bounding box
        // lets start at the top left:

        var rowHash = $.encode(bbox[0], bbox[2], hashLength);
        var rowBox = $.decode_bbox(rowHash);
        while (rowBox[0] < bbox[1]) {
            var columnHash = rowHash;
            var columnBox = rowBox;

            while ($.isWest(columnBox[2], bbox[3])) {
                partiallyContained.push(columnHash);
                columnHash = $.east(columnHash);
                columnBox = $.decode_bbox(columnHash);
            }

            // move to the next row
            rowHash = $.south(rowHash);
            rowBox = $.decode_bbox(rowHash);
        }
        var fullyContained = [];

        var detail = hashLength;
        // we're not aiming for perfect detail here in terms of 'pixellation', 6
        // extra chars in the geohash ought to be enough and going beyond 9
        // doesn't serve much purpose.
        while (detail < maxLength) {
            partiallyContained = splitAndFilter(polygonPoints, fullyContained, partiallyContained);
            detail++;
        }
        if (fullyContained.length == 0) {
            fullyContained = fullyContained.concat(partiallyContained);
        }

        return fullyContained;
    }
    function splitAndFilter(polygonPoints, fullyContained, partiallyContained) {
        var stillPartial = [];
        // now we need to break up the partially contained hashes
        for (var i = 0; i < partiallyContained.length; i++) {
            var hash = partiallyContained[i];
            var subHashes = $.subHashes(hash);
            for (var j = 0; j < subHashes.length; j++) {
                var h = subHashes[j];
                var hashBbox = $.decode_bbox(h);
                var nw = $.polygonContains(polygonPoints, hashBbox[0], hashBbox[2]);
                var ne = $.polygonContains(polygonPoints, hashBbox[0], hashBbox[3]);
                var sw = $.polygonContains(polygonPoints, hashBbox[1], hashBbox[2]);
                var se = $.polygonContains(polygonPoints, hashBbox[1], hashBbox[3]);
                if (nw && ne && sw && se) {
                    fullyContained.push(h);
                } else if (nw || ne || sw || se) {
                    stillPartial.push(h);
                } else {
                    var last = polygonPoints[0];
                    for (var k = 1; k < polygonPoints.length; k++) {
                        var current = polygonPoints[k];
                        if ($.linesCross(hashBbox[0], hashBbox[2], hashBbox[0], hashBbox[3], last[0], last[1], current[0], current[1])) {
                            stillPartial.push(h);
                            break;
                        } else if ($.linesCross(hashBbox[0], hashBbox[3], hashBbox[1], hashBbox[3], last[0], last[1], current[0], current[1])) {
                            stillPartial.push(h);
                            break;
                        } else if ($.linesCross(hashBbox[1], hashBbox[3], hashBbox[1], hashBbox[2], last[0], last[1], current[0], current[1])) {
                            stillPartial.push(h);
                            break;
                        } else if ($.linesCross(hashBbox[1], hashBbox[2], hashBbox[0], hashBbox[2], last[0], last[1], current[0], current[1])) {
                            stillPartial.push(h);
                            break;
                        }
                    }
                }
            }
        }
        return stillPartial;
    }

    /**
     * @param granularityInMeters
     * @param latitude
     * @param longitude
     * @return the largest hash length where the hash bbox has a width < granularityInMeters.
     */
    $.getSuitableHashLength = function(granularityInMeters, latitude, longitude) {
        if (granularityInMeters < 5) {
            return 10;
        }
        var hash = $.encode(latitude, longitude);
        var width = 0;
        var length = hash.length;
        // the height is the same at for any latitude given a length, but the width converges towards the poles
        while (width < granularityInMeters && hash.length >= 2) {
            length = hash.length;
            var bbox = $.decode_bbox(hash);
            width = $.distance(bbox[0], bbox[2], bbox[0], bbox[3]);
            hash = hash.slice(0, hash.length - 1);
        }

        return Math.min(length + 1, DEFAULT_PRECISION);
    }
    /**
     * @param width
     * @param lat1
     * @param lon1
     * @param lat2
     * @param lon2
     * @return set of geo hashes along the line with the specified geo hash
     *         length.
     */
    $.geoHashesForLine = function(width, lat1, lon1, lat2, lon2) {
        if (lat1 == lat2 && lon1 == lon2) {
            throw new error("identical begin and end coordinate: line must have two different points");
        }

        var hashLength = $.getSuitableHashLength(width, lat1, lon1);

        var result1 = encodeWithBbox(lat1, lon1, hashLength);
        var bbox1 = result1[1];

        var result2 = encodeWithBbox(lat2, lon2, hashLength);
        var bbox2 = result2[1];

        if (result1[0] == result2[0]) {// same geohash for begin and end
            return [result1[0]];
        } else if (lat1 != lat2) {
            return $.getGeoHashesForPolygon([[bbox1[0], bbox1[2]], [bbox1[1], bbox1[2]], [bbox2[1], bbox2[3]], [bbox2[0], bbox2[3]]], hashLength);
        } else {
            return $.getGeoHashesForPolygon([[bbox1[0], bbox1[2]], [bbox1[0], bbox1[3]], [bbox2[1], bbox2[2]], [bbox2[1], bbox2[3]]], hashLength);
        }
    }
    function encodeWithBbox(latitude, longitude, length) {
        if (length < 1 || length > 12) {
            throw new Error("length must be between 1 and 12");
        }
        var latInterval = [-90.0, 90.0];
        var lonInterval = [-180.0, 180.0];

        var geohash = '';
        var is_even = true;
        var bit = 0, ch = 0;

        while (geohash.length < length) {
            var mid = 0.0;
            if (is_even) {
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

            is_even = is_even ? false : true;

            if (bit < 4) {
                bit++;
            } else {
                geohash += BASE32_CHARS[ch];
                bit = 0;
                ch = 0;
            }
        }
        return [geohash.toString(), [latInterval[0], latInterval[1], lonInterval[0], lonInterval[1]]];
    }


    $.geoHashesForCircle = function(length, latitude, longitude, radius) {
        // bit of a wet finger approach here: it doesn't make much sense to have
        // lots of segments unless we have a long geohash or a large radius
        var segments;
        var suitableHashLength = $.getSuitableHashLength(radius, latitude, longitude);
        if (length > suitableHashLength - 3) {
            segments = 200;
        } else if (length > suitableHashLength - 2) {
            segments = 100;
        } else if (length > suitableHashLength - 1) {
            segments = 50;
        } else {
            // we don't seem to care about detail
            segments = 15;
        }

        var circle2polygon = $.circle2polygon(segments, latitude, longitude, radius);
        return $.getGeoHashesForPolygon(circle2polygon, length);
    }
    /**
     * @param geoHash
     * @return the 8 south-east sub hashes of the geo hash
     */
    $.subHashesSE = function(geoHash) {
        var list = [];
        var n = 0;
        for (var i in BASE32_CHARS) {
            var c = BASE32_CHARS[i];
            if (c >= 's' && c <= 'z') {
                list[n] = geoHash + c;
                n++;
            }
        }
        return list;
    };

    $.isWest = function(l1, l2) {
        var ll1 = l1 + 180;
        var ll2 = l2 + 180;
        if (ll1 < ll2 && ll2 - ll1 < 180) {
            return true;
        } else if (ll1 > ll2 && ll2 + 360 - ll1 < 180) {
            return true;
        } else {
            return false;
        }
    };

    $.isEast = function(l1, l2) {
        var ll1 = l1 + 180;
        var ll2 = l2 + 180;
        if (ll1 > ll2 && ll1 - ll2 < 180) {
            return true;
        } else if (ll1 < ll2 && ll1 + 360 - ll2 < 180) {
            return true;
        } else {
            return false;
        }
    };

    $.isNorth = function(l1, l2) {
        return l1 > l2;
    };

    $.isSouth = function(l1, l2) {
        return l1 < l2;
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

        return [minLat, maxLat, minLon, maxLon];
    };

    /**
     * @param bbox
     *            var array of [minLat,maxLat,minLon,maxLon}
     * @param latitude
     * @param longitude
     * @return true if the latitude and longitude are contained in the bbox
     */
    $.bboxContains = function(bbox, latitude, longitude) {
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
    $.polygonContains = function(polygonPoints, latitude, longitude) {

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
     * var.
     *
     * @param d
     * @param decimals
     * @return d rounded to the specified precision
     */
    $.roundToDecimals = function(d, decimals) {
        if (decimals > 17) {
            throw new Error("this probably doesn't do what you want; makes sense only for <= 17 decimals");
        }
        var factor = Math.pow(10, decimals);
        return Math.round(d * factor) / factor;
    };

    $.linesCross = function(x1, y1, x2, y2, u1, v1, u2, v2) {
        // formula for line: y= a+bx

        // vertical lines result in a divide by 0;
        var line1Vertical = x2 == x1;
        var line2Vertical = u2 == u1;
        if (line1Vertical && line2Vertical) {
            // x=a
            if (x1 == u1) {
                // lines are the same
                return y1 <= v1 && v1 < y2 || y1 <= v2 && v2 < y2;
            } else {
                // parallel -> they don't intersect!
                return false;
            }
        } else if (line1Vertical && !line2Vertical) {
            var b2 = (v2 - v1) / (u2 - u1);
            var a2 = v1 - b2 * u1;

            var xi = x1;
            var yi = a2 + b2 * xi;

            return yi >= y1 && yi <= y2;

        } else if (!line1Vertical && line2Vertical) {
            var b1 = (y2 - y1) / (x2 - x1);
            var a1 = y1 - b1 * x1;

            var xi = u1;
            var yi = a1 + b1 * xi;

            return yi >= v1 && yi <= v2;
        } else {

            var b1 = (y2 - y1) / (x2 - x1);
            // divide by zero if second line vertical
            var b2 = (v2 - v1) / (u2 - u1);

            var a1 = y1 - b1 * x1;
            var a2 = v1 - b2 * u1;

            if (b1 - b2 == 0) {
                if (a1 == a2) {
                    // lines are the same
                    return x1 <= u1 && u1 < x2 || x1 <= u2 && u2 < x2;
                } else {
                    // parallel -> they don't intersect!
                    return false;
                }
            }
            // calculate intersection point xi,yi
            var xi = -(a1 - a2) / (b1 - b2);
            var yi = a1 + b1 * xi;
            if ((x1 - xi) * (xi - x2) >= 0 && (u1 - xi) * (xi - u2) >= 0 && (y1 - yi) * (yi - y2) >= 0 && (v1 - yi) * (yi - v2) >= 0) {
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
    };

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
    $.translateLongitude = function(latitude, longitude, meters) {
        return [latitude, longitude + meters / lengthOfLongitudeDegreeAtLatitude(latitude)];
    };

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
    $.translateLatitude = function(latitude, longitude, meters) {
        return [latitude + meters / DEGREE_LATITUDE_METERS, longitude];
    };

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
    $.translate = function(latitude, longitude, lateralMeters, longitudalMeters) {
        var longitudal = $.translateLongitude(latitude, longitude, longitudalMeters);
        return $.translateLatitude(latitude, longitudal[1], lateralMeters);
    };

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
    $.distance = function(lat1, long1, lat2, long2) {
        var deltaLat = toRadians(lat2 - lat1);
        var deltaLon = toRadians(long2 - long1);

        var a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        var c = 2 * Math.asin(Math.sqrt(a));

        return EARTH_RADIUS * c;
    };

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
    $.getPolygonCenter = function(polygonPoints) {
        var cumLat = 0;
        var cumLon = 0;
        for (var coordinate in polygonPoints) {
            cumLat += coordinate[0];
            cumLon += coordinate[1];
        }
        return [cumLat / polygonPoints.length, cumLon / polygonPoints.length];
    };

    $.bbox2polygon = function(bbox) {
        return [[bbox[0], bbox[2]], [bbox[1], bbox[2]], [bbox[1], bbox[3]], [bbox[0], bbox[3]]];
    };

    /**
     * Converts a circle to a polygon.
     *
     * This method does not behave very well very close to the poles because the math gets a little funny there.
     *
     * @param segments
     *            number of segments the polygon should have. The higher this
     *            number, the better of an approximation the polygon is for the
     *            circle.
     * @param latitude
     * @param longitude
     * @param radius
     * @return an array of the points [latitude,longitude] that make up the
     *         polygon.
     */
    $.circle2polygon = function(segments, latitude, longitude, radius) {
        if (segments < 5) {
            throw new Error("you need a minimum of 5 segments");
        }
        // for n segments you need n+1 points
        var points = [];

        var relativeLatitude = radius / EARTH_RADIUS_METERS * 180 / Math.PI;

        // things get funny near the north and south pole, so doing a modulo 90
        // to ensure that the relative amount of degrees doesn't get too crazy.
        var relativeLongitude = relativeLatitude / Math.cos(toRadians(latitude)) % 90;

        for (var i = 0; i < segments; i++) {
            // radians go from 0 to 2*PI; we want to divide the circle in nice
            // segments
            var theta = 2 * Math.PI * i / segments;
            // trying to avoid theta being exact factors of pi because that results in some funny behavior around the north-pole
            theta = theta += 0.1;
            if (theta >= 2 * Math.PI) {
                theta = theta - 2 * Math.PI;
            }

            // on the unit circle, any point of the circle has the coordinate
            // cos(t),sin(t) where t is the radian. So, all we need to do that
            // is multiply that with the relative latitude and longitude
            // note, latitude takes the role of y, not x. By convention we
            // always note latitude, longitude instead of the other way around
            var latOnCircle = latitude + relativeLatitude * Math.sin(theta);
            var lonOnCircle = longitude + relativeLongitude * Math.cos(theta);
            if (lonOnCircle > 180) {
                lonOnCircle = -180 + (lonOnCircle - 180);
            } else if (lonOnCircle < -180) {
                lonOnCircle = 180 - (lonOnCircle + 180);
            }

            if (latOnCircle > 90) {
                latOnCircle = 90 - (latOnCircle - 90);
            } else if (latOnCircle < -90) {
                latOnCircle = -90 - (latOnCircle + 90);
            }

            points[i] = [latOnCircle, lonOnCircle];
        }

        return points;
    };

    $.getPolygonForPoints = function(points) {
        if (points.length < 3) {
            throw new Error("need at least 3 pois for a cluster");
        }
        var xSorted = points.slice();
        xSorted.sort(function(p1, p2) {
            if (p1[0] == p2[0]) {
                return p1[1] - p2[1];
            } else {
                return p1[0] - p2[0];
            }

        });

        var n = xSorted.length;

        var lUpper = [];

        lUpper[0] = xSorted[0];
        lUpper[1] = xSorted[1];

        var lUpperSize = 2;
        for (var i = 2; i < n; i++) {
            lUpper[lUpperSize] = xSorted[i];
            lUpperSize++;
            while (lUpperSize > 2 && !rightTurn(lUpper[lUpperSize - 3], lUpper[lUpperSize - 2], lUpper[lUpperSize - 1])) {
                // Remove the middle point of the three last
                lUpper[lUpperSize - 2] = lUpper[lUpperSize - 1];
                lUpperSize--;
            }
        }

        var lLower = [];

        lLower[0] = xSorted[n - 1];
        lLower[1] = xSorted[n - 2];

        var lLowerSize = 2;

        for (var i = n - 3; i >= 0; i--) {
            lLower[lLowerSize] = xSorted[i];
            lLowerSize++;

            while (lLowerSize > 2 && !rightTurn(lLower[lLowerSize - 3], lLower[lLowerSize - 2], lLower[lLowerSize - 1])) {
                // Remove the middle point of the three last
                lLower[lLowerSize - 2] = lLower[lLowerSize - 1];
                lLowerSize--;
            }
        }

        var result = [];
        var idx = 0;
        for (var i = 0; i < lUpperSize; i++) {
            result[idx] = (lUpper[i]);
            idx++;
        }

        for (var i = 1; i < lLowerSize - 1; i++) {
            result[idx] = (lLower[i]);
            idx++;
        }

        return result;
    };

    function rightTurn(a, b, c) {
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0;
    };

    /**
     * @param direction n,s,e,w
     * @param degrees
     * @param minutes
     * @param seconds
     * @return decimal degree
     */
    $.toDecimalDegree = function(direction, degrees, minutes, seconds) {
        var factor = 1;
        if (direction && (direction.toLowerCase()[0] == "w" || direction.toLowerCase()[direction.length - 1] == "s")) {
            factor = -1;
        }
        return (degrees + minutes / 60 + seconds / 60 / 60) * factor;
    };

    return $;

}(geotools || {});

var isCommonJS = typeof window == "undefined";
if (isCommonJS)
    exports.geotools = geotools;
