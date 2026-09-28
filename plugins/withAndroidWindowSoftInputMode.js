const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Config plugin that sets `android:windowSoftInputMode="adjustResize"` on the
 * main activity in the generated AndroidManifest.xml.
 *
 * `react-native-keyboard-controller` needs the window to resize when the
 * keyboard appears on Android. The library's components also set the soft
 * input mode at runtime while they are mounted, but pinning it at the manifest
 * level keeps the behaviour consistent on every screen and avoids the
 * known flicker the first time the keyboard opens.
 */
module.exports = function withAndroidWindowSoftInputMode(config) {
  return withAndroidManifest(config, (modConfig) => {
    const activities =
      modConfig.modResults.manifest?.application?.[0]?.activity ?? [];

    const mainActivity = activities.find((activity) => {
      const name = activity.$?.["android:name"];
      return typeof name === "string" && name.endsWith(".MainActivity");
    });

    if (mainActivity) {
      mainActivity.$["android:windowSoftInputMode"] = "adjustResize";
    } else {
      throw new Error(
        "withAndroidWindowSoftInputMode: could not find MainActivity in AndroidManifest.xml",
      );
    }

    return modConfig;
  });
};
