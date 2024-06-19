const dbConnect = require('../config/database-config');
const admin = require('firebase-admin');

//================================================================================================================

// POST RecommenPlace
const postRecommenPlace = async (req, res) => {
    try {
        const tourismId = req.params.tourism_id;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const userId = decodedToken.uid;
            const userEmail = decodedToken.email;

            // Periksa apakah data sudah ada (duplikat)
            const checkResult = await dbConnect.query(
                'SELECT * FROM Tourify_Recommendation WHERE user_id = ? AND tourism_id = ?',
                [userId, tourismId]
            );

            if (checkResult.length > 0) {
                return res.status(400).json({ error: `WARNING!!! This place has become a recommendation for user '${userId}'!` });
            } else {
                const { nanoid } = await import('nanoid');
                const recomenId = nanoid();

                const insertQuery = 'INSERT INTO Tourify_Recommendation (recommendation_id, user_id, user_email, tourism_id) VALUES (?, ?, ?, ?)';
                await dbConnect.query(insertQuery, [recomenId, userId, userEmail, tourismId]);
                res.status(201).json({ message: 'Recommendation added successfully' });
            }
        } catch (authError) { 
            // Tangani error dari verifyIdToken (verify firebase)
            console.error('Error verifying Firebase token:', authError);
            res.status(401).json({ error: 'Unauthorized', detailsError: authError.message });
        }
    } catch (error) { 
        // Tangani error lainnya, misalnya error database
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

// GET RecommenPlace
const getRecommenPlace = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];

        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
  
        // First query to get recommendation by userId
        dbConnect.query(
            'SELECT * FROM Tourify_Recommendation WHERE user_id = ?',
            [userId],
            function (err, recomenRows) {
                if (err) {
                    console.error('Error querying database:', err);
                    return res.status(500).json({ message: "Error getting place", errorDetails: err.message });
                }

                if (recomenRows.length === 0) {
                    return res.status(404).json({ message: 'No recommendation found for this userId!' });
                }

                Promise.all(
                    recomenRows.map(recomenData => { // Using Promise.all to handle asynchronous operations
                        const tourismId = recomenData.tourism_id;
                        return new Promise((resolve, reject) => {
                            // Second query to get images
                            dbConnect.query(
                                'SELECT * FROM Tourify WHERE tourism_id = ?',
                                [tourismId],
                                function (err, placeRows) {
                                    if (err) {
                                        console.error('Error querying database:', err);
                                        reject(err); // Reject the promise if there's an error
                                    } else {
                                        placeData = placeRows[0];
                                        const processedRecommendation = {
                                            recomenId: recomenData.recommendation_id,
                                            userId: recomenData.user_id,
                                            userEmail: recomenData.user_email,
                                            tourismId: recomenData.tourism_id,
                                            detailPlace: {
                                                placeName: placeData.tourism_name,
                                                city: placeData.city,
                                                price: parseFloat(placeData.price).toFixed(3) || '0',
                                                rating: parseFloat(placeData.rating).toFixed(1) || '0',
                                                placePhotoUrl: placeData.tourism_image || 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_image.png'
                                            },
                                        };

                                        resolve(processedRecommendation); // Resolve the promise with processed data
                                    }
                                }
                            );
                        });
                    })
                )
                .then(processedRecommendation => {
                    res.status(200).json({ detailsFavorite: processedRecommendation }); // Send all processed favorites
                })
                .catch(error => {
                    console.error('Error processing favorites:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                });
            }
        );
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = { postRecommenPlace, getRecommenPlace };