export const environment = {
  production: false,
  /**
   * Base URL of the Mentorly backend API.
   * When empty (or unreachable) the app gracefully falls back to local mock data.
   * Expected endpoint: `${apiUrl}/teachers` returning a Teacher[] payload.
   */
  apiUrl: '',
};
