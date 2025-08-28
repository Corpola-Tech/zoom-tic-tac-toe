# Google Play Store Deployment Guide for Zoom Tic Tac Toe

This guide will walk you through the complete process of publishing your Zoom Tic Tac Toe game to the Google Play Store using Expo and EAS Build.

## Prerequisites

### 1. Google Play Developer Account
- Visit [Google Play Console](https://play.google.com/console)
- Pay the $25 one-time registration fee
- Complete your developer profile and accept the terms

### 2. Expo Account
- Create a free account at [expo.dev](https://expo.dev)
- You'll use this to build your app

## Step 1: Initial Setup

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Login to Expo
```bash
eas login
```
Enter your Expo account credentials.

### Initialize EAS in your project
```bash
cd react-native-app
eas init
```
This will create a project ID and update your `app.json` file.

## Step 2: Configure Your App

### Update app.json
Make sure your `app.json` has the correct package name (replace "yourdomain" with your actual domain):

```json
{
  "android": {
    "package": "com.corpolatech.zoomtictactoe",
    "versionCode": 1
  }
}
```

**Important:** The package name must be unique across the entire Play Store and cannot be changed later.

### Generate App Icons and Assets

#### Required Assets:
1. **App Icon**: 1024×1024 PNG (no transparency)
2. **Adaptive Icon**: 1024×1024 PNG foreground + background color
3. **Feature Graphic**: 1024×500 PNG for Play Store listing

Place these in your `assets` folder and update `app.json` accordingly.

## Step 3: Build Your App

### Create a Production Build
```bash
eas build --platform android --profile production
```

This will:
- Build an Android App Bundle (.aab file)
- Sign it with a keystore managed by Expo
- Upload it to Expo's servers
- Provide you with a download link

The build process takes 10-20 minutes. You'll receive an email when it's complete.

## Step 4: Test Your Build

### Create a Preview Build (Optional but Recommended)
```bash
eas build --platform android --profile preview
```

This creates an APK file you can install directly on your device for testing.

## Step 5: Prepare Store Assets

### Screenshots Required:
1. **Phone Screenshots**: 2-8 screenshots in PNG or JPG
   - Minimum 320px on any side
   - Maximum 3840px on any side
   - Take screenshots of:
     - Main menu
     - Game board overview
     - Zoomed gameplay
     - Winner screen
     - Score tracking

2. **Tablet Screenshots** (Optional): 7" and 10" tablet screenshots

### Store Listing Content:
Use the content from `store-assets/store-listing.md`:
- App title: "Zoom Tic Tac Toe"
- Short description (80 chars max)
- Full description (4000 chars max)
- Category: Games > Strategy
- Content rating: Everyone

## Step 6: Create Your Play Store Listing

### 1. Go to Google Play Console
- Visit [play.google.com/console](https://play.google.com/console)
- Click "Create app"

### 2. Fill in Basic Information
- App name: "Zoom Tic Tac Toe"
- Default language: English (US)
- App or game: Game
- Free or paid: Free

### 3. Set Up Store Listing
Navigate to "Store listing" in the left sidebar:

- **App name**: Zoom Tic Tac Toe
- **Short description**: Strategic multi-level tic-tac-toe with smooth animations and AI opponent
- **Full description**: Copy from `store-assets/store-listing.md`
- **App icon**: Upload your 512×512 PNG icon
- **Feature graphic**: Upload your 1024×500 PNG graphic
- **Screenshots**: Upload your phone screenshots

### 4. Configure Content Rating
- Go to "Content rating"
- Complete the questionnaire (select "No" for all content questions)
- This should result in an "Everyone" rating

### 5. Set Up App Categories
- **Category**: Games
- **Tags**: Strategy, Puzzle, Board Game, Family

## Step 7: Upload Your App Bundle

### 1. Create a Release
- Go to "Production" in the left sidebar
- Click "Create new release"

### 2. Upload Your AAB File
- Download the .aab file from your EAS build
- Upload it to the release
- Google Play will automatically generate APKs for different device types

### 3. Add Release Notes
```
🎉 Initial Release!

Welcome to Zoom Tic Tac Toe - the most strategic tic-tac-toe game ever created!

✨ New Features:
• Strategic multi-level gameplay with 9 mini-boards
• Smart AI opponent with adaptive difficulty
• Two-player mode for local multiplayer
• Beautiful gradient interface with smooth animations
• Haptic feedback for immersive experience
• Real-time score tracking

Perfect for strategy lovers and casual gamers alike!
```

## Step 8: Set Up Privacy Policy

### 1. Host Your Privacy Policy
You need to host the privacy policy on a public URL. Options:
- GitHub Pages (free)
- Your website
- Google Sites (free)
- Any web hosting service

### 2. Add Privacy Policy URL
- In Play Console, go to "Store listing"
- Add your privacy policy URL
- Use the content from `store-assets/privacy-policy.md`

## Step 9: Review and Publish

### 1. Complete All Required Sections
Make sure all sections show green checkmarks:
- Store listing ✅
- Content rating ✅
- Target audience ✅
- News app ✅ (select "No")
- Ads ✅ (select "No, my app does not contain ads")
- Data safety ✅ (declare that you don't collect data)

### 2. Submit for Review
- Click "Send X changes for review"
- Google typically takes 1-3 days to review new apps
- You'll receive an email with the review results

## Step 10: Post-Launch

### Update Your App
When you want to release updates:

1. Increment version in `app.json`:
```json
{
  "version": "1.0.1",
  "android": {
    "versionCode": 2
  }
}
```

2. Build and upload:
```bash
eas build --platform android --profile production
```

3. Create a new release in Play Console with the new AAB file

## Troubleshooting

### Common Issues:

**Build Fails:**
- Check your `app.json` syntax
- Ensure all required fields are filled
- Make sure package name is unique

**Upload Rejected:**
- Verify your AAB file is properly signed
- Check that version code is incremented
- Ensure all required permissions are declared

**Review Rejected:**
- Review Google Play policies
- Ensure privacy policy is accessible
- Check content rating accuracy
- Verify all store listing requirements are met

### Getting Help:
- Expo Documentation: [docs.expo.dev](https://docs.expo.dev)
- Google Play Console Help: Available in the console
- Expo Discord: [chat.expo.dev](https://chat.expo.dev)

## Important Notes

1. **Package Name**: Cannot be changed after publishing
2. **Keystore**: Managed automatically by Expo (keep your Expo account secure)
3. **Updates**: Always increment versionCode for each release
4. **Testing**: Test thoroughly before publishing to avoid bad reviews

## Timeline

- **Setup**: 1-2 hours
- **Asset Creation**: 2-4 hours
- **Build Time**: 10-20 minutes
- **Store Listing**: 1-2 hours
- **Review Process**: 1-3 days
- **Total**: 1-2 weeks from start to live app

Congratulations! Your Zoom Tic Tac Toe game is now ready for the Google Play Store! 🎉
