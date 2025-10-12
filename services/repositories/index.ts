import { Platform } from 'react-native';
import type { SeriesRepository, SermonRepository } from './types';

export type { SeriesRepository, SermonRepository } from './types';

export const seriesRepository: SeriesRepository = Platform.select<any>({
  web: require('./seriesRepository.web').seriesRepository,
  default: require('./seriesRepository.native').seriesRepository,
});

export const sermonRepository: SermonRepository = Platform.select<any>({
  web: require('./sermonRepository.web').sermonRepository,
  default: require('./sermonRepository.native').sermonRepository,
});

// Agent search repository (native only for now)
export { agentSearchRepository } from './agentSearchRepository';
