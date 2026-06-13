import { GitHubClient, type GitHubClientOptions } from '../../lib/github/github-client.js';
import { GitHubService, type IGitHubService } from './github.service.js';

/**
 * Composition root for the GitHub integration: given a (decrypted) access
 * token, assemble a client and wrap it in the service abstraction. Callers
 * depend on `IGitHubService`, never on construction details.
 */
export function createGitHubService(
  token: string,
  options?: Omit<GitHubClientOptions, 'token'>,
): IGitHubService {
  return new GitHubService(new GitHubClient({ token, ...options }));
}
