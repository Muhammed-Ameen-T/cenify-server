"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheaterManagementController = void 0;
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
const sendResponse_utils_1 = require("../../utils/response/sendResponse.utils");
const httpResponseCode_utils_1 = require("../../utils/constants/httpResponseCode.utils");
const custom_error_1 = require("../../utils/errors/custom.error");
/**
 * Controller for managing theater-related operations for both vendors and administrators.
 * @implements {ITheaterManagementController}
 */
let TheaterManagementController = class TheaterManagementController {
    /**
     * Constructs an instance of TheaterManagementController.
     * @param {IFetchTheaterOfVendorUseCase} fetchTheaterUseCase - Use case for fetching theaters owned by a specific vendor.
     * @param {IFetchTheatersUseCase} fetchTheatersUseCase - Use case for fetching all theaters (general public view).
     * @param {IUpdateTheaterStatusUseCase} updateTheaterStatusUseCase - Use case for updating a theater's status.
     * @param {IFetchAdminTheatersUseCase} fetchAdminTheatersUseCase - Use case for fetching theaters for admin panel.
     * @param {IUpdateTheaterUseCase} updateTheaterUseCase - Use case for updating theater details.
     */
    constructor(fetchTheaterUseCase, fetchTheatersUseCase, updateTheaterStatusUseCase, fetchAdminTheatersUseCase, updateTheaterUseCase, findTheaterByIdUseCase) {
        this.fetchTheaterUseCase = fetchTheaterUseCase;
        this.fetchTheatersUseCase = fetchTheatersUseCase;
        this.updateTheaterStatusUseCase = updateTheaterStatusUseCase;
        this.fetchAdminTheatersUseCase = fetchAdminTheatersUseCase;
        this.updateTheaterUseCase = updateTheaterUseCase;
        this.findTheaterByIdUseCase = findTheaterByIdUseCase;
        /**
         * Fetches theaters for a specific vendor with pagination and filtering options.
         * @param {Request} req - The Express request object. Requires `req.decoded.userId` for the vendor ID and optional query parameters.
         * @param {Response} res - The Express response object.
         * @param {NextFunction} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        this.getTheatersOfVendor = async (req, res, next) => {
            try {
                const { page, limit, search, status, location, sortBy, sortOrder } = req.query;
                const vendorId = req.decoded?.userId;
                if (!vendorId) {
                    throw new custom_error_1.CustomError(httpResponseCode_utils_1.HttpResMsg.UNAUTHORIZED, httpResponseCode_utils_1.HttpResCode.UNAUTHORIZED);
                }
                // Convert query parameters directly
                const params = {
                    vendorId,
                    page: page ? parseInt(page) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    search: search ? search : undefined,
                    status: status ? status.split(',') : undefined,
                    location: location ? location : undefined,
                    sortBy: sortBy ? sortBy : undefined,
                    sortOrder: sortOrder ? sortOrder : undefined,
                };
                // Fetch theaters using the use case
                const result = await this.fetchTheaterUseCase.execute(params);
                (0, sendResponse_utils_1.sendResponse)(res, httpResponseCode_utils_1.HttpResCode.OK, httpResponseCode_utils_1.HttpResMsg.SUCCESS, result);
            }
            catch (error) {
                next(error);
            }
        };
    }
    /**
     * Fetches all theaters available in the system.
     * @param {Request} req - The Express request object.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>}
     */
    async getTheaters(req, res, next) {
        try {
            const theaters = await this.fetchTheatersUseCase.execute();
            (0, sendResponse_utils_1.sendResponse)(res, httpResponseCode_utils_1.HttpResCode.OK, httpResponseCode_utils_1.HttpResMsg.SUCCESS, theaters);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates the status of a specific theater.
     * @param {Request} req - The Express request object, containing theater ID in `req.params.id` and new status in `req.body.status`.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>}
     */
    async updateTheaterStatus(req, res, next) {
        const { id } = req.params;
        const { status } = req.body;
        try {
            await this.updateTheaterStatusUseCase.execute(id, status, res);
        }
        catch (error) {
            (0, sendResponse_utils_1.sendResponse)(res, httpResponseCode_utils_1.HttpResCode.INTERNAL_SERVER_ERROR, 'Failed to update status');
        }
    }
    /**
     * Updates the details of an existing theater.
     * @param {Request} req - The Express request object, containing theater ID in `req.params.id` and updated theater details in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>}
     */
    async updateTheater(req, res, next) {
        const { id } = req.params;
        try {
            await this.updateTheaterUseCase.execute(id, req.body, res);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Fetches theaters for the admin panel with comprehensive filtering, pagination, and sorting.
     * @param {Request} req - The Express request object, containing various query parameters for filtering and sorting.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>}
     */
    async fetchTheatersByAdmin(req, res, next) {
        try {
            const { page, limit, search, status, features, rating, location, sortBy, sortOrder } = req.query;
            // Build params object from query parameters
            const params = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                search: search ? search : undefined,
                status: status ? status.split(',') : undefined,
                features: features ? features.split(',') : undefined,
                rating: rating ? parseFloat(rating) : undefined,
                location: location ? location : undefined,
                sortBy: sortBy ? sortBy : undefined,
                sortOrder: sortOrder ? sortOrder : undefined,
            };
            // Fetch theaters using the use case
            const result = await this.fetchAdminTheatersUseCase.execute(params);
            (0, sendResponse_utils_1.sendResponse)(res, httpResponseCode_utils_1.HttpResCode.OK, httpResponseCode_utils_1.HttpResMsg.SUCCESS, result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Find theater By using Id from param.
     * @param {Request} req - The Express request object.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>}
     */
    async findTheaterById(req, res, next) {
        try {
            const { id } = req.params;
            const theater = await this.findTheaterByIdUseCase.execute(id);
            if (!theater) {
                throw new custom_error_1.CustomError(httpResponseCode_utils_1.HttpResMsg.NOT_FOUND, httpResponseCode_utils_1.HttpResCode.NOT_FOUND);
            }
            (0, sendResponse_utils_1.sendResponse)(res, httpResponseCode_utils_1.HttpResCode.OK, httpResponseCode_utils_1.HttpResMsg.SUCCESS, theater);
        }
        catch (error) {
            next(error);
        }
    }
};
exports.TheaterManagementController = TheaterManagementController;
exports.TheaterManagementController = TheaterManagementController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('FetchTheaterOfVendorUseCase')),
    __param(1, (0, tsyringe_1.inject)('FetchTheatersUseCase')),
    __param(2, (0, tsyringe_1.inject)('UpdateTheaterStatus')),
    __param(3, (0, tsyringe_1.inject)('FetchAdminTheatersUseCase')),
    __param(4, (0, tsyringe_1.inject)('UpdateTheater')),
    __param(5, (0, tsyringe_1.inject)('FindTheaterByIdUseCase')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], TheaterManagementController);
