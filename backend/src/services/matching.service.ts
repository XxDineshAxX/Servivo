/**
 * Matching Service
 *
 * Core algorithm for finding the nearest available pro for a booking request.
 * Uses the Haversine formula to calculate distances and ranks candidates
 * by proximity, then notifies them sequentially until one accepts.
 */

import { PrismaClient, Pro, ProAvailabilityStatus, ServiceCategory } from '@prisma/client';
import { GeoService } from './geo.service';
import { NotificationService } from './notification.service';
import { SocketService } from './socket.service';
import { logger } from '../utils/logger';
import { MATCHING_RADIUS_KM, BOOKING_RESPONSE_TIMEOUT_MS } from '../config/constants';

const prisma = new PrismaClient();

export interface MatchCandidate {
  pro: Pro;
  distanceKm: number;
  estimatedArrivalMinutes: number;
}

export class MatchingService {
  constructor(
    private readonly geoService: GeoService,
    private readonly notificationService: NotificationService,
    private readonly socketService: SocketService,
  ) {}

  /**
   * Find nearby available pros for a given service category and location.
   * Returns candidates sorted by distance (nearest first).
   */
  async findNearbyPros(
    lat: number,
    lng: number,
    serviceCategory: ServiceCategory,
    radiusKm = MATCHING_RADIUS_KM,
  ): Promise<MatchCandidate[]> {
    const availablePros = await prisma.pro.findMany({
      where: {
        availabilityStatus: ProAvailabilityStatus.AVAILABLE,
        currentLat: { not: null },
        currentLng: { not: null },
        isVerified: true,
        services: {
          some: {
            serviceType: { category: serviceCategory },
            isActive: true,
          },
        },
      },
      include: { services: { include: { serviceType: true } } },
    });

    const candidates: MatchCandidate[] = availablePros
      .map((pro) => {
        const distanceKm = this.geoService.haversineDistance(
          lat, lng,
          pro.currentLat!, pro.currentLng!,
        );
        const estimatedArrivalMinutes = this.geoService.estimateDriveMinutes(distanceKm);
        return { pro, distanceKm, estimatedArrivalMinutes };
      })
      .filter((c) => c.distanceKm <= radiusKm && c.estimatedArrivalMinutes <= 60)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    logger.info(`Found ${candidates.length} candidates within ${radiusKm}km`);
    return candidates;
  }

  /**
   * Sequentially notify pros (nearest first) until one accepts or all decline.
   * Returns the accepting pro's ID, or null if no one accepts.
   */
  async dispatchBooking(bookingId: string, candidates: MatchCandidate[]): Promise<string | null> {
    for (const candidate of candidates) {
      const proId = candidate.pro.id;

      await prisma.bookingProResponse.create({
        data: { bookingId, proId },
      });

      // Push real-time notification and wait for response
      await this.notificationService.sendBookingRequest(proId, bookingId);
      this.socketService.emitToUser(proId, 'booking:request', { bookingId });

      const accepted = await this.waitForProResponse(bookingId, proId);

      if (accepted) {
        logger.info(`Booking ${bookingId} accepted by pro ${proId}`);
        return proId;
      }

      logger.info(`Pro ${proId} declined/timed out for booking ${bookingId}`);
    }

    return null;
  }

  /**
   * Polls the DB for a pro's response within the timeout window.
   */
  private async waitForProResponse(bookingId: string, proId: string): Promise<boolean> {
    const deadline = Date.now() + BOOKING_RESPONSE_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const response = await prisma.bookingProResponse.findUnique({
        where: { bookingId_proId: { bookingId, proId } },
      });

      if (response?.accepted !== null && response?.accepted !== undefined) {
        return response.accepted;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return false;
  }
}
