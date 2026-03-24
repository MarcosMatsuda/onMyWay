import { httpClient } from '@infrastructure/http';
import { LocationRepository } from './location.repository';
import { ParentRepository } from './parent.repository';
import { SchoolRepository } from './school.repository';

export const locationRepository = new LocationRepository(httpClient);
export const parentRepository = new ParentRepository(httpClient);
export const schoolRepository = new SchoolRepository(httpClient);

export { LocationRepository } from './location.repository';
export { ParentRepository } from './parent.repository';
export { SchoolRepository } from './school.repository';
