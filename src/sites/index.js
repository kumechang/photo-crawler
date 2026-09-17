import * as unsplash from './unsplash.js';
import * as pexels from './pexels.js';
import * as pixabay from './pixabay.js';
import * as kaboompics from './kaboompics.js';
import * as gratisography from './gratisography.js';
import * as shopifyBurst from './shopify.js';
import * as foodiesfeed from './foodiesfeed.js';

export const SITES = [
  unsplash,
  pexels,
  pixabay,
  kaboompics,
  gratisography,
  shopifyBurst,
  foodiesfeed,
];

export function getSites(ids) {
  if (!ids || ids.length === 0) return SITES;
  const wanted = new Set(ids);
  return SITES.filter((site) => wanted.has(site.id));
}
