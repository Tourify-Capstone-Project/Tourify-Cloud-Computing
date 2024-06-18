const admin = require('firebase-admin');
const dbConnect = require('../config/database-config');
const { signInWithEmailAndPassword } = require('@firebase/auth');
const { auth } = require('../config/firebase-config');
const JWT = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

//================================================================================================================

const signUp = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        const userExists = await admin.auth().getUserByEmail(email).then(() => true).catch(() => false);

        if (userExists) {
            return res.status(400).json({ message: "Email is already in use" });
        }
        

        const userRecord = await admin.auth().createUser({
            displayName: username,
            email,
            password,
        })

        const userId = userRecord.uid;
        const userEmail = userRecord.email;

        try {
            // Tambahkan data pengguna ke tabel Tourify_Users
            const insertQuery = 'INSERT INTO Tourify_Users (user_id, user_email, username) VALUES (?, ?, ?)';
            await dbConnect.query(insertQuery, [userId, userEmail, username]);
            console.log('User data inserted into Tourify_Users');
        } catch (insertError) {
            // Jika terjadi kesalahan saat menyimpan data di database, hapus user dari Firebase Authentication
            console.error('Error inserting user data:', insertError);
            await admin.auth().deleteUser(userRecord.uid);
            throw insertError; // Lanjutkan melempar error agar ditangani di blok catch utama
        }

        const verificationLink = await admin.auth().generateEmailVerificationLink(email);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: 'noreply.tourify@gmail.com',
                pass: 'ixce qgji scun swnt',
            },
        });
        
        const name = userRecord.displayName;
        const mailOptions = {
            from: '"Tourify" <noreply.tourify@gmail.com>', // Set sender name and email
            to: email,
            replyTo: "noreply",
            subject: "[No-Reply] Verify Your Email For Tourify!",
            html:
            `<p> Hi ${name}, welcome to Tourify App! </p> <br>
            <p> Please verify your email by click <a href="${verificationLink}"> <u> verify my email </u> </a>.</p>
            <p> If you didn't ask to verify this address, you can ignore this email. Thank you. </p> <br>
            <p> Best Regards, </p>
            <p> Tourify Team :) </p>`,
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                admin.auth().deleteUser(userRecord.uid).catch(deleteError => {
                    console.error("Error deleting user:", deleteError);
                });
                res.status(500).json({massage:'Error sending email.'});
            } else {
                console.log("Email sent:", info.response);
                res.status(200).json({ message: "SignUp successful. Please check your email.", user: userRecord });
            }
        });

        
    } catch (error) {
        console.error(error);

        if (userRecord) {
            await admin.auth().deleteUser(userRecord.uid);
        }

        res.status(500).json({massage:"SignUp failed. " + error});
    }
};


//Sign In function
const signIn = async (req, res) => {
    try {
        console.log(req.body)
        const user = {
            email: req.body.email,
            password: req.body.password,
        }

        if (!user.email || !user.password) {
            return res.status(400).json({ massage: 'All field is required' });
        }

        const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
        const userRecord = userCredential.user;

        if (!userRecord.emailVerified) {
        return res.status(401).json({ massage: 'Email not verified. Please check your email for verification instructions.' });
        }

        // Create a JWT token
        const token = JWT.sign({ id: userRecord.uid }, process.env.JWT_SECRET_KEY);

        res.status(200).json({ message: "Login successful", user: userRecord, token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ massage: 'Error during signin' });
    }
}

// Sign Out function
const signOut = async (req, res) => {
    try {
        await auth.signOut();

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out user:', error);
        res.status(500).json({ massage: 'Internal Server Error' });
    }
}

// Get User Profile function
const getUserProfile = async (req, res) => {
    try {
        // Get user UID from the decoded token
        const decodedToken = req.user;

        if (!decodedToken || !decodedToken.id) {
            return res.status(401).json({ massage: 'Invalid token or missing UID' });
        }

        // Retrieve user information from Firebase Authentication
        const userRecord = await admin.auth().getUser(decodedToken.id);

        const userProfile = {
            uid: userRecord.uid,
            username: userRecord.displayName,
            email: userRecord.email,
        }

        res.status(200).json({ user: userProfile })
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).json({ massage: 'Internal Server Error' });
    }
}

module.exports = {signUp, signIn, signOut, getUserProfile,};