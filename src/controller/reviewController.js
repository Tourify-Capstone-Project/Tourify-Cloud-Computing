const dbConnect = require('../config/database-config');
const admin = require('firebase-admin');

//================================================================================================================

// POST ReviewByUser
const postReviewUser = async (req, res) => {
    try {
        const reviewDesc = req.body.review;
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

            const { nanoid } = await import('nanoid');
                const reviewId = nanoid();

                const insertQuery = 'INSERT INTO Tourify_Review (review_id, user_id, user_email, tourism_id, review_desc) VALUES (?, ?, ?, ?, ?)';
                await dbConnect.query(insertQuery, [reviewId, userId, userEmail, tourismId, reviewDesc]);
                res.status(201).json({ message: 'Review added successfully' });
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

// GET Reviews by Tourism ID
const getReviewsByTourismId = async (req, res) => {
    try {
        const tourismId = req.params.tourism_id;

        // Query untuk mengambil data review dari database
        const reviews = await dbConnect.query(
            `SELECT r.review_id, r.user_id, r.review_desc, u.username
            FROM Tourify_Review r
            JOIN Tourify_Users u ON r.user_id = u.user_id
            WHERE r.tourism_id = ?`,
            [tourismId]
        );

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this tourism ID' });
        }

        // Ambil URL foto profil dari Firebase Storage
        const storage = admin.storage();
        const bucket = storage.bucket('gs://tourify-app-4e4fd.appspot.com');

        // Dapatkan URL download dengan token, berlaku selama 1 bulan
        const expiresInOneMonth = new Date();
        expiresInOneMonth.setMonth(expiresInOneMonth.getMonth() + 1); // Tambah 1 bulan

        const reviewsWithProfilePhoto = await Promise.all(reviews.map(async (review) => {
            // Mendapatkan file di folder user-profile-img/userId/
            const [files] = await bucket.getFiles({ prefix: `user-profile-img/${review.user_id}/` });

            let photoPublicUrl = null;
            if (files.length > 0) {
                const profilePhotoRef = files[0]; // Ambil file pertama dalam folder
                [photoPublicUrl] = await profilePhotoRef.getSignedUrl({
                    action: 'read',
                    expires: expiresInOneMonth.toISOString()
                });
            } else {
                photoPublicUrl = 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_profile.png';
            }

            return {
                review_id: review.review_id,
                user_id: review.user_id,
                review_desc: review.review_desc,
                username: review.username,
                photoPublicUrl: photoPublicUrl
            };
        }));

        res.status(200).json({ error: false, status: 'success', reviews: reviewsWithProfilePhoto });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: true, status: 'fail', message: 'Internal Server Error', detailsError: error.message });
    }
};

module.exports = { postReviewUser, getReviewsByTourismId };