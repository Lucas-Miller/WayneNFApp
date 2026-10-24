// services/api/spots.api.ts

import { apiClient } from './client';
import { Spot, CreateSpotRequest, CreateSpotResponse } from '@/types';

/**
 * Camping spots API service
 */
export const spotsApi = {
  /**
   * Get all saved spots for the authenticated user
   */
  async getSpots(): Promise<Spot[]> {
    // The API encodes an empty list as null
    return (await apiClient.get<Spot[] | null>('/spots', true)) ?? [];
  },

  /**
   * Create a new camping spot
   */
  async createSpot(spot: CreateSpotRequest): Promise<CreateSpotResponse> {
    return apiClient.post<CreateSpotResponse>('/spots', spot, true);
  },

  /**
   * Delete a camping spot by ID
   */
  async deleteSpot(spotId: number): Promise<void> {
    return apiClient.delete(`/spots/${spotId}`, true);
  },
};
