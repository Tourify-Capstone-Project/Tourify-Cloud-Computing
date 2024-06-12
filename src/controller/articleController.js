const dbConnect = require('../config/database-config');

//================================================================================================================

// GET Articles
const getArticles = (req, res) => {
    //Execute the query
    dbConnect.query(
        "SELECT * FROM Tourify_Article",
        function (err, rows) {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ message: "Error getting articles", errorDetails: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'No article found!' });
            }

            const processedArticles = rows.map((articles) => {
                return {
                    articleId: articles.article_id, //Id
                    articleUrl: articles.article_url, //Name
                    city: articles.city, //City
                    articleTitle: articles.article_title, //Name
                    articleDesc: articles.article_description, //Description
                    articlePhotoUrl: articles.article_image ? articles.article_image : 'https://storage.googleapis.com/tourifyapp-bucket/tourify-images/image-default/tourify-no_image.png', // Set default placeholder if no image URL exists
                };
            });

            res.status(200).json(processedArticles);
        }
    );
};


module.exports = { getArticles };