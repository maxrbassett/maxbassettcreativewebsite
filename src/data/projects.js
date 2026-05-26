// Drop screenshot images into /public/dev/ matching the `image` filenames.
// Suggested screenshot size: 1600x900 (16:9), under ~400KB.

export const projects = [
  {
    slug: 'typenex',
    title: 'Typenex Medical',
    url: 'https://typenex.com',
    image: '/dev/typenex.png',
    year: '',
    role: 'Lead Developer',
    description:
      "Lead web developer on the public site for Typenex Medical, a medical device company supplying hospitals, clinics, and surgery centers with the tools they need to provide better care. I migrated the site from a static Ember.js build into a data-driven Gatsby and React frontend, backed by an Apollo GraphQL server I helped build from the ground up and connected directly to the company's internal PIM. I've also contributed to the site's automated test suite, which runs as part of a Jenkins CI/CD pipeline on every build. I partner with the marketing team in Figma to keep the site evolving alongside the brand.",
    stack: ['Gatsby', 'React', 'Apollo GraphQL', 'Jenkins', 'JavaScript'],
  },
  {
    slug: 'artchi',
    title: 'Emerging Artists Chicago',
    url: 'https://artchi.com',
    image: '/dev/artchi.png',
    year: '',
    role: 'Lead Developer',
    description:
      'Lead developer on the main site for Emerging Artists Chicago, a nonprofit that helps up-and-coming musicians find their footing. Built with Gatsby.js and powered by a custom CMS I was a core contributor on, making the entire site data-driven. I built a custom YouTube-powered video player and customized a third-party calendar widget so site managers can publish upcoming events without touching code. I work directly with the marketing team in Figma on ongoing updates.',
    stack: ['Gatsby', 'React', 'Custom CMS', 'JavaScript'],
  },
  {
    slug: 'timpine-therapy',
    title: 'Timpine Therapy',
    url: 'https://timpinetherapy.com',
    image: '/dev/timpinetherapy.png',
    year: '',
    role: 'Sole Developer',
    description:
      'Sole developer on the public site for Timpine Therapy, a therapy and counseling practice. Designed, built, and deployed the site end-to-end in React.js — from initial planning through production.',
    stack: ['React', 'JavaScript'],
  },
  {
    slug: 'chicago-venture',
    title: 'Chicago Venture',
    url: 'https://chicagoventure.com',
    image: '/dev/chicagoventure.png',
    year: '',
    role: 'Maintainer & Contributor',
    description:
      'Contributing developer and lead maintainer of the public site for Chicago Venture Partners, built with Ember.js. I work directly with the marketing team in Figma to keep the site current as their brand and content evolve.',
    stack: ['Ember.js', 'JavaScript'],
  },
  {
    slug: 'emergent-trading',
    title: 'Emergent Trading',
    url: 'https://emergenttrading.com',
    image: '/dev/emergent.png',
    year: '',
    role: 'Maintainer & Contributor',
    description:
      'Contributing developer and lead maintainer of the public site for Emergent Trading, a Chicago-based algorithmic trading firm. I partner with the marketing team in Figma to roll out design and content updates as the company grows.',
    stack: ['Ember.js', 'JavaScript'],
  }
]

export const internalToolsBlurb =
  "Behind the public sites above, I also work full-stack on the systems that power them — building backend tools and internal applications in Django, Node.js, React, and Apollo GraphQL. Beyond client-facing work, I've contributed to a wide range of internal platforms for automating workflows and managing large datasets across teams."
