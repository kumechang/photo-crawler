import * as unsplash from './unsplash.js';
import * as pexels from './pexels.js';
import * as pixabay from './pixabay.js';
import * as gratisography from './gratisography.js';
import * as shopifyBurst from './shopify.js';
import * as foodiesfeed from './foodiesfeed.js';
import * as pakutaso from './pakutaso.js';
import * as photoac from './photoac.js';
import * as odan from './odan.js';

export const SITES = [
  unsplash,
  pexels,
  pixabay,
  gratisography,
  shopifyBurst,
  foodiesfeed,
  pakutaso,
  photoac,
  odan,
];

export function getSites(ids) {
  if (!ids || ids.length === 0) return SITES;
  const wanted = new Set(ids);
  return SITES.filter((site) => wanted.has(site.id));
}
