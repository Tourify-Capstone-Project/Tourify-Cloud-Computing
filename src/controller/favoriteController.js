const dbConnect = require('../config/database-config');
const admin = require('firebase-admin');

//================================================================================================================

// POST FavoriteByUser
const postFavoritePlace = async (req, res) => {
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
                'SELECT * FROM Tourify_Favorite WHERE user_id = ? AND tourism_id = ?',
                [userId, tourismId]
            );

            if (checkResult.length > 0) {
                return res.status(400).json({ error: `WARNING!!! This place has become a favourite for user '${userId}'!` });
            } else {
                const { nanoid } = await import('nanoid');
                const favoriteId = nanoid();

                const insertQuery = 'INSERT INTO Tourify_Favorite (favorite_id, user_id, user_email, tourism_id) VALUES (?, ?, ?, ?)';
                await dbConnect.query(insertQuery, [favoriteId, userId, userEmail, tourismId]);
                res.status(201).json({ message: 'Favorite added successfully' });
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

// GET FavoritePlace
const getFavoritesByUser = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];

        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
  
        // First query to get favorite by userId
        dbConnect.query(
            'SELECT * FROM Tourify_Favorite WHERE user_id = ?',
            [userId],
            function (err, favRows) {
                if (err) {
                    console.error('Error querying database:', err);
                    return res.status(500).json({ message: "Error getting place", errorDetails: err.message });
                }

                if (favRows.length === 0) {
                    return res.status(404).json({ message: 'No favorite found for this userId!' });
                }

                Promise.all(
                    favRows.map(favData => { // Using Promise.all to handle asynchronous operations
                        const tourismId = favData.tourism_id;
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
                                        const processedFavorite = {
                                            favoriteId: favData.favorite_id,
                                            userId: favData.user_id,
                                            userEmail: favData.user_email,
                                            tourismId: favData.tourism_id,
                                            detailPlace: {
                                                placeName: placeData.tourism_name,
                                                city: placeData.city,
                                                price: parseFloat(placeData.price).toFixed(3) || '0',
                                                rating: parseFloat(placeData.rating).toFixed(1) || '0',
                                                placePhotoUrl: placeData.tourism_image || 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_image.png'
                                            },
                                        };

                                        resolve(processedFavorite); // Resolve the promise with processed data
                                    }
                                }
                            );
                        });
                    })
                )
                .then(processedFavorite => {
                    res.status(200).json({ detailsFavorite: processedFavorite }); // Send all processed favorites
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

// DELETE FavoritePlace
const deleteFavoritePlace = async (req, res) => {
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

            // Query untuk menghapus data dari tabel Tourify_Favorite
            const deleteQuery = 'DELETE FROM Tourify_Favorite WHERE user_id = ? AND tourism_id = ?';
            const deleteResult = await dbConnect.query(deleteQuery, [userId, tourismId]);

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Favorite not found' });
            }

            res.status(200).json({ message: 'Favorite deleted successfully' });
        } catch (authError) {
            console.error('Error verifying Firebase token:', authError);
            res.status(401).json({ error: 'Unauthorized', detailsError: authError.message });
        }
    } catch (error) {
      console.error('Error deleting favorite:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


module.exports = { postFavoritePlace, getFavoritesByUser, deleteFavoritePlace };