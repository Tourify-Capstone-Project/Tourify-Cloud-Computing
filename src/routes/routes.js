const express = require('express');
const multer = require('multer');
const { signUp, signIn, signOut, getUserProfile } = require('../controller/authController');
const { getAllPlaces, getPlacesByCategory, getDetailPlace } = require('../controller/placeController');
const { getFinanceByFavorite } = require('../controller/financeController');
const { getArticles } = require('../controller/articleController');
const { postFavoritePlace, getFavoritesByUser, deleteFavoritePlace } = require('../controller/favoriteController');
const { putUsernameProfile, getUsernameProfile, postProfilePhoto } = require('../controller/userController');
const { postReviewUser, getReviewsByTourismId } = require('../controller/reviewController');
const { verifyJWT } = require('../middleware/auth-midware');


const route = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

//=================================================================================================================

// Authentication
route.post('/signup', signUp);
route.post('/login', signIn);
route.post('/logout', signOut);

// No Need Authentication
route.get('/home', getArticles);
route.get('/all-destination', getAllPlaces);
route.get('/category/:category', getPlacesByCategory);
route.get('/destination/:tourism_id', getDetailPlace);

// Need Authentication
route.put('/profile', putUsernameProfile);
route.get('/profile', getUsernameProfile);
route.post('/profile', upload.single('imgProfile'), (req, res) => {
    postProfilePhoto(req, res); // Panggil fungsi controller dengan req dan res
});
route.post('/destination/:tourism_id/review-destination', postReviewUser);
route.get('/destination/:tourism_id/review-destination', getReviewsByTourismId);
route.post('/destination/:tourism_id/favorite-destination', postFavoritePlace);
route.delete('/destination/:tourism_id/favorite-destination', deleteFavoritePlace);
route.get('/favorite-destination', getFavoritesByUser);
route.get('/finance-destination', getFinanceByFavorite);

module.exports = route;