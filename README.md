# Angels for Aid website ♡

A simple website: no build step, no server, and free to host on GitHub Pages.

## Files

| File | What it is |
|---|---|
| `content.js` | **All the words, links, bios and brands. This is the only file you need to edit.** |
| `styles.css` | The look. Brand colors are at the very top, under `:root` |
| `index.html` | Page structure |
| `main.js` | Fills the page from `content.js`. You shouldn't need to touch it |
| `images/` | Headshots and creator photos (square photos look best) |

## Putting it online for free (one-time setup)

1. Make a free GitHub account at github.com. If the username **`angelsforaid`** is available,
   take it, because that makes your web address **https://angelsforaid.github.io**.
2. Create a new **public** repository named exactly **`angelsforaid.github.io`**.
3. On the repository page, click **Add file → Upload files** and drag in everything from this folder.
   Click **Commit changes**.
4. Go to **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**,
   pick **main** and **/(root)**, then **Save**.
5. After about a minute the site is live at https://angelsforaid.github.io.

## Letting your friend edit

- Your friend makes their own free GitHub account.
- In the repository, go to **Settings → Collaborators → Add people** and invite them by username.
- Once they accept, they can edit the site too.

## How to edit (for either of you)

1. On github.com, open the repository and click **`content.js`**.
2. Click the **pencil icon ✏️** (top right of the file).
3. Change the text. Keep the "quotes" and commas.
4. Click **Commit changes**. The site updates in about a minute.

**Adding a photo:** click **Add file → Upload files** and upload the photo into the `images` folder.
Then in `content.js` set `photo: "images/their-photo.jpg"`.

**Adding a person:** copy one whole `{ name: ..., ... },` line, paste it below, and change the details.

**If something breaks:** you probably deleted a quote or comma. Go to the repository's **History**
(the clock icon) to see and undo the last change.

## Newsletter

- The sign-up box is Substack's own, so subscribers go straight into your Substack list.
- To add each week's issue, put it at the top of `newsletter.issues` in `content.js`.
- Later, this can be automated so new Substack posts show up on their own.
