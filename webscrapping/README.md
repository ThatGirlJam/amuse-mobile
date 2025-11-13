# Webscrapping Module

This module is used to discover relevant videos (specifically makeup tutorials) that match a user's distinct facial features and traits.

Version 1 focuses on scrapping Youtube videos that match certain facial features that can be categorised into the following:

- Eye Shape: { Almond / Round / Monolid / Hooded / Upturned / Downturned }
- Nose: { Narrow / Medium / Wide}
- Mouth / Lips: { Thin / Medium / Full }

## Key takeaways and improvements

Version 1.1

- low cost of 2800 units vs 10,000 units of free daily limit
- difficulty getting high scores (match > 1 feature) and key words were not specific ("wide" misconstrued as face width rather than nose width)

Version 1.2

- around 35 requests, also low
- 0 score (either scoring system is too strict or queries are inaccurate)
- a lot of results were heavy on the front queries related to eyes

Version 1.3

- implemented caching to save from api queries
- 9 requests, caching saved!
- more specific matches of descriptor to feature (eg almond is for eyes), some 0 scores but that seems to be because matching parts were in title or not exact?
- ^still have issue of only getting videos that are for earlier queries --> could be because of api query limit? Either increase it or limit according to each feature type
