module.exports = {
  "expo": {
    "name": "TapMark",
    "slug": "TapMark",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#801718"
    },
    "ios": {
      "bundleIdentifier": "com.lewishall.TapMark",
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#801718"
      },
      "googleServicesFile": "./google-services.json",
      "package": "com.lewishall.TapMark"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-font",
      [
        "expo-secure-store",
        {
          "configureAndroidBackup": true,
          "faceIDPermission": "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
        }
      ],
      [
        "react-native-maps",
        {
          "androidGoogleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          "iosGoogleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ],
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#801718",
          "image": "./assets/splash-icon.png",
          "dark": {
            "image": "./assets/splash-icon.png",
            "backgroundColor": "#801718"
          },
          "resizeMode": "contain",
        }
      ],
      [
        "expo-notifications"
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "60ce6eda-57bd-4b16-a515-3652487b1a76"
      }
    },
    "owner": "lewishall"
  }
}
