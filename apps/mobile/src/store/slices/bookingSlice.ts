import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Booking, CreateBookingInput } from '@servivo/shared-types';
import { BookingService } from '../../services/api.service';

interface BookingState {
  activeBooking: Booking | null;
  history: Booking[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  activeBooking: null,
  history: [],
  isLoading: false,
  error: null,
};

export const createBooking = createAsyncThunk(
  'booking/create',
  async (input: CreateBookingInput) => {
    return BookingService.create(input);
  }
);

export const fetchActiveBooking = createAsyncThunk(
  'booking/fetchActive',
  async () => {
    return BookingService.getActive();
  }
);

export const fetchBookingHistory = createAsyncThunk(
  'booking/fetchHistory',
  async () => {
    return BookingService.getHistory();
  }
);

export const respondToBooking = createAsyncThunk(
  'booking/respond',
  async ({ bookingId, accept }: { bookingId: string; accept: boolean }) => {
    return BookingService.respond(bookingId, accept);
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Called by Socket.IO when booking status changes
    bookingUpdated(state, action: PayloadAction<Booking>) {
      if (state.activeBooking?.id === action.payload.id) {
        state.activeBooking = action.payload;
      }
    },
    clearActiveBooking(state) {
      state.activeBooking = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to create booking';
      })
      .addCase(fetchActiveBooking.fulfilled, (state, action) => {
        state.activeBooking = action.payload;
      })
      .addCase(fetchBookingHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { bookingUpdated, clearActiveBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
