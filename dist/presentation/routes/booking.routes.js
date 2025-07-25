"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tsyringe_1 = require("tsyringe");
const bookingStripeWebhook_controller_1 = require("../controllers/bookingStripeWebhook.controller");
const verifyToken_middleware_1 = require("../middleware/verifyToken.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const router = express_1.default.Router();
const bookingController = tsyringe_1.container.resolve('BookingMngController');
const stripeController = tsyringe_1.container.resolve(bookingStripeWebhook_controller_1.BookingStripeWebhookController);
router.post('/create', verifyToken_middleware_1.verifyAccessToken, (0, rbac_middleware_1.authorizeRoles)(['user']), (req, res, next) => bookingController.createBooking(req, res, next));
router.get('/check-payment-options', verifyToken_middleware_1.verifyAccessToken, (0, rbac_middleware_1.authorizeRoles)(['user']), (req, res, next) => bookingController.checkPaymentOptions(req, res, next));
router.get('/fetch', verifyToken_middleware_1.verifyAccessToken, (0, rbac_middleware_1.authorizeRoles)(['user', 'admin']), (req, res, next) => bookingController.fetchBookings(req, res, next));
router.get('/fetch-vendor', verifyToken_middleware_1.verifyAccessToken, (0, rbac_middleware_1.authorizeRoles)(['vendor']), (req, res, next) => bookingController.findBookingsOfVendor(req, res, next));
router.get('/find/:id', (req, res, next) => bookingController.findBookingById(req, res, next));
router.patch('/cancel/:id', verifyToken_middleware_1.verifyAccessToken, (0, rbac_middleware_1.authorizeRoles)(['user']), (req, res, next) => bookingController.cancelBooking(req, res, next));
router.get('/user-bookings', verifyToken_middleware_1.verifyAccessToken, (0, rbac_middleware_1.authorizeRoles)(['user']), (req, res, next) => bookingController.findBookingsOfUser(req, res, next));
router.post('/webhook/stripe', (req, res, next) => stripeController.handleWebhook(req, res, next));
exports.default = router;
