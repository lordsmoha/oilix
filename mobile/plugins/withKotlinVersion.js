const { withProjectBuildGradle, withGradleProperties } = require('expo/config-plugins');

/**
 * Force Kotlin 1.9.25 after every prebuild (Compose Compiler 1.5.15).
 */
function withKotlinVersion(config) {
  config = withGradleProperties(config, (cfg) => {
    const key = 'android.kotlinVersion';
    const value = '1.9.25';
    const existing = cfg.modResults.find((item) => item.type === 'property' && item.key === key);
    if (existing) {
      existing.value = value;
    } else {
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });

  config = withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let contents = cfg.modResults.contents;

    // Pin kotlin-gradle-plugin version
    contents = contents.replace(
      /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin[^'"]*['"]\)/,
      "classpath(\"org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion\")",
    );

    // Ensure default kotlinVersion fallback is 1.9.25
    contents = contents.replace(
      /kotlinVersion\s*=\s*findProperty\(['"]android\.kotlinVersion['"]\)\s*\?:\s*['"][^'"]+['"]/,
      "kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.25'",
    );

    // Inject resolution strategy once
    if (!contents.includes('/* oilix-kotlin-force */')) {
      contents = contents.replace(
        'apply plugin: "com.facebook.react.rootproject"',
        `apply plugin: "com.facebook.react.rootproject"

/* oilix-kotlin-force */
subprojects { subproject ->
    subproject.buildscript {
        configurations.classpath {
            resolutionStrategy.eachDependency { details ->
                if (details.requested.group == 'org.jetbrains.kotlin') {
                    details.useVersion('1.9.25')
                }
            }
        }
    }
    subproject.configurations.all { configuration ->
        configuration.resolutionStrategy.eachDependency { details ->
            if (details.requested.group == 'org.jetbrains.kotlin') {
                details.useVersion('1.9.25')
            }
        }
    }
}
`,
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
}

module.exports = withKotlinVersion;
