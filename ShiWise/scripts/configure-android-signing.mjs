import fs from "node:fs";
import path from "node:path";

const androidDir = path.resolve("android");
const appDir = path.join(androidDir, "app");
const appGradle = path.join(appDir, "build.gradle");
const keystore = path.join(appDir, "shiwise-release.jks");

const required = ["SHIWISE_KEYSTORE_BASE64","SHIWISE_KEYSTORE_PASSWORD","SHIWISE_KEY_ALIAS","SHIWISE_KEY_PASSWORD"];
for (const name of required) {
  if (!process.env[name]) throw new Error("Missing required signing secret: " + name);
}

fs.writeFileSync(keystore, Buffer.from(process.env.SHIWISE_KEYSTORE_BASE64, "base64"), { mode: 0o600 });

let gradle = fs.readFileSync(appGradle, "utf8");
const versionCode = Math.max(1, Number(process.env.SHIWISE_VERSION_CODE || "1"));
gradle = gradle.replace(/versionCode\s+\d+/, "versionCode " + versionCode);
gradle = gradle.replace(/versionName\s+"[^"]+"/, 'versionName "1.0"');

const signingBlock = `signingConfigs {
        release {
            storeFile file("shiwise-release.jks")
            storePassword System.getenv("SHIWISE_KEYSTORE_PASSWORD")
            keyAlias System.getenv("SHIWISE_KEY_ALIAS")
            keyPassword System.getenv("SHIWISE_KEY_PASSWORD")
        }
    }

    `;

if (!gradle.includes("signingConfigs {")) {
  gradle = gradle.replace(/\n\s*buildTypes\s*\{/, "\n    " + signingBlock + "buildTypes {");
}
gradle = gradle.replace(/(buildTypes\s*\{\s*release\s*\{)/, "$1\n            signingConfig signingConfigs.release");

fs.writeFileSync(appGradle, gradle);
console.log("Configured persistent ShiWise release signing, versionCode=" + versionCode);