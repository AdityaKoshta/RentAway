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

router.get("/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("bookings/new", { listing });
});

// ✅ Handle booking form submission and send confirmation email

const sendEmail = require("../utils/sendEmail");

router.post("/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const { booking } = req.body; // contains booking info (e.g., checkIn, checkOut, guests)
  const userEmail = req.user.email; // logged-in user's email

  // 📨 Email content
  const message = `
    <h2>Booking Confirmation</h2>
    <p>Dear ${req.user.username},</p>
    <p>Your booking for <b>${listing.title}</b> has been successfully confirmed!</p>
    <p><b>Booking Details:</b></p>
    <ul>
      <li>Check-in: ${booking.checkIn}</li>
      <li>Check-out: ${booking.checkOut}</li>
      <li>Guests: ${booking.guests}</li>
    </ul>
    <p>We’ll reach out to you soon with more information.</p>
    <br/>
    <p>Thanks for choosing <b>RentAway</b> 🏡</p>
  `;

  try {
    // Send email
    await sendEmail({
      email: userEmail,
      subject: "Your RentAway Booking Confirmation",
      message,
    });

    req.flash("success", "Booking confirmed! Confirmation email sent successfully.");
  } catch (error) {
    console.error("Email Error:", error);
    req.flash("error", "Booking saved, but failed to send confirmation email.");
  }

  res.redirect(`/listings/${id}`);
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
