import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractInstagramShortcode,
  extractInstagramUsername,
  extractYouTubeHandle,
  linkHostIsInstagram,
  normalizeSocialLinks,
  normalizeYouTubeChannelUrl,
  parseSocialInput,
  parseYouTubeSettingsInput,
  resolveConfiguredInstagramAccounts,
  youtubeSubscribeUrl,
} from "../src/lib/social.ts";
import {
  parseInstagramDateFromAccessibility,
  parseInstagramProfileHtml,
  parseInstagramWebProfileJson,
  parseYouTubeChannelHtml,
  parseYouTubeRssXml,
  planSocialPullDrafts,
} from "../src/lib/social-pull.ts";

describe("site links", () => {
  it("fills the usual labels and addresses when nothing is stored", () => {
    const links = normalizeSocialLinks({
      instagramUrl: "https://www.instagram.com/iisscampus/",
      scixcomInstagramUrl: "https://www.instagram.com/scixcom.27/",
    });
    assert.equal(links.schoolLabel, "iiss.ae");
    assert.equal(links.schoolUrl, "https://iiss.ae");
    assert.equal(links.instagramLabel, "Instagram");
    assert.equal(links.scixcomLabel, "SciXcom");
    assert.deepEqual(links.extraLinks, []);
  });

  it("keeps a renamed council account and drops an unsafe address", () => {
    const links = normalizeSocialLinks({
      scixcomLabel: "SciXcom 28",
      scixcomInstagramUrl: "javascript:alert(1)",
      extraLinks: [{ id: "news", label: "Newsletter", url: "https://example.com/news" }],
    });
    assert.equal(links.scixcomLabel, "SciXcom 28");
    assert.equal(links.scixcomInstagramUrl, "https://www.instagram.com/scixcom.27/");
    assert.equal(links.extraLinks[0]?.label, "Newsletter");
    assert.equal(links.extraLinks[0]?.url, "https://example.com/news");
  });

  it("saves a new label and link for the council account", () => {
    const form = new FormData();
    form.set("scixcomLabel", "SciXcom 28");
    form.set("scixcomInstagramUrl", "https://www.instagram.com/scixcom.28/");
    form.set("extraLinks", JSON.stringify([{ id: "site", label: "Results", url: "https://example.com/results" }]));
    const parsed = parseSocialInput(form);
    assert.equal("error" in parsed, false);
    if ("error" in parsed) return;
    assert.equal(parsed.links.scixcomLabel, "SciXcom 28");
    assert.equal(parsed.links.scixcomInstagramUrl, "https://www.instagram.com/scixcom.28/");
    assert.equal(parsed.links.schoolLabel, "iiss.ae");
    assert.equal(parsed.links.extraLinks[0]?.label, "Results");
  });

  it("rejects an extra link that has a label and no address", () => {
    const form = new FormData();
    form.set("extraLinks", JSON.stringify([{ label: "Results", url: "" }]));
    const parsed = parseSocialInput(form);
    assert.deepEqual(parsed, { error: "Each extra link needs a label and an https:// address." });
  });

  it("identifies instagram hosts correctly", () => {
    assert.equal(linkHostIsInstagram("https://www.instagram.com/p/DB123/"), true);
    assert.equal(linkHostIsInstagram("https://notinstagram.com/post"), false);
  });

  it("defaults and normalizes the YouTube channel settings", () => {
    const defaults = normalizeSocialLinks({});
    assert.equal(defaults.youtubeLabel, "IISS Boys");
    assert.equal(defaults.youtubeUrl, "https://www.youtube.com/@iissboys");
    assert.equal(defaults.youtubeEnabled, true);
    assert.equal(youtubeSubscribeUrl(defaults.youtubeUrl), "https://www.youtube.com/@iissboys?sub_confirmation=1");
    assert.equal(extractYouTubeHandle(defaults.youtubeUrl), "@iissboys");

    assert.equal(normalizeYouTubeChannelUrl("@iissboys"), "https://www.youtube.com/@iissboys");
    assert.equal(normalizeYouTubeChannelUrl("https://evil.example/@iissboys"), null);

    const form = new FormData();
    form.set("youtubeFormPresent", "1");
    form.set("youtubeLabel", "IISS Boys Media");
    form.set("youtubeUrl", "https://www.youtube.com/@iissboys?sub_confirmation=1");
    form.set("youtubeDescription", "Campus highlights and council videos.");
    const parsed = parseYouTubeSettingsInput(form);
    assert.equal("error" in parsed, false);
    if ("error" in parsed) return;
    assert.equal(parsed.youtubeUrl, "https://www.youtube.com/@iissboys");
    assert.equal(parsed.youtubeEnabled, false);

    const badForm = new FormData();
    badForm.set("youtubeUrl", "https://vimeo.com/iissboys");
    const badParsed = parseYouTubeSettingsInput(badForm);
    assert.equal("error" in badParsed, true);
  });

  it("extracts Instagram handles and post/reel shortcodes cleanly", () => {
    assert.equal(extractInstagramUsername("https://www.instagram.com/scixcom.27/?hl=en"), "scixcom.27");
    assert.equal(extractInstagramUsername("@iisscampus"), "iisscampus");
    assert.equal(extractInstagramUsername("https://www.instagram.com/p/ABC1234/"), null);

    assert.equal(extractInstagramShortcode("https://www.instagram.com/p/DB123abc/?utm_source=ig"), "DB123abc");
    assert.equal(extractInstagramShortcode("https://www.instagram.com/scixcom.27/reel/C9xyz987/"), "C9xyz987");
    assert.equal(extractInstagramShortcode("https://example.com/p/DB123abc/"), null);

    const links = normalizeSocialLinks({
      scixcomLabel: "SciXcom 27",
      scixcomInstagramUrl: "https://www.instagram.com/scixcom.27/",
      instagramLabel: "Campus Council",
      instagramUrl: "https://www.instagram.com/iisscampus/",
    });
    const accounts = resolveConfiguredInstagramAccounts(links);
    assert.equal(accounts.length, 2);
    assert.deepEqual(
      accounts.map((a) => ({ key: a.key, username: a.username, councilTag: a.councilTag })),
      [
        { key: "scixcom", username: "scixcom.27", councilTag: "12th" },
        { key: "campus", username: "iisscampus", councilTag: "11th" },
      ],
    );
  });
});

describe("social auto-pull & YouTube parsers", () => {
  it("parses Instagram Relay profile HTML posts and reels", () => {
    const payload = {
      require: [
        [
          "RelayPrefetchedStreamCache",
          "next",
          [],
          [
            "adp_PolarisProfilePostsTabContentQueryRelayPreloader",
            {
              __bbox: {
                result: {
                  data: {
                    xdt_api__v1__feed__user_timeline_graphql_connection: {
                      polaris_ordered_timeline_connection: true,
                      edges: [
                        {
                          node: {
                            code: "DLREEL111",
                            product_type: "clips",
                            media_type: 2,
                            caption: { text: "Sports Day Reel" },
                            display_uri: "https://scontent.cdninstagram.com/v/reel.jpg",
                            accessibility_caption: "Video by scixcom.27 on October 14, 2026.",
                          },
                        },
                        {
                          node: {
                            code: "DLPOST222",
                            product_type: "feed",
                            media_type: 1,
                            caption: { text: "Science Exhibition" },
                            display_uri: "https://scontent.cdninstagram.com/v/post.jpg",
                            taken_at: 1760500000,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
        ],
      ],
    };
    const html = `<html><script type="application/json" data-sjs>${JSON.stringify(payload)}</script></html>`;
    const parsed = parseInstagramProfileHtml(html, "scixcom.27");
    assert.equal(parsed.hasProfilePayload, true);
    assert.equal(parsed.items.length, 2);
    assert.equal(parsed.items[0]?.kind, "reel");
    assert.equal(parsed.items[0]?.instagramUrl, "https://www.instagram.com/reel/DLREEL111/");
    assert.equal(parsed.items[0]?.publishedOn, "2026-10-14T12:00:00.000Z");
    assert.equal(parsed.items[1]?.kind, "post");
    assert.equal(parsed.items[1]?.instagramUrl, "https://www.instagram.com/p/DLPOST222/");
    assert.equal(parseInstagramDateFromAccessibility("Photo by campus on March 5, 2026."), "2026-03-05T12:00:00.000Z");
  });

  it("parses Instagram web_profile_info JSON fallback", () => {
    const parsed = parseInstagramWebProfileJson(
      {
        data: {
          user: {
            is_private: false,
            edge_owner_to_timeline_media: {
              edges: [
                {
                  node: {
                    shortcode: "WEBPOST99",
                    is_video: false,
                    display_url: "https://scontent.cdninstagram.com/v/web.jpg",
                    taken_at_timestamp: 1760600000,
                    edge_media_to_caption: { edges: [{ node: { text: "Council Assembly" } }] },
                  },
                },
              ],
            },
          },
        },
      },
      "iisscampus",
    );
    assert.equal(parsed.isPrivate, false);
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0]?.code, "WEBPOST99");
    assert.equal(parsed.items[0]?.caption, "Council Assembly");
  });

  it("plans only new drafts and skips existing or cross-account duplicates", () => {
    const accounts = resolveConfiguredInstagramAccounts(normalizeSocialLinks({}));
    const plan = planSocialPullDrafts({
      existingPosts: [
        { instagramUrl: "https://www.instagram.com/p/EXISTING1/?utm_source=ig_web_copy_link" },
        { instagramUrl: "https://www.instagram.com/reel/REELOLD2/" },
      ],
      accountsResults: [
        {
          account: accounts[0]!,
          result: {
            ok: true,
            profileFound: true,
            items: [
              {
                code: "EXISTING1",
                kind: "reel",
                instagramUrl: "https://www.instagram.com/reel/EXISTING1/",
                caption: "Already stored under /p/",
                thumbnailUrl: null,
                publishedOn: "2026-10-01T12:00:00.000Z",
                username: "scixcom.27",
              },
              {
                code: "FRESH100",
                kind: "reel",
                instagramUrl: "https://www.instagram.com/reel/FRESH100/",
                caption: "Fresh SciXcom Reel",
                thumbnailUrl: null,
                publishedOn: "2026-10-12T12:00:00.000Z",
                username: "scixcom.27",
              },
            ],
          },
        },
        {
          account: accounts[1]!,
          result: {
            ok: true,
            profileFound: true,
            items: [
              {
                code: "FRESH100",
                kind: "reel",
                instagramUrl: "https://www.instagram.com/reel/FRESH100/",
                caption: "Cross-posted duplicate",
                thumbnailUrl: null,
                publishedOn: "2026-10-12T12:00:00.000Z",
                username: "iisscampus",
              },
              {
                code: "FRESH200",
                kind: "post",
                instagramUrl: "https://www.instagram.com/p/FRESH200/",
                caption: "Fresh 11th Post",
                thumbnailUrl: null,
                publishedOn: "2026-10-15T12:00:00.000Z",
                username: "iisscampus",
              },
            ],
          },
        },
      ],
      activeTermLabel: "2026-2027",
    });

    assert.equal(plan.skippedExistingCount, 2);
    assert.equal(plan.draftsToCreate.length, 2);
    assert.equal(plan.draftsToCreate[0]?.pinned, false);
    assert.equal(plan.draftsToCreate[0]?.councilTag, "12th");
    assert.equal(plan.draftsToCreate[0]?.academicYear, "2026-2027");
    assert.equal(plan.draftsToCreate[1]?.pinned, false);
    assert.equal(plan.draftsToCreate[1]?.councilTag, "11th");
    assert.equal(plan.accountSummaries[0]?.addedCount, 1);
    assert.equal(plan.accountSummaries[0]?.skippedCount, 1);
    assert.equal(plan.accountSummaries[1]?.addedCount, 1);
    assert.equal(plan.accountSummaries[1]?.skippedCount, 1);

    const partialPlan = planSocialPullDrafts({
      existingPosts: [],
      accountsResults: [
        {
          account: accounts[0]!,
          result: {
            ok: true,
            profileFound: true,
            items: [
              {
                code: "SOLO1",
                kind: "post",
                instagramUrl: "https://www.instagram.com/p/SOLO1/",
                caption: "Only from 12th",
                thumbnailUrl: null,
                publishedOn: null,
                username: "scixcom.27",
              },
            ],
          },
        },
        {
          account: accounts[1]!,
          result: { ok: false, reason: "@iisscampus is unavailable." },
        },
      ],
      activeTermLabel: null,
      now: new Date("2026-11-12T08:00:00.000Z"),
    });
    assert.equal(partialPlan.draftsToCreate.length, 1);
    assert.equal(partialPlan.draftsToCreate[0]?.pinned, false);
    assert.equal(partialPlan.accountSummaries[1]?.ok, false);
  });

  it("parses YouTube channel metadata HTML and video RSS XML", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="IISS Boys - YouTube" />
          <meta property="og:image" content="https://yt3.googleusercontent.com/avatar.jpg" />
        </head>
        <script>{"externalId":"UCgII3w99lshed64Ut76kIxA","channelMetadataRenderer":{"title":"IISS Boys"},"subscriberCountText":{"content":"4 subscribers"}}</script>
      </html>
    `;
    const meta = parseYouTubeChannelHtml(html, "https://www.youtube.com/@iissboys");
    assert.equal(meta.channelId, "UCgII3w99lshed64Ut76kIxA");
    assert.equal(meta.title, "IISS Boys");
    assert.equal(meta.handle, "@iissboys");
    assert.equal(meta.avatarUrl, "https://yt3.googleusercontent.com/avatar.jpg");
    assert.equal(meta.subscriberText, "4 subscribers");

    const xml = `
      <feed>
        <entry>
          <yt:videoId>vid12345</yt:videoId>
          <title>Annual Day &amp; Council Investiture</title>
          <published>2026-10-20T10:00:00+00:00</published>
          <media:group><media:thumbnail url="https://i.ytimg.com/vi/vid12345/hqdefault.jpg" /></media:group>
        </entry>
      </feed>
    `;
    const videos = parseYouTubeRssXml(xml);
    assert.equal(videos.length, 1);
    assert.equal(videos[0]?.title, "Annual Day & Council Investiture");
    assert.equal(videos[0]?.url, "https://www.youtube.com/watch?v=vid12345");
  });
});
