const express = require("express");
const router = express.Router({mergeParams: true });
const Review = require('../MODELS/reviews.js');
const Listing = require('../MODELS/listing.js');
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {validateReview, isReviewAuthor, isLoggedIn} = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

//Reviews
//Post Review Route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

//Delete Review Route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;    