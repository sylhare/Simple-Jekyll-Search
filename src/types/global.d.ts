import { SearchOptions, SimpleJekyllSearchInstance } from '../utils/types';

declare global {
  interface Window {
    SimpleJekyllSearch: (options: SearchOptions) => SimpleJekyllSearchInstance;
  }
} 