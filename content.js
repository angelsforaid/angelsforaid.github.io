/*
 * ============================================================
 *  ANGELS FOR AID: SITE CONTENT ♡
 *  This is the only file you need to edit to update the site.
 *  Replace anything marked TODO. Keep the quotes and commas!
 * ============================================================
 */
window.SITE = {
  name: "Angels for Aid",
  tagline: "combining beauty with social awareness",
  mission:
    "A digital humanitarian fashion magazine that aims to connect young women with humanitarianism! " +
    "A4A is a collection of blogs connecting beauty, fashion, and lifestyle with advocacy, relief work, and civic engagement, " +
    "written by everyday people, microinfluencers, and influencers.",
  email: "angelsforaid@gmail.com",

  // Words that scroll across the pink bar at the very top of the page
  ticker: [
    "fashion is political!",
    "get involved with us",
    "read our weekly newsletter",
    "subscribe to our substack",
    "become an angel today"
  ],

  // The three tags in the "about us" section
  pillars: [
    { title: "style",     text: "Real angels share their style and the cause close to their heart. What we wear opens the conversation." },
    { title: "substance", text: "Heaven Sent teaches the issues most people haven't heard of, written by people who have studied, lived or seen them." },
    { title: "aid",       text: "Every story points to the organizations doing the work, so caring turns into helping." }
  ],

  // ---- Social links ----
  socials: {
    tiktok:    { url: "https://www.tiktok.com/@angels4aid",     handle: "@angels4aid" },
    instagram: { url: "https://www.instagram.com/angelsforaid", handle: "@angelsforaid" },
    substack:  { url: "https://angelsforaid.substack.com",      handle: "angelsforaid.substack.com" }
  },

  // ---- Newsletter ----
  newsletter: {
    showSignup: true, // shows Substack's own email sign-up box
    blurb: "Our weekly newsletter, with stories, style and ways to help, delivered to your inbox.",
    // Add each new issue at the TOP of this list. Leave it empty [] to hide this part.
    issues: [
      {
        title: "Angel’s Collection: Socio-Political Works of Fiction",
        date: "2026-10-28",
        url: "https://substack.com/home/post/p-222568560",
        summary: "The Bluest Eye & Beloved - Toni Morrison. Toni Morrison appreciated the history told through slave narratives, such as those written by...Read More"
      }
    ]
  },

  // ---- Editorial board ----
  // lead: true puts that person on their own line at the top (for the CEO).
  // photo: put the image in the /images folder and write "images/filename.jpg"
  // Leave photo as "" to show the person's initials instead.
  board: [
    { name: "Emma Mulcahy", role: "Founder & CEO",   bio: "Emma Mulcahy is an undergraduate student at Cal Poly SLO. She is majoring in political science with a concentration in pre-law.", photo: "images/emma.jpeg", lead: true },
    { name: "Acacia Yoon", role: "Editor and Social Media Lead",   bio: "Acacia Yoon is an undergraduate student at Stanford University. She plans to study bio-medical computation and is on the pre-med track.", photo: "images/acacia.jpg" },
    { name: "Ruby Stone", role: "Illustrator ",   bio: "Ruby Stone is an undergraduate student at Occidental College. She is majoring in psychology and plans to become a psychologist.", photo: "images/bee.jpg" },

  ],

  // ---- Brands we've worked with ----
  // One line per brand. logo: put the image in the /images folder and write "images/brand.png",
  // or leave it "" to show the brand's name instead. url is optional.
  // The section stays hidden until at least one brand is listed. Example:
  //   { name: "Brand Name", url: "https://brand.com", logo: "images/brand.png" },
  brands: [
      { name: "Haloed", url: "http://haloed.store/", logo: "images/haloed.webp" },
      { name: "hæl", url: "https://hael.app", logo: "images/hael.webp" },
  ]
};
