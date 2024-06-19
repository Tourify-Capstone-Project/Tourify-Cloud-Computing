const dbConnect = require('../config/database-config');
const admin = require('firebase-admin');

//================================================================================================================

// GET FinanceByFavorite
const getFinanceByFavorite = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];

        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
    
        const query = `
            SELECT tf.favorite_id, tf.user_id, tf.user_email, tf.tourism_id, t.price
            FROM Tourify_Favorite AS tf
            JOIN Tourify AS t ON tf.tourism_id = t.tourism_id
            WHERE tf.user_id = ?;
        `;
        
        dbConnect.query(query, [userId], async function(err, rows) {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ message: "Error getting favorites", errorDetails: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'No finance found for this userId!' });
            }
            
            const processedFinance = await Promise.all(rows.map(async (favData) => {
                const placeRows = await dbConnect.query('SELECT * FROM Tourify WHERE tourism_id = ?', [favData.tourism_id]);
                const placeData = placeRows[0];
                return {
                    favoriteId: favData.favorite_id,
                    userId: favData.user_id,
                    userEmail: favData.user_email,
                    tourismId: favData.tourism_id,
                    placePrice: parseFloat(favData.price).toFixed(3) || '0', // Tambahkan harga ke setiap item
                    detailPlace: {
                        placeName: placeData.tourism_name,
                        city: placeData.city,
                        price: parseFloat(placeData.price).toFixed(3) || '0',
                        rating: parseFloat(placeData.rating).toFixed(1) || '0',
                        placePhotoUrl: placeData.tourism_image || 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_image.png'
                    },
                };
            }));

            // Calculate total cost after all promises are resolved
            const totalCost = processedFinance.reduce((sum, favorite) => sum + parseFloat(favorite.placePrice), 0).toFixed(3);

            res.status(200).json({detailsFinance: processedFinance, totalCost}); 
        });
    } catch (error) {
        console.error({ error: 'Error getting favorites:', message: error.message });
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


module.exports = { getFinanceByFavorite };