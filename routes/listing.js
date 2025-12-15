const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require('../MODELS/listing.js');
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const multer  = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const listingController = require("../controllers/listing.js");

/* ===================
   HOME ROUTES
=================== */

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

router.get("/new", isLoggedIn, listingController.renderNewForm);

/* ===================
   STATIC ROUTES
=================== */

router.get("/about", (req, res) => {
  res.render("listings/about");
});

router.get("/contact", (req, res) => {
  res.render("listings/contact");
});

router.post("/contact", (req, res) => {
  req.flash("success", "Thanks for contacting us! We’ll get back to you soon.");
  res.redirect("/listings/contact");
});

/* ===================
   SEARCH ROUTE
=================== */

router.get("/search", async (req, res) => {
  const { location } = req.query;
  const allListings = await Listing.find({ location });
  res.render("listings/search", { allListings });
});

/* ===================
   BOOKING ROUTES
=================== */

// ✅ Show booking form page
const Booking = require("../MODELS/booking");
const sendEmail = require("../utils/sendEmail"); 

// Make sure you have your email function

// Show booking form page
router.get("/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("bookings/new", { listing });
});

// Handle booking submission
router.post("/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const { checkIn, checkOut, guests } = req.body; // Form fields

  const newBooking = new Booking({
    listing: listing._id,
    user: req.user._id,
    checkIn,
    checkOut,
    guests
  });

  await newBooking.save();

  listing.bookings.push(newBooking._id);
  await listing.save();

   req.flash("success", "Booking confirmed! Confirmation email sent.");
  res.redirect(`/listings/${id}`);

  // Send confirmation email
  await sendEmail({
    email: req.user.email,
    subject: "Booking Confirmed - RentAway",
    message: `
      <h2>Booking Confirmed</h2>
      <p>Your booking for <b>${listing.title}</b> is confirmed!</p>
      <p>Check-in: ${checkIn}</p>
      <p>Check-out: ${checkOut}</p>
      <p>Guests: ${guests}</p>
    `
  });

});

// Cancel booking route
router.post("/:id/cancel", isLoggedIn, async (req, res) => {
  const booking = await Booking.findOne({
    listing: req.params.id,
    user: req.user._id,
    status: "confirmed"
  }).populate("listing"); // populate to get listing title

  if (!booking) {
    req.flash("error", "No active booking found to cancel.");
    return res.redirect(`/listings/${req.params.id}`);
  }

  booking.status = "cancelled";
  await booking.save();

  // Send cancellation email
  await sendEmail({
    email: req.user.email,
    subject: "Booking Cancelled - Wanderlust",
    message: `
      <h2>Booking Cancelled</h2>
      <p>Your booking for <b>${booking.listing.title}</b> has been cancelled.</p>
      <p>Check-in: ${booking.checkIn}</p>
      <p>Check-out: ${booking.checkOut}</p>
      <p>Guests: ${booking.guests}</p>
    `
  });

  req.flash("success", "Booking cancelled successfully! Cancellation email sent.");
  res.redirect(`/listings/${req.params.id}`);
});




/* ===================
   EDIT ROUTE
=================== */

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

/* ===================
   DYNAMIC ID ROUTES (LAST)
=================== */

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

module.exports = router;
