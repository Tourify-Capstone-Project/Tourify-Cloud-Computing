const express = require('express');
const { signUp, signIn, signOut, getUserProfile } = require('../controller/authController');
const { getAllPlaces, getPlacesByCategory, getDetailPlace } = require('../controller/placeController');
const { getFinanceByFavorite } = require('../controller/financeController');
const { getArticles } = require('../controller/articleController');
const { postFavoritePlace, getFavoritesByUser, deleteFavoritePlace } = require('../controller/favoriteController');
const { verifyJWT } = require('../middleware/auth-midware');


const route = express.Router();

//=================================================================================================================

// Authentication
route.post('/signup', signUp);
route.post('/login', signIn);
route.post('/logout', signOut);

route.get('/profile', getUserProfile);

// No Need Authentication
route.get('/home', getArticles);
route.get('/all-places', getAllPlaces);
route.get('/category/:category', getPlacesByCategory);
route.get('/destination/:tourism_id', getDetailPlace);

// Need Authentication
route.post('/destination/:tourism_id', postFavoritePlace);
route.delete('/destination/:tourism_id', deleteFavoritePlace);
route.get('/favorite-places', getFavoritesByUser);
route.get('/finance-places', getFinanceByFavorite);

module.exports = route;