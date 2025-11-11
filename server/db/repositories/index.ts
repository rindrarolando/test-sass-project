import { TextRepository } from './textRepository.js';

// Singleton instance
let textRepo: TextRepository | undefined;

// Getter with lazy initialization
export function getTextRepository(): TextRepository {
  if (!textRepo) {
    textRepo = new TextRepository();
  }
  return textRepo;
}

// Cleanup function for testing purposes
export function clearRepositories(): void {
  textRepo = undefined;
} 



