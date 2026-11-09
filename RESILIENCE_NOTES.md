1. Failure testing
| Test | What the user saw | What the server log showed |
| --- | --- | --- |
| Partner stopped | If previously fetched data existed, the user received the last successful data with stale: true. If no cached data existed, the endpoint returned HTTP 502 with a friendly unavailable message | Connection failure, such as ECONNREFUSED, followed by retry attempts |
| Partner slow | The user received the previously saved task data with stale: true, instead of waiting indefinitely or seeing a blank page | Timeout errors after the configured timeout, followed by retry attempts |
| Partner flaky | The partner returned errors on the first two calls and succeeded on the third. The user received live task data with stale: false | HTTP 503 responses on the first two attempts, followed by a successful response |
| Partner returning errors | The user received previously saved data with stale: true, or HTTP 502 if no previous successful data existed | HTTP 500 responses and retry attempts before the request failed |

2. Timeout, retry, delay and worst-case wait
Normal 0.013609 seconds
Slow 10.030245 seconds

We put a 90 second timeout since our provider's API is being hosted on render's free tier which can take up to 60 seconds to respond

3. User Experience Without Resilience Implementation
Without timeout and retry handling, a user opening the transplant coordinator dashboard would experience a long wait when the partner service is slow or unavailable. They would see a loading screen as they await the service. If the partner requests fails, the user would see an error instead of the available information on the dashboard. With the implemented fallback, the user is able to access the dashboard containing the most recent information. Furthermore, the user can try to use the dashboard later when the partner service is up again.

4. What I Did Not Build
I did not implement a circuit breaker. A circuit breaker is a switch that stops calling a partner that has
been failing for a while, and tests it occasionally. My implementation still tries every request three times before using fallback data.