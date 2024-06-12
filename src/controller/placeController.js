const dbConnect = require('../config/database-config');

//================================================================================================================

// GET allPlaces
const getAllPlaces = (req, res) => {
    //Execute the query
    dbConnect.query(
        "SELECT * FROM Tourify",
        function (err, rows) {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ message: "Error getting places", errorDetails: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'No place found!' });
            }

            const processedPlaces = rows.map((place) => {
                return {
                    placeId: place.tourism_id, //Id
                    placeName: place.tourism_name, //Name
                    placeDesc: place.tourism_description, //Description
                    category: place.category, //Category
                    city: place.city, //City
                    price: parseFloat(place.price).toFixed(3) || '0', // Format price
                    rating: parseFloat(place.rating).toFixed(1) || '0', // Format rating
                    placeAddress: place.tourism_location, //Location Address
                    placePhotoUrl: place.tourism_image ? place.tourism_image : 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_image.png', // Set default placeholder if no image URL exists
                    placeGmapsUrl: place.tourism_gmaps ? place.tourism_gmaps : 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-logo.png', // Set default placeholder if no gmaps URL exists
                };
            });

            res.status(200).json(processedPlaces);
        }
    );
};

// GET placeByCategory
const getPlacesByCategory = (req, res) => {
    const placeCategory = req.params.category;

    //Execute the query
    dbConnect.query(
        "SELECT * FROM Tourify WHERE category = ?",
        [placeCategory],
        function (err, rows) {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ message: "Error getting places", errorDetails: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'No place found for this category!' });
            }

            const processedPlaces = rows.map((place) => {
                return {
                    placeId: place.tourism_id, //Id
                    placeName: place.tourism_name, //Name
                    placeDesc: place.tourism_description, //Description
                    category: place.category, //Category
                    city: place.city, //City
                    price: parseFloat(place.price).toFixed(3) || '0', // Format price
                    rating: parseFloat(place.rating).toFixed(1) || '0', // Format rating
                    placeAddress: place.tourism_location, //Location Address
                    placePhotoUrl: place.tourism_image ? place.tourism_image : 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_image.png', // Set default placeholder if no image URL exists
                    placeGmapsUrl: place.tourism_gmaps ? place.tourism_gmaps : 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-logo.png', // Set default placeholder if no gmaps URL exists
                };
            });

            res.status(200).json(processedPlaces);
        }
    );
};

// GET DetailPlace
const getDetailPlace = (req, res) => {
    const tourismId = req.params.tourism_id;

    // First query to get place details
    dbConnect.query(
        'SELECT * FROM Tourify WHERE tourism_id = ?',
        [tourismId],
        function (err, placeRows) {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ message: "Error getting place", errorDetails: err.message });
            }

            if (placeRows.length === 0) {
                return res.status(404).json({ message: 'No place found for this Id!' });
            }

            const placeData = placeRows[0];

            // Second query to get images
            dbConnect.query(
                'SELECT * FROM Tourify_Image WHERE tourism_id = ?',
                [tourismId],
                function (err, imageRows) {
                    if (err) {
                        console.error('Error querying database:', err);
                        return res.status(500).json({ message: "Error getting place images", errorDetails: err.message });
                    }

                    const processedPlace = {
                        placeId: placeData.tourism_id,
                        placeName: placeData.tourism_name,
                        placeDesc: placeData.tourism_description, // Description
                        category: placeData.category, // Category
                        city: placeData.city, // City
                        price: parseFloat(placeData.price).toFixed(3) || '0', // Format price
                        rating: parseFloat(placeData.rating).toFixed(1) || '0', // Format rating
                        placeAddress: placeData.tourism_location, // Location Address
                        placePhotoUrl: placeData.tourism_image || 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_image.png',
                        placeGmapsUrl: placeData.tourism_gmaps || 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-logo.png',
                        additionalImages: imageRows // Array of image data from Tourify_Image
                    };

                    res.status(200).json(processedPlace);
                }
            );
        }
    );
};


module.exports = { getAllPlaces, getPlacesByCategory, getDetailPlace };