import SimpleJekyllSearchClass from './SimpleJekyllSearch';
import { SearchOptions, SimpleJekyllSearchInstance } from './utils/types';

function SimpleJekyllSearch(options: SearchOptions): SimpleJekyllSearchInstance {
  const instance = new SimpleJekyllSearchClass();
  return instance.init(options);
}

export default SimpleJekyllSearch;