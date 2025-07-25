// src/application/useCases/Vendor/updateSeatLayout.useCase.ts
import { inject, injectable } from 'tsyringe';
import { Response } from 'express';
import mongoose from 'mongoose';
import { ISeatLayoutRepository } from '../../../domain/interfaces/repositories/seatLayout.repository';
import { IUpdateSeatLayoutUseCase } from '../../../domain/interfaces/useCases/Vendor/updateSeatLayoutUseCase';
import { sendResponse } from '../../../utils/response/sendResponse.utils';
import { HttpResCode, HttpResMsg } from '../../../utils/constants/httpResponseCode.utils';
import { CustomError } from '../../../utils/errors/custom.error';
import { SuccessMsg } from '../../../utils/constants/commonSuccessMsg.constants';
import ERROR_MESSAGES from '../../../utils/constants/commonErrorMsg.constants';
import { z } from 'zod';
import { Seat, SeatLayout } from '../../../domain/entities/seatLayout.entity';
import {
  UpdateSeatLayoutDTO,
  UpdateSeatLayoutDTOSchema,
  UpdateSeatLayoutDTOType,
} from '../../dtos/seatLayout';
import SeatLayoutModel from '../../../infrastructure/database/seatLayout.model';

// Utility function to normalize seat types (reused from create use case)
const normalizeSeatType = (type: string): 'Regular' | 'Premium' | 'VIP' | 'Unavailable' => {
  const normalized = type.toLowerCase();
  switch (normalized) {
    case 'regular':
      return 'Regular';
    case 'premium':
      return 'Premium';
    case 'vip':
      return 'VIP';
    case 'unavailable':
      return 'Unavailable';
    default:
      throw new CustomError(`Invalid seat type: ${type}`, 400);
  }
};

@injectable()
export class UpdateSeatLayoutUseCase implements IUpdateSeatLayoutUseCase {
  constructor(
    @inject('SeatLayoutRepository') private seatLayoutRepository: ISeatLayoutRepository,
  ) {}

  async execute(dto: UpdateSeatLayoutDTO, res: Response): Promise<SeatLayout | null> {
    try {
      // Normalize seat types
      const normalizedDto = {
        ...dto,
        seats: dto.seats.map((seat) => ({
          ...seat,
          type: normalizeSeatType(seat.type),
        })),
      };

      // Validate DTO
      const validatedData: UpdateSeatLayoutDTOType = UpdateSeatLayoutDTOSchema.parse(normalizedDto);

      // Validate layoutId
      if (!mongoose.Types.ObjectId.isValid(validatedData.layoutId)) {
        throw new CustomError(ERROR_MESSAGES.VALIDATION.INVALID_LAYOUT_ID, 400);
      }

      // Check if seat layout exists
      const existingLayout = await SeatLayoutModel.findById(validatedData.layoutId);
      if (!existingLayout) {
        throw new CustomError('Seat layout not found', 404);
      }

      // Validate capacity
      const capacity = validatedData.seats.filter((seat) => seat.type !== 'Unavailable').length;
      if (capacity !== validatedData.capacity) {
        throw new CustomError(
          `Capacity mismatch: expected ${capacity}, got ${validatedData.capacity}`,
          400,
        );
      }

      // Validate seat count
      if (validatedData.seats.length !== validatedData.rowCount * validatedData.columnCount) {
        throw new CustomError(
          `Seat count mismatch: expected ${validatedData.rowCount * validatedData.columnCount}, got ${validatedData.seats.length}`,
          400,
        );
      }

      // Create SeatLayout entity for update
      const seatLayout = new SeatLayout(
        new mongoose.Types.ObjectId(validatedData.layoutId),
        validatedData.uuid,
        existingLayout.vendorId, // Retain original vendorId
        validatedData.layoutName,
        validatedData.seatPrice,
        capacity,
        [],
        validatedData.rowCount,
        validatedData.columnCount,
        existingLayout.createdAt,
        new Date(),
      );

      // Map and validate seats
      const seats = validatedData.seats.map((seat) => {
        const normalizedType = seat.type.toLowerCase() as
          | 'regular'
          | 'premium'
          | 'vip'
          | 'unavailable';
        const type = seat.type as 'Regular' | 'Premium' | 'VIP' | 'Unavailable';
        const price =
          normalizedType === 'unavailable'
            ? 0
            : validatedData.seatPrice[normalizedType as 'regular' | 'premium' | 'vip'];
        if (price === undefined) {
          throw new CustomError(`Invalid price for seat type: ${seat.type}`, 400);
        }

        return new Seat(
          null, // _id will be generated by MongoDB
          seat.uuid,
          new mongoose.Types.ObjectId(validatedData.layoutId),
          seat.number,
          type,
          price,
          {
            row: seat.position.row,
            col: seat.position.col,
          },
        );
      });

      // Replace existing seats
      const savedSeats = await this.seatLayoutRepository.replaceSeats(
        new mongoose.Types.ObjectId(validatedData.layoutId),
        seats,
      );
      seatLayout.seatIds = savedSeats.map((seat) => seat._id!);

      // Update SeatLayout with new seatIds and other fields
      return await this.seatLayoutRepository.update(seatLayout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new CustomError(
          `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
          HttpResCode.BAD_REQUEST,
        );
      }
      const errorMessage =
        error instanceof CustomError ? error.message : 'Failed to update seat layout';
      sendResponse(
        res,
        error instanceof CustomError ? error.statusCode : HttpResCode.INTERNAL_SERVER_ERROR,
        errorMessage,
      );
      return null;
    }
  }
}
