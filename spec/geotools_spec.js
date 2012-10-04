var testPoints = {
    sydney : [-33.872796, 151.206146],
    buenosaires : [-34.602875, -58.380449],
    newyork : [40.721119, -74.011237],
    amsterdam : [52.372103, 4.894252],
    berlin : [52.527109, 13.385721],
    london : [51.51283, -0.123656],
    brandenBurgerGate : [52.516279, 13.377157],
    potsDammerPlatz : [52.509515, 13.376599],
    moritzPlatz : [52.503663, 13.410717],
    senefelderPlatz : [52.532755, 13.412949],
    naturkundeMuseum : [52.531188, 13.381921],
    rosenthalerPlatz : [52.529948, 13.401361],
    oranienburgerTor : [52.525339, 13.38707]
};

var testPolygon = [testPoints.berlin, testPoints.london, testPoints.buenosaires];

describe("Geohash encode/decode ", function() {

    var decodedGeohashes = [[0.10000004433095455, -0.09999996051192284, "ebpbtdpntc6e"], [52.5308879557997, 13.394904043525457, "u33dbfcyegk2"]];
    var encodedGeohashes = [[0.1, -0.1, "ebpbtdpntc6e"], [52.530888, 13.394904, "u33dbfcyegk2"]];

    it("should decode geohash", function() {
        for (var i = 0; i < decodedGeohashes.length; i++) {
            var latitude = decodedGeohashes[i][0];
            var longitude = decodedGeohashes[i][1];
            var geohash = decodedGeohashes[i][2];
            var point = geotools.decode(geohash);
            expect(point[0]).toBe(latitude);
            expect(point[1]).toBe(longitude);
        };
    });

    it("encode should encode geohash", function() {
        for ( i = 0; i < encodedGeohashes.length; i++) {
            var latitude = encodedGeohashes[i][0];
            var longitude = encodedGeohashes[i][1];
            var geohash = encodedGeohashes[i][2];
            expect(geotools.encode(latitude, longitude)).toBe(geohash);
            expect(geotools.encode(latitude, longitude, 5)).toBe(geohash.substring(0, 5));
        };
    });

    it("should reject length > 12", function() {
        expect(function() {
            geotools.encode(1, 2, 13)
        }).toThrow();
    });

    it("should reject length < 1", function() {
        expect(function() {
            geotools.encode(1, 2, -1)
        }).toThrow();
    });
});

describe("Geohash decode_bbox ", function() {
    it("should decode to a bounding box", function() {
        var bbox = geotools.decode_bbox("u33dbfcyegk2");
        expect(bbox[0] < 52.530888);
        expect(bbox[1] > 52.530888);
        expect(bbox[2] < 13.394904);
        expect(bbox[3] > 13.394904);
    });
});

describe("Calculate neighboring geoHashes", function() {
    var hash = geotools.encode(testPoints.brandenBurgerGate[0], testPoints.brandenBurgerGate[1], 5);
    it("should handle east and west", function() {
        var west = geotools.west(hash);
        var east = geotools.east(west);
        expect(west).not.toBe(hash);
        expect(east).toBe(hash);
    });

    it("should handle north and south", function() {
        var north = geotools.north(hash);
        var south = geotools.south(north);
        expect(north).not.toBe(hash);
        expect(south).toBe(hash);
    });
});

describe("geohash contains function", function() {
    it("should contain the point", function() {
        hash = geotools.encode(testPoints.amsterdam[0], testPoints.amsterdam[1], 4);
        expect(geotools.geohashContains(hash, testPoints.amsterdam[0], testPoints.amsterdam[1]));
    });
});

describe("calculate subhashes", function() {
    it("should have 32 subhashes", function() {
        expect(geotools.subHashes('u33dbf').length).toBe(32);
    });

    it("should have 16 subhashes", function() {
        expect(geotools.subHashesN('u33dbf').length).toBe(16);
        expect(geotools.subHashesS('u33dbf').length).toBe(16);
    });

    it("should have 8 subhashes", function() {
        expect(geotools.subHashesNE('u33dbf').length).toBe(8);
        expect(geotools.subHashesNW('u33dbf').length).toBe(8);
        expect(geotools.subHashesSE('u33dbf').length).toBe(8);
        expect(geotools.subHashesSW('u33dbf').length).toBe(8);
    });
});

describe("is east/west/north/south", function() {
    it("should check is east", function() {
        expect(geotools.isEast(50, 40));
        expect(!geotools.isEast(40, 50));
        expect(geotools.isEast(1, 179));
        expect(!geotools.isEast(179, 1));
        expect(!geotools.isEast(4, 4));
    });
    it("should check is west", function() {
        expect(!geotools.isWest(50, 40));
        expect(geotools.isWest(40, 50));
        expect(!geotools.isWest(1, 179));
        expect(geotools.isWest(179, 1));
        expect(!geotools.isWest(4, 4));
    });

    it("should check north/south", function() {
        expect(geotools.isSouth(40, 50));
        expect(geotools.isNorth(60, 50));
        expect(!geotools.isSouth(50, 50));
        expect(!geotools.isNorth(50, 50));
    });
});

describe("Get suitable hashLength", function(){
    it("should return suitable lenth", function() {
        expect(geotools.getSuitableHashLength(200,52,13)).toBe(7);
    });
});

describe("Cover shapes with geohashes", function() {
    it("should cover polygon with geohashes", function() {
        var polygon = geotools.getPolygonForPoints([testPoints.potsDammerPlatz, testPoints.senefelderPlatz, testPoints.naturkundeMuseum]);
        var hashes=geotools.getGeoHashesForPolygon(polygon,7);
        expect(hashes.length).toBeGreaterThan(5);
        console.log(JSON.stringify(hashes));
    });

    it("should cover line with geohashes", function() {
        var hashes = geotools.geoHashesForLine(50,testPoints.brandenBurgerGate[0], testPoints.brandenBurgerGate[1], testPoints.potsDammerPlatz[0],testPoints.potsDammerPlatz[1]);
        expect(hashes.length).toBeGreaterThan(5);
        console.log(JSON.stringify(hashes));
    });
    
    it("should cover circle with geohashes", function() {
        hashes=geotools.geoHashesForCircle(7,52,13,500);
        expect(hashes.length).toBeGreaterThan(5);
        console.log(JSON.stringify(hashes));
    });
});

describe("bounding box for polygon", function() {
    it("should calculate boundingbox for a polygon", function() {
        var polygon = [testPoints.berlin, testPoints.newyork, testPoints.buenosaires];
        var bbox = geotools.bboxForPolygon(polygon);
        expect(bbox[0] > testPoints.amsterdam[0]);
    });
});

describe("bounding box containment", function() {
    var bbox = geotools.bboxForPolygon([testPoints.berlin, testPoints.london, testPoints.buenosaires]);

    it("should contain amsterdam", function() {
        expect(geotools.bboxContains(bbox, testPoints.amsterdam[0], testPoints.amsterdam[1]));
    });
    it("should not contain sydney", function() {
        expect(!geotools.bboxContains(bbox, testPoints.sydney[0], testPoints.sydney[1]));
    });
});

describe("polygon containment", function() {
    it("should contain amsterdam", function() {
        expect(geotools.polygonContains(testPolygon, testPoints.amsterdam[0], testPoints.amsterdam[1]));
    });
    it("should not contain sydney", function() {
        expect(!geotools.polygonContains(testPolygon, testPoints.sydney[0], testPoints.sydney[1]));
    });
});

describe("rounding to specified number of decimals", function() {
    it("should round to two decimals", function() {
        expect(geotools.roundToDecimals(1.1234, 2)).toBe(1.12);
    });
});

describe("check if lines cross", function() {
    it("should cross", function() {
        expect(geotools.linesCross(1, 1, 2, 2, 1, 2, 2, 1));
        expect(geotools.linesCross(1, 1, 1, 10, 1, 3, 1, 4));
        expect(geotools.linesCross(1, 666, 10, 666, 3, 666, 4, 666));
    });
    it("should not cross", function() {
        expect(!geotools.linesCross(1, 2, 3, 4, 10, 20, 20, 10));
        expect(!geotools.linesCross(1, 1, 2, 2, 2, 2, 3, 3));
        expect(!geotools.linesCross(1, 1, 1, 5, 1, 6, 1, 10));
        expect(!geotools.linesCross(1, 666, 5, 666, 6, 666, 10, 666));
    });
});

describe("point translation", function() {
    it("should translate longitude", function() {
        var translatedLongitude = geotools.translateLongitude(testPoints.berlin[0], testPoints.berlin[1], 1000);
        expect(translatedLongitude[1]).not.toBe(testPoints.berlin[1]);
        expect(translatedLongitude[1]).toBe(13.40050308927865);
    });

    it("should translate the point", function() {
        var translated = geotools.translate(testPoints.berlin[0], testPoints.berlin[1], 1000, 3000);
        var pythagorasDistance = Math.sqrt(Math.pow(1000, 2) + Math.pow(3000, 2));
        var d = geotools.distance(translated[0], translated[1], testPoints.berlin[0], testPoints.berlin[1]);
        expect(d).toBe(3161.986216876698);
    });
});

describe("haversine distance", function() {
    it("should calculate the distance", function() {
        expect(geotools.distance(testPoints.berlin[0], testPoints.berlin[1], testPoints.sydney[0], testPoints.sydney[1])).toBe(16095663.428576712);
    });
});

describe("polygon centroid", function() {
    it("should contain its own centroid", function() {
        var centroid = geotools.getPolygonCenter(testPolygon);
        expect(geotools.polygonContains(testPolygon, centroid[0], centroid[1]));
    });
});

describe("convert bbox to a polygon", function() {
    it("should convert correctly", function() {
        var polygon = geotools.bbox2polygon([1, 2, 1, 2]);
        expect(polygon.length).toBe(4);
        expect('' + polygon[0]).toBe('' + [1, 1]);
        expect('' + polygon[1]).toBe('' + [2, 1]);
        expect('' + polygon[2]).toBe('' + [2, 2]);
        expect('' + polygon[3]).toBe('' + [1, 2]);
    });
});

describe("convert circle to polygon", function() {
    function test(latitude, longitude, radius) {
        var polygon = geotools.circle2polygon(200, latitude, longitude, radius);
        expect(polygon.length).toBe(200);
        var last = polygon[0];
        for (var i = 1; i < polygon.length; i++) {
            var next = polygon[i]
            expect(Math.round(geotools.distance(last[0], last[1], next[0], next[1]))).toBe(Math.round(2 * Math.PI * radius / 200));
            expect(Math.round(geotools.distance(latitude, longitude, next[0], next[1]))).toBe(radius);

            var last = next;
        }
    }

    it("all points should have same distance to the centre and evenly spaced on the circle", function() {
        test(testPoints.berlin[0], testPoints.berlin[1], 2000)
    });

    it("circle at 180 longitude should work as well", function() {
        test(testPoints.berlin[0], 180, 2000)
    });
});

describe("calculate polygon for points", function() {
    var polygon = geotools.getPolygonForPoints([testPoints.potsDammerPlatz, testPoints.senefelderPlatz, testPoints.naturkundeMuseum]);
    it("polygon should contain rosenthalerplatz", function() {
        expect(geotools.polygonContains(polygon, testPoints.rosenthalerPlatz[0], testPoints.rosenthalerPlatz[1]));
    });

    it("polygon should not contain moritzplatz", function() {
        expect(!geotools.polygonContains(polygon, testPoints.moritzPlatz[0], testPoints.moritzPlatz[1]));
    });
});

describe("should convert degrees, minutes, and seconds to a decimal degree", function() {
    it("should convert N 52 3' 50.01''", function() {
        expect(geotools.toDecimalDegree('n', 52, 3, 50.01)).toBe(52.06389166666666);
    });

    it("should convert S 52 3' 50.01''", function() {
        expect(geotools.toDecimalDegree('S', 52, 3, 50.01)).toBe(-52.06389166666666);
    });
});
