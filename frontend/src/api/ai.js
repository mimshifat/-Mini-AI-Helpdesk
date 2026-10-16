import { api } from './client';

export const aiApi = {
  getSuggestion: (title, description) =>
    api.post('/ai/suggest/', { title, description }),

  getDraftResolution: (title, description, category) =>
    api.post('/ai/draft-resolution/', { title, description, category }),
};
