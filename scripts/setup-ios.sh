#!/bin/sh
# Da lanciare una sola volta sul Mac: crea il progetto Xcode in ios/.
set -e

if [ "$(uname)" != "Darwin" ]; then
  echo "Questo script va lanciato su un Mac." >&2
  exit 1
fi

npm install
[ -d ios ] || npx cap add ios
npx capacitor-assets generate --ios

# L'app usa solo l'orizzontale, su iPhone e su iPad.
PLIST=ios/App/App/Info.plist
for KEY in UISupportedInterfaceOrientations 'UISupportedInterfaceOrientations~ipad'; do
  /usr/libexec/PlistBuddy -c "Delete :$KEY" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :$KEY array" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :$KEY:0 string UIInterfaceOrientationLandscapeLeft" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :$KEY:1 string UIInterfaceOrientationLandscapeRight" "$PLIST"
done

npx cap sync ios
echo "Fatto. Apri il progetto con: npm run ios:open"
