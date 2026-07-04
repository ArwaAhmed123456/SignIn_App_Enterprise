export const SUPPORT_EMAIL = 'support@signinapp.com';

export const SUPPORT_COLLECTIONS = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Set up your site, invite people, and start tracking visits quickly.',
    icon: 'play',
    articles: [
      {
        slug: 'welcome',
        title: 'Welcome!',
        summary: 'A quick overview of the main areas in the admin app.',
        readTime: '3 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'Overview',
            body: 'The admin area is organized around Activity, People, Attendance, Manage, Evacuation, Support, and Profile. Activity is where live sign-ins, pre-registrations, exports, and daily operational actions happen.',
          },
          {
            heading: 'Daily workflow',
            body: 'Most teams start in Activity to monitor who is on site, create manual sign-ins, and pre-register expected visitors. The People area is used to keep member records current, while Attendance supports historical review.',
          },
          {
            heading: 'Support and training',
            body: 'Use Support for help articles, contact options, and product updates. It is designed to mirror the reference experience with collections, searchable articles, and release notes.',
          },
        ],
      },
      {
        slug: 'video-onboarding',
        title: 'Video Onboarding',
        summary: 'A checklist for getting your team ready before launch day.',
        readTime: '4 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'Before rollout',
            body: 'Confirm your sites, visitor groups, and people records are accurate. Decide which teams can create visits, who can run evacuation reports, and what support contact details should be shown in the app.',
          },
          {
            heading: 'Launch checklist',
            body: 'Test a manual sign-in, create a pre-registration, export activity data, and run a practice evacuation. This confirms your key front-desk workflows work before the system is used live.',
          },
        ],
      },
      {
        slug: 'build-the-enclosure',
        title: 'Build the Enclosure',
        summary: 'Prepare reception hardware and the on-site sign-in station.',
        readTime: '5 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'Hardware',
            body: 'Place your kiosk or sign-in tablet in a visible reception area with reliable power and network coverage. If you print badges, verify the printer is on the same network and that printing has been tested.',
          },
          {
            heading: 'Environment',
            body: 'Make sure staff can easily see who has arrived, who is still signed in, and how to access the evacuation workflow. Clear signage helps visitors complete self-service sign-in if you enable it.',
          },
        ],
      },
      {
        slug: 'connect-a-printer',
        title: 'Connect a Printer',
        summary: 'Check badge printing and print-ready sign-in workflows.',
        readTime: '4 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'Printer checks',
            body: 'Verify the printer is powered on, reachable from the server environment, and loaded with the correct media. Run a test sign-in to validate any automated print settings configured for visitor groups.',
          },
          {
            heading: 'Operational notes',
            body: 'If badges do not print, keep the manual sign-in workflow available so front-desk operations continue without interruption. Exported visit data can still be used for auditing while printer issues are resolved.',
          },
        ],
      },
      {
        slug: 'migrating-from-the-receptionist',
        title: 'Migrating from The Receptionist - Your Guide to Sign In App',
        summary: 'A practical migration guide for teams moving from another visitor system.',
        readTime: '6 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'Map your processes',
            body: 'Document who signs in today, which fields are mandatory, how hosts are notified, and how evacuation drills are recorded. Recreating these operational rules first makes migration smoother than copying old screens one by one.',
          },
          {
            heading: 'Go-live strategy',
            body: 'Run both systems in parallel for a short period if needed. Validate live sign-ins, expected visitors, exports, and emergency workflows before fully switching over.',
          },
        ],
      },
    ],
  },
  {
    slug: 'activity-and-visits',
    title: 'Activity And Visits',
    description: 'Everything about live visits, exports, sign-ins, and operational actions.',
    icon: 'activity',
    articles: [
      {
        slug: 'using-the-visit-timeline',
        title: 'Using the Visit Timeline',
        summary: 'Search, filter, export, and manage visits in real time.',
        readTime: '4 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'Filters and search',
            body: 'Use the search box, date range, and group/status filters to narrow the visible visits. Bulk actions apply to the selected rows only, so the visible set is important when exporting or deleting.',
          },
          {
            heading: 'Actions',
            body: 'The visit timeline supports manual sign-in, sign-out, row-level deletion, bulk deletion, and export of filtered data. Use exports for audits, reporting, or handover packs.',
          },
        ],
      },
      {
        slug: 'pre-registering-visitors',
        title: 'Pre-registering Visitors',
        summary: 'Create expected arrivals, upload spreadsheets, and convert visitors to arrivals.',
        readTime: '5 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'Individual pre-registration',
            body: 'Use the individual tab to select a returning visitor or add someone new. Set the visit date, optional arrival time, notes, and whether an invitation should be sent by email.',
          },
          {
            heading: 'Bulk import',
            body: 'Use the bulk import tab when you have a list of visitors to schedule. The template supports names, emails, phone numbers, expected dates, and notes.',
          },
        ],
      },
    ],
  },
  {
    slug: 'emergency-readiness',
    title: 'Emergency Readiness',
    description: 'Guidance for evacuation drills, notifications, and report handling.',
    icon: 'shield',
    articles: [
      {
        slug: 'running-an-evacuation',
        title: 'Running an Evacuation',
        summary: 'Start an evacuation, mark people safe, notify teams, and close the report.',
        readTime: '5 min read',
        updatedAt: '2026-07-04',
        sections: [
          {
            heading: 'During an event',
            body: 'Start the evacuation for the active site, review participants drawn from live sign-ins, and mark each participant safe as they are accounted for. Notification entries are logged against the evacuation record.',
          },
          {
            heading: 'After the event',
            body: 'Add a report note before ending the evacuation so the final record includes context for audits and post-incident review. Completed reports remain available in report history.',
          },
        ],
      },
    ],
  },
];

export const WHATS_NEW_ITEMS = [
  {
    slug: 'activity-reference-refresh',
    title: 'Activity workflow refresh',
    summary: 'The Activity area now aligns more closely with the Sign In App style reference, including stronger visit and pre-registration workflows.',
    date: '2026-07-04',
    bullets: [
      'Updated visit timeline actions, export flow, and empty states.',
      'Improved pre-registration layout with invitation and multi-visit support.',
      'Refined button treatments and filters to better match the reference UX.',
    ],
  },
  {
    slug: 'support-centre-added',
    title: 'Support centre added',
    summary: 'Support now includes dropdown navigation, searchable collections, articles, and a what\'s new view.',
    date: '2026-07-04',
    bullets: [
      'Added Getting Started and article detail pages.',
      'Introduced release notes and searchable support content.',
      'Improved contact options for support teams and admins.',
    ],
  },
  {
    slug: 'evacuation-reporting-upgraded',
    title: 'Evacuation reporting upgraded',
    summary: 'Evacuation records now support persistent reports, notification tracking, and leave-report notes.',
    date: '2026-07-04',
    bullets: [
      'Completed evacuation sessions are stored in the database.',
      'Notification events are tracked against each report.',
      'Leave-report notes are available during and after an evacuation.',
    ],
  },
];

export const flattenSupportArticles = () =>
  SUPPORT_COLLECTIONS.flatMap((collection) =>
    collection.articles.map((article) => ({
      ...article,
      collectionSlug: collection.slug,
      collectionTitle: collection.title,
    }))
  );

export const findSupportCollection = (collectionSlug) =>
  SUPPORT_COLLECTIONS.find((collection) => collection.slug === collectionSlug) || null;

export const findSupportArticle = (articleSlug) =>
  flattenSupportArticles().find((article) => article.slug === articleSlug) || null;

export const searchSupportContent = (query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      collections: SUPPORT_COLLECTIONS,
      articles: flattenSupportArticles(),
      updates: WHATS_NEW_ITEMS,
    };
  }

  return {
    collections: SUPPORT_COLLECTIONS.filter((collection) =>
      `${collection.title} ${collection.description}`.toLowerCase().includes(normalized)
    ),
    articles: flattenSupportArticles().filter((article) =>
      `${article.title} ${article.summary} ${article.sections.map((section) => `${section.heading} ${section.body}`).join(' ')}`
        .toLowerCase()
        .includes(normalized)
    ),
    updates: WHATS_NEW_ITEMS.filter((item) =>
      `${item.title} ${item.summary} ${item.bullets.join(' ')}`.toLowerCase().includes(normalized)
    ),
  };
};
