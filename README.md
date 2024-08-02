# Tourify-Cloud-Computing API
---
#### Google Cloud Service
​Our Google Cloud Service uses the following services as our infrastructure:
* App Engine: this service runs the backend.
* Cloud SQL (MySQL): we use this service to store data from dataset tourify,travel destinations data, favourite tours data, travel finance data, etc.
* Firebase: we use this for authentication and firebase storage to store user profile photos
* Cloud Storage: we use this service  to store some default images and export datasets that have been created from local computers.
---
![arsitektur-gcp](https://github.com/Tourify-Capstone-Project/Tourify-Cloud-Computing/assets/47408640/a0a2148f-ed1e-46f6-8e6a-de457e53ea4b)
r-gcp.jpeg)
#### API Endpoint
```
POST SignUp -> /signup
```
```
POST SignIn -> /login
```
```
GET Articles -> /home
```
```
GET AllPlaces -> /all-destination
```
```
GET PlacesByCategory -> /category/:category
```
```
GET DetailPlace -> /destination/:tourism_id
```
```
PUT UsernameProfile -> /profile
```
```
GET UsernameProfile -> /profile
```
```
POST Review -> /destination/:tourism_id/review-destination
```
```
GET Review -> /destination/:tourism_id/review-destination
```
```
POST Favorite -> /destination/:tourism_id/favorite-destination
```
```
DELETE Favorite -> /destination/:tourism_id/favorite-destination
```
```
GET Favorite -> /favorite-destination
```
```
POST Recommendation -> /destination/:tourism_id/recommendation
```
```
GET Recommendation  -> /home/recommendation
```
---
#### API Documentation
Follow this link : [Tourify-API Documentation](https://documenter.getpostman.com/view/34779132/2sA3XQi2Zu)

#### API Link 
Follow this link : [Tourify-API](https://tourify-api-dot-tourify-app-project.as.r.appspot.com/)

#### Note
if the link cannot be accessed, it means that the server is having problems or has been closed due to cost constraints.

