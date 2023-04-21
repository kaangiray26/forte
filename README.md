# Servers
This is a list of public servers that are running the latest version of forte.

## Registering your server
If you would like to submit a server to this list, please open a pull request with a new file in the `hostnames` directory. The file should be named `<hostname>` and should contain the following fields:

* `address`: The address of the server, which should be publicly accessible.
* `owner`: GitHub username of the server owner.
* `public_key`: Public key created by forte

Hostnames should be all lowercase and should not contain any special characters or spaces. Every server should have a unique hostname.

Each user can only have one server on this list. If you would like to add another server, please remove the old one first.

If you would like to update your server's information, please open a pull request with the updated information. 

Here's an example:

**hostnames/example**
```
{
    "address": "https://example.com",
    "owner": "kaangiray26",
    "public_key": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxjMEZCHcQRYJKwYBBAHaRw8BAQdAfYxHAwWCFohbSMxTfg5Izy/o8c0mMpGK\n7gLMHBktpInNIkZvcnRlIDxrYWFuZ2lyYXkyNkBwcm90b25tYWlsLmNvbT7C\njAQQFgoAPgWCZCHcQQQLCQcICZBoYRWcwtJWjgMVCAoEFgACAQIZAQKbAwIe\nARYhBECXbLMGOWzQ2ncbKmhhFZzC0laOAAA13gD+PkGUQwMSuduSW+ojLFoG\nl5CDnC1moCFYW9E/bZcaAHABAOjqdAJtgCM6UyrBhhShjPGDmpKW7RwEKYkA\n79eN2DcOzjgEZCHcQRIKKwYBBAGXVQEFAQEHQNVj6WdU1nWcolsebdHx2uph\nkZOM9ao5ZF1IsXo91Lk9AwEIB8J4BBgWCAAqBYJkIdxBCZBoYRWcwtJWjgKb\nDBYhBECXbLMGOWzQ2ncbKmhhFZzC0laOAABboQD/Scj8J7LcILWNmn836FxV\nOuXMbYVef5b+fWliPPaLNGYBAIxBrUOQUsJ2+u3M62oQT/MHnAhClnshtp8/\nqP+hOg8E\n=PpiG\n-----END PGP PUBLIC KEY BLOCK-----\n"
}
```
