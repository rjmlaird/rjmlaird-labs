export const site = {
  name: 'Labs',
  author: 'Ryan Laird',
  url: 'https://labs.rjmlaird.co.uk',
  mainSite: 'https://rjmlaird.co.uk',
  contactEmail: 'ryan@impactorbit.co', // change here if you prefer another address
  description: 'Small, careful, interactive science tools and visual explainers by Ryan Laird.',
  nav: [
    { href: '/labs', label: 'Labs' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Feedback' },
  ],
  /** Every public route, used for sitemap.xml. */
  routes: ['/', '/labs', '/labs/earthquakes', '/about', '/contact', '/privacy'],
};
