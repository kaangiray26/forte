# Table of contents
- [Table of contents](#table-of-contents)
- [GET /api/test](#get-apitest)
- [GET /api/auth](#get-apiauth)
- [GET /api/session](#get-apisession)
- [POST /api/cover](#post-apicover)
- [GET /api/search/:query](#get-apisearchquery)
- [GET /api/stream/:id](#get-apistreamid)
- [GET /api/profile/](#get-apiprofile)
- [GET /api/profile/history](#get-apiprofilehistory)
- [POST /api/profile/history/add](#post-apiprofilehistoryadd)

# GET /api/test
Checks if the user session is valid.

Response 200: Session is up to date.  
Content-Type: `application/json`
```
{ success: "session up to date." }
```

Response 401: Session is expired.  
Content-Type: `application/json`
```
{ error: "session expired." }
```
[Back to top](#table-of-contents)

# GET /api/auth
Creates a new session for the user.

Headers:
```
authorization: Basic <base64 encoded username:token>
```

Response 200: User session is created.  
Content-Type: `application/json`
```
{ success: "Authorization successful."}
```

Response 400: `authorization` is missing in headers.  
Content-Type: `application/json`
```
{ error: "Basic authorization not given." }
```

Response 400: `user`, `token` pair is invalid.  
Content-Type: `application/json`
```
{ error: "Authorization failed." }
```
[Back to top](#table-of-contents)

# GET /api/session
Updates the session for the user. If the user session is already up to date, the session is not updated.

Headers:
```
authorization: Basic <base64 encoded username:token>
```

Response 200: User session is already up to date.  
Content-Type: `application/json`
```
{ success: "session up to date." }
```

Response 200: User session is updated.  
Content-Type: `application/json`
```
{ success: "Session refreshed." }
```

Response 400: `authorization` is missing in headers.  
Content-Type: `application/json`
```
{ error: "Basic authorization not given." }
```
[Back to top](#table-of-contents)

# POST /api/cover
[Needs authentication]  
Updates the cover image for the user.

Body:  
Content-Type: `multipart/form-data`
```
FormData {
    cover: <image file>
}
```

Response 200: Cover image is updated.  
Content-Type: `application/json`
```
{cover: <cover filename>}
```
[Back to top](#table-of-contents)

# GET /api/search/:query
[Needs authentication]  
Makes a search query to the database.

Route parameters:
```
query: <search query>
```

Response 200: Search query is successful.  
Content-Type: `application/json`
```
{
    data: [
        {
            cover: <object cover>,
            id: <object id>,
            title: <object title>,
            type: <object type>
        },
        ...
    ]
}
```

* cover field can be a URL string or a filename string.
* type field can be `artist`, `album`, `track`, `playlist`, `user`.

Response 400: `query` is missing in route parameters.  
Content-Type: `application/json`
```
{ error: "Query parameter not given." }
```
[Back to top](#table-of-contents)

# GET /api/stream/:id
[Needs authentication]  
Streams the audio file for the track.

Route parameters:
```
id: <track id>
```

Response 200: Stream is successful.  
Content-Type: `audio/*`
```
<streamed audio file>
```

Response 400: `id` is missing in route parameters.  
Content-Type: `application/json`
```
{ error: "ID parameter not given." }
```
[Back to top](#table-of-contents)

# GET /api/profile/
[Needs authentication]  
Gets the profile information for the current user.

Response 200: Profile information retrieved.  
Content-Type: `application/json`
```
{
    profile: {
        username: <username>,
        cover: <cover filename>,
    }
}
```

Response 400: User session is not up to date.  
Content-Type: `application/json`
```
{ error: "User session not up to date." }
```
[Back to top](#table-of-contents)

# GET /api/profile/history
[Needs authentication]  
Gets the listening history for the current user.

Response 200: Listening history retrieved.  
Content-Type: `application/json`
```
{
    tracks: [
        {
            type: "track"
            id: <track id>,
            title: <track title>,
            cover: <track cover>,
            artist: <track artist id>,
            album: <track album id>,
            track_position: <track position in album>,
            disc_number: <track disc number in album>,
            path: <track path>,
        },
        ...
    ]
}
```

* Tracks are sorted by the most recent first.

Response 400: User session is not up to date.  
Content-Type: `application/json`
```
{ error: "User not found." }
```
[Back to top](#table-of-contents)

# POST /api/profile/history/add
[Needs authentication]  
Adds a track to the listening history for the current user.

Body:  
Content-Type: `application/json`
```
{
    track: <track id>
}
```

Response 200: Track added to listening history.  
Content-Type: `application/json`
```
{ success: "History updated." }
```

Response 400: `track` is missing in body.  
Content-Type: `application/json`
```
{ error: "Track not given." }
```

Response 400: Track is not found.  
Content-Type: `application/json`
```
{ error: "Track not found." }
```
[Back to top](#table-of-contents)