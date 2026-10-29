Blind Test Report

What happened when our README was tested

Our README has not been tested by an outside team yet. Team 3 (PharmaLink) has our API key but has not told us whether they tried our API or our README, so we have no result, no time taken and no record of where they got stuck.

We did test another team's API. Harry called Team 1's (Kazibuddy) live `/api/artisans` endpoint with the key they issued us and got **403 Forbidden** ("This API key is not allowed to use this endpoint"). Team 1 reported a server issue and asked us to retry, but the same error came back about 30 minutes later, so we did not get a working response. This was not a strict blind test, because we had the URL and key through chat, and Team 1 is probably within our ring.

 What we fixed, and what we are flagging

We have not made any documentation fixes yet. Gaps we found in our README and have not closed:

- The auth section is empty (no API key header or way to get a key).
- There are no local run instructions.
- The quickstart uses `localhost` instead of the live URL.
- Two examples contain invalid JSON, and valid `reservation_status` values and 401/403 error examples are missing.

Reading Team 1's documents also showed that their README, `openapi.yaml` and rendered docs page disagree about API keys, endpoints and booking fields.

Summary

The blind test did not produce a working result. Team 3 has not responded, and our one live call, to Team 1's API, failed with a 403. Checking our own README the way a stranger would, it would not work today because it has no auth instructions, no local run steps, and a quickstart that points to localhost. Next we will fix those gaps, ask Team 3 (or another team outside our ring) to follow the README with no help, and update this report with the result.