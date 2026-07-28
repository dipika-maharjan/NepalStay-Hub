jest.mock("../../repositories/booking.repository", () => ({
  BookingRepository: jest.fn().mockImplementation(() => ({
    getBookingById: jest.fn(),
    updateBookingFields: jest.fn(),
    getBookedRoomsCount: jest.fn(),
  })),
}));

jest.mock("../../repositories/bookingExtra.repository", () => ({
  BookingExtraRepository: jest.fn().mockImplementation(() => ({
    deleteByBookingId: jest.fn(),
    createBookingExtras: jest.fn(),
  })),
}));

jest.mock("../../repositories/roomType.repository", () => ({
  RoomTypeRepository: jest.fn().mockImplementation(() => ({
    getRoomTypeById: jest.fn(),
  })),
}));

jest.mock("../../repositories/optionalExtra.repository", () => ({
  OptionalExtraRepository: jest.fn().mockImplementation(() => ({
    getOptionalExtraById: jest.fn(),
  })),
}));

jest.mock("../../repositories/accommodation.repository", () => ({
  AccommodationRepository: jest.fn().mockImplementation(() => ({
    getAccommodationById: jest.fn(),
  })),
}));

import { BookingService } from "../../services/booking.service";
import { BookingRepository } from "../../repositories/booking.repository";
import { BookingExtraRepository } from "../../repositories/bookingExtra.repository";
import { RoomTypeRepository } from "../../repositories/roomType.repository";
import { OptionalExtraRepository } from "../../repositories/optionalExtra.repository";
import { AccommodationRepository } from "../../repositories/accommodation.repository";

describe("BookingService.updateBooking", () => {
  let bookingRepository: any;
  let bookingExtraRepository: any;
  let roomTypeRepository: any;
  let optionalExtraRepository: any;
  let accommodationRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    bookingRepository = new BookingRepository();
    bookingExtraRepository = new BookingExtraRepository();
    roomTypeRepository = new RoomTypeRepository();
    optionalExtraRepository = new OptionalExtraRepository();
    accommodationRepository = new AccommodationRepository();

    bookingRepository.getBookingById = jest.fn().mockResolvedValue({
      _id: "booking-1",
      bookingStatus: "pending",
      checkIn: new Date(new Date().setHours(0, 0, 0, 0)),
      accommodationId: { _id: "accommodation-1" },
    });
    bookingRepository.updateBookingFields = jest
      .fn()
      .mockResolvedValue({ _id: "booking-1" });
    bookingRepository.getBookedRoomsCount = jest.fn().mockResolvedValue(0);

    accommodationRepository.getAccommodationById = jest.fn().mockResolvedValue({
      _id: "accommodation-1",
      isActive: true,
    });

    roomTypeRepository.getRoomTypeById = jest.fn().mockResolvedValue({
      _id: "room-type-1",
      isActive: true,
      accommodationId: "accommodation-1",
      pricePerNight: 100,
      maxGuests: 2,
      totalRooms: 10,
    });
  });

  it("allows editing a booking when the check-in date is today", async () => {
    const service = new BookingService({
      bookingRepository,
      bookingExtraRepository,
      roomTypeRepository,
      optionalExtraRepository,
      accommodationRepository,
    });

    await expect(
      service.updateBooking("booking-1", {
        roomTypeId: "room-type-1",
        checkIn: new Date(new Date().setHours(0, 0, 0, 0)),
        checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
        guests: 1,
        roomsBooked: 1,
        extras: [],
        specialRequest: "Need early check-in",
      }),
    ).resolves.toBeDefined();

    expect(bookingRepository.updateBookingFields).toHaveBeenCalled();
  });
});
