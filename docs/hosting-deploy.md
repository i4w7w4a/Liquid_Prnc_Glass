# Hosting Deploy

The FTP hosting credentials are intentionally stored outside this repository.

Local secret file:

```txt
%USERPROFILE%\.liquid-prnc-glass\hosting.ftp.json
```

On this machine the resolved path is:

```txt
C:\Users\iwwa\.liquid-prnc-glass\hosting.ftp.json
```

Do not copy this file into the project and do not commit it.

## Config Shape

```json
{
  "host": "FTP server IP or host",
  "username": "FTP username",
  "password": "FTP password",
  "remoteRoot": "www/liquid-prince.online",
  "publicUrl": "https://liquid-prince.online/"
}
```

## Deploy Command

From the project root:

```powershell
npm run deploy:hosting
```

The command builds the project and uploads `dist` to the configured FTP `remoteRoot`.

To upload an already built `dist` without rebuilding:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-hosting.ps1 -SkipBuild
```

## Rule

The script belongs in Git. The FTP config does not.
