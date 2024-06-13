const dbConnect = require('../config/database-config');
const admin = require('firebase-admin');

// PUT UsernameProfile
const putUsernameProfile = async (req, res) => {
    try {
        const userName= req.body.username;
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
                'SELECT * FROM Tourify_Users WHERE user_id = ?',
                [userId]
            );

            if (checkResult.length > 0) {
                // Melakukan update data
                try {
                    const updateQuery = 'UPDATE Tourify_Users SET username = ? WHERE user_id = ?';
                    await dbConnect.query(updateQuery, [userName, userId]);
                    return res.status(201).json({ message: 'Username updated successfully!' });
                } catch (err) {
                    console.err('Error updating username:', err);
                    return res.status(500).json({ error: 'Failed to update username', errorDetails: err.message });
                }
            } else {
                // Melakukan insert data
                try {
                    const insertQuery = 'INSERT INTO Tourify_Users (user_id, user_email, username) VALUES (?, ?, ?)';
                    await dbConnect.query(insertQuery, [userId, userEmail, userName]);
                    return res.status(201).json({ message: 'Username added successfully!' });
                } catch (err) {
                    console.error('Error inserting username:', err);
                    return res.status(500).json({ error: 'Failed to insert username', errorDetails: err.message });
                }
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

// GET UsernameProfile
const getUsernameProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized', message: err.message });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const userId = decodedToken.uid;

            // Periksa apakah data tersedia atau tidak
            const [userData] = await dbConnect.query(
                'SELECT * FROM Tourify_Users WHERE user_id = ?',
                [userId]
            );

            if (userData) {
                // Jika data ditemukan, kirimkan sebagai respons
                return res.status(200).json({ detailsUser: userData }); 
            } else {
                // Jika tidak ada data yang cocok dengan userId
                return res.status(404).json({ error: 'User Not Found!' });
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

//POST ProfilePhoto
const postProfilePhoto = async (req, res) => {
    try {
        const file = req.file;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            userId = decodedToken.uid;
            userEmail= decodedToken.email
        } catch (authError) {
            console.error('Error verifying token:', authError);
            return res.status(401).json({ error: 'Invalid token' }); // Unauthorized
        }

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded!' });
        }

        const storage = admin.storage();
        const bucket = storage.bucket('gs://tourify-app-4e4fd.appspot.com');

        // Hapus foto lama jika ada (using Firebase Admin SDK)
        const existingPhotosPrefix = `user-profile-img/${userId}/`;
        const [files] = await bucket.getFiles({ prefix: existingPhotosPrefix });

        await Promise.all(files.map(async (fileObject) => {
            if (fileObject.name.startsWith(existingPhotosPrefix)) {
                await fileObject.delete();
            }
        }));

        // Upload foto baru dengan nama file asli
        const originalFileName = file.originalname;
        const newPhotoRef = bucket.file(`user-profile-img/${userId}/${originalFileName}`);
        await newPhotoRef.save(file.buffer, {
            contentType: file.mimetype,
            metadata: {
                firebaseStorageDownloadTokens: userId,
            }
        });

        // Dapatkan URL download dengan token
        const expiresInOneDay = new Date();
        expiresInOneDay.setDate(expiresInOneDay.getDate() + 1);

        const downloadURL = await newPhotoRef.getSignedUrl({
            action: 'read',
            expires: expiresInOneDay.toISOString() 
        });

        const imgURL = downloadURL[0];

        res.status(200).json({ message: 'Profile picture updated successfully! ', userId, userEmail, photoPublicUrl: imgURL });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { postProfilePhoto, putUsernameProfile, getUsernameProfile };