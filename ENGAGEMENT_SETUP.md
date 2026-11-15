# Home popup campaigns

The Asaandukaan mobile app, backend, and platform dashboard now share a remotely managed home-popup contract.

## Release order

1. In `Backendd`, run `npx prisma generate` and `npx prisma migrate deploy` against the intended database, then deploy/restart the API.
2. Build and deploy `Dashboard`.
3. Release a new mobile AAB. Older mobile versions safely ignore the endpoint.
4. In the dashboard, open **Operations → App popups**, create an inactive campaign, verify its preview, then activate it.

No production migration is executed automatically by this repository change.

## Behavior and safety

- `GET /engagement/home-popup` is authenticated, returns only the active campaign, and is marked `no-store`.
- The app waits 1.2 seconds after Home becomes active, then shows at most one campaign. A five-minute cooldown is stored in SecureStore and is also enforced in memory.
- The close action unlocks after five seconds. Leaving Home or backgrounding the app immediately unmounts the popup and video.
- Campaign types are `image`, `image_link`, and `video`. Media and actions require HTTPS URLs without embedded credentials. Video supports YouTube or direct MP4/WebM URLs.
- Server HTML is never rendered. The app owns the layout and only places a validated URL into a constrained media view.
- Only one campaign can be active. A nullable unique database slot protects this rule under concurrent requests; the dashboard requires explicit replacement confirmation.

## API

Mobile: `GET /engagement/home-popup` with a shop-owner access token.

Superadmin:

- `GET /superadmin/app-popups`
- `POST /superadmin/app-popups`
- `PUT /superadmin/app-popups/:id`
- `DELETE /superadmin/app-popups/:id`

Create/update body:

```json
{
  "type": "image_link",
  "active": false,
  "title": "Learn to create a bill",
  "message": "Watch the short guide.",
  "imageUrl": "https://cdn.example.com/tutorial.jpg",
  "videoUrl": null,
  "actionUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "buttonLabel": "Watch tutorial"
}
```

When another campaign is active, the API returns `409` with code `ACTIVE_POPUP_EXISTS`. Repeating the request with `replaceActive: true` atomically deactivates the old campaign.

## Android release checks

Release generation enables R8 minification/resource shrinking and uses `proguard-android-optimize.txt`. Generated Android themes remove deprecated system-bar color attributes, and manifests remain resizable without an orientation lock. Before Play submission, test the release AAB on a phone, a landscape tablet/foldable emulator, gesture navigation, and three-button navigation.
