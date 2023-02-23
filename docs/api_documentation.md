# GET /api/test
Checks if the user session is valid.

Response 200:
```
{ "success": "session up to date." }
```

Response 401:
```
{ "error": "session expired." }
```

# GET /api/auth
Creates a new session for the user.

Headers:
```
authorization: Basic <base64 encoded username:token>
```

Response 200:
```
{"success": "Authorization successful."}
```

Response 400: `authorization` is missing in headers.
```
{"error": "Basic authorization not given."}
```

Response 400: `user`, `token` pair is invalid.
```
{"error": "Authorization failed."}
```

# GET /api/session
Updates the session for the user. If the user session is already up to date, the session is not updated.

Headers:
```
authorization: Basic <base64 encoded username:token>
```

Response 200: User session is already up to date.
```
{ "success": "session up to date." }
```

Response 200: User session is updated.
```
{"success": "Session refreshed."}
```

Response 400: `authorization` is missing in headers.
```
{"error": "Basic authorization not given."}
```