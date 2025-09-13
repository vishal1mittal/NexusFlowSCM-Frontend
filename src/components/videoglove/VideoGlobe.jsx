import Globe from "react-globe.gl";
import { React, useState, useEffect, useRef } from "react";
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

function VideoGlobe({ width = 800, height = 600 }) {
    const [arcData, setArcData] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [routeData, setRouteData] = useState(null);
    const [coordinates, setCoordinates] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const globeRef = useRef();
    const BASEURL = process.env.REACT_APP_BASE_URL;
    const GRAPHHOPPER_API_KEY = process.env.REACT_APP_GRAPHHOPPER_API_KEY;

    useEffect(() => {
        const numberOfTrucks = 50;
        // Within your fetch function
        fetch(`${BASEURL}data/${numberOfTrucks}`)
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch truck data");
                return r.json();
            })
            .then((trucksGeo) => {
                console.log("Fetched truck data:", trucksGeo); // Log the data
                const truckArcs = trucksGeo.features
                    .flatMap(({ geometry, properties }) => {
                        const { coordinates, type } = geometry;

                        if (type === "LineString") {
                            return processCoordinates(coordinates, properties);
                        } else if (type === "MultiLineString") {
                            return coordinates.flatMap((coords) =>
                                processCoordinates(coords, properties)
                            );
                        } else {
                            console.warn(
                                "Invalid geometry format detected:",
                                geometry
                            );
                            return [];
                        }
                    })
                    .filter((arc) => arc !== null);

                setArcData(truckArcs);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setArcData([]); // Reset arcData on error
            });
    }, []);

    const processCoordinates = (coordinates, properties) => {
        if (Array.isArray(coordinates) && coordinates.length > 1) {
            const start = coordinates[0];
            const end = coordinates[coordinates.length - 1];

            if (
                Array.isArray(start) &&
                start.length === 2 &&
                Array.isArray(end) &&
                end.length === 2
            ) {
                return {
                    startLat: start[1],
                    startLng: start[0],
                    endLat: end[1],
                    endLng: end[0],
                    name: properties.name || "Unnamed Arc",
                    color: properties.color || "yellow",
                };
            }
        }
        return null;
    };

    const handleArcClick = async (arc) => {
        const startLat = arc.startLat;
        const startLng = arc.startLng;
        const endLat = arc.endLat;
        const endLng = arc.endLng;

        const isValid = (lat, lng) =>
            lat >= -85.0511284 &&
            lat <= 85.0511284 &&
            lng >= -180 &&
            lng <= 180;

        if (!isValid(startLat, startLng) || !isValid(endLat, endLng)) {
            console.error("Invalid coordinates detected:", {
                startLat,
                startLng,
                endLat,
                endLng,
            });
            return;
        }

        const response = await fetch(
            `https://graphhopper.com/api/1/route?point=${startLat},${startLng}&point=${endLat},${endLng}&vehicle=car&debug=true&key=${GRAPHHOPPER_API_KEY}&type=json&points_encoded=false`
        );

        const data = await response.json();

        if (data.message) {
            console.error("GraphHopper API error:", data.message);
            return;
        }

        if (data.paths && data.paths.length > 0) {
            const pathCoordinates = data.paths[0].points.coordinates;
            const filteredCoordinates = pathCoordinates.filter(
                (_, index) => index % 5 === 0
            );
            if (pathCoordinates.length > 0) {
                filteredCoordinates.push(
                    pathCoordinates[pathCoordinates.length - 1]
                );
            }

            setCoordinates(filteredCoordinates);
            setRouteData(data);
            setShowPopup(true);
            setCurrentIndex(0);
        }
    };

    const calculateHeading = (lat1, lng1, lat2, lng2) => {
        const toRadians = (deg) => (deg * Math.PI) / 180;
        const dLng = toRadians(lng2 - lng1);
        const lat1Rad = toRadians(lat1);
        const lat2Rad = toRadians(lat2);

        const y = Math.sin(dLng) * Math.cos(lat2Rad);
        const x =
            Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
        const heading = Math.atan2(y, x);

        return ((heading * 180) / Math.PI + 360) % 360;
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (coordinates.length) {
                setCurrentIndex(
                    (prevIndex) => (prevIndex + 1) % coordinates.length
                );
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [coordinates]);

    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.pointOfView({ lat: 0, lng: 20, altitude: 1.5 }, 0);
            const duration = 7000;
            const startTime = Date.now();

            const animateGlobe = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const lng = 20 + 360 * progress;

                globeRef.current.pointOfView(
                    { lat: 0, lng: lng % 360, altitude: 3 },
                    0
                );

                if (progress < 1) {
                    requestAnimationFrame(animateGlobe);
                } else {
                    globeRef.current.pointOfView(
                        { lat: 20.5937, lng: 78.9629, altitude: 0.5 },
                        2000
                    );
                }
            };

            animateGlobe();
        }
    }, []);

    const handleClosePopup = () => setShowPopup(false);

    return (
        <>
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                arcsData={arcData}
                arcStartLat="startLat"
                arcStartLng="startLng"
                arcEndLat="endLat"
                arcEndLng="endLng"
                arcColor="color"
                arcDashLength={0.1}
                arcDashGap={0.008}
                arcDashAnimateTime={12000}
                arcStroke={0.5}
                onArcClick={handleArcClick}
                width={width}
                height={height}
            />
            {showPopup && coordinates.length > 0 && (
                <Modal
                    open={showPopup}
                    onClose={handleClosePopup}
                    aria-labelledby="modal-title"
                    aria-describedby="modal-description"
                >
                    <Card
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            maxWidth: "100%",
                            boxShadow: 24,
                            p: 1,
                        }}
                    >
                        <Box display="flex" gap={2} mb={2}>
                            <Box sx={{ flex: 1 }}>
                                <iframe
                                    src={`https://www.google.com/maps/embed?pb=!4v1726956268970!6m8!1m7!1s${
                                        coordinates[currentIndex][1]
                                    },${coordinates[currentIndex][0]}!2m2!1d${
                                        coordinates[currentIndex][1]
                                    }!2d${coordinates[currentIndex][0]}!3f${
                                        currentIndex < coordinates.length - 1
                                            ? calculateHeading(
                                                  coordinates[currentIndex][1],
                                                  coordinates[currentIndex][0],
                                                  coordinates[
                                                      currentIndex + 1
                                                  ][1],
                                                  coordinates[
                                                      currentIndex + 1
                                                  ][0]
                                              )
                                            : 0
                                    }!4f0!5f0`}
                                    width={width}
                                    height={height}
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </Box>
                        </Box>
                        <IconButton
                            aria-label="close"
                            onClick={handleClosePopup}
                            sx={{ position: "absolute", top: 8, right: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Card>
                </Modal>
            )}
        </>
    );
}

export default VideoGlobe;
