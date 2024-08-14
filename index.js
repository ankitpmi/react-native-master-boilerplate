#!/usr/bin/env node
// const fs = require('fs-extra');
import fs from 'fs-extra'
// const inquirer = require('inquirer');
import inquirer from 'inquirer'
// const path = require('path');
import path from 'path'
// const replace = require('replace-in-file');
import {replaceInFile } from 'replace-in-file'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


const boilerplates = {
  expo: 'ExpoTemplate',
  rncli: 'CliTemplate',
};

async function main() {

  const { projectName } = await inquirer.prompt([
   
    {
      type: 'input',
      name: 'projectName',
      message: 'Enter the project name:',
      validate: input => input ? true : 'Project name cannot be empty',
    },
   
  ]);
  const { boilerplate, packageId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'boilerplate',
      message: 'Select the boilerplate to use:',
      choices: ['expo', 'rncli'],
    },
   
    {
      type: 'input',
      name: 'packageId',
      message: 'Enter the package ID (e.g., com.myapp):',
      validate: input => /^[a-zA-Z]+\.[a-zA-Z]+/.test(input) ? true : 'Package ID is not valid',
      default: `com.${projectName.toLowerCase()}`,
      
    },
  ]);

  // const srcPath = path.join(__dirname, '..', boilerplates[boilerplate]);
  const srcPath = path.resolve(__dirname,'templates',boilerplates[boilerplate])
  const destPath = path.resolve(process.cwd(), projectName);

  try {
    await fs.copy(srcPath, destPath);
    console.log(`Successfully set up ${boilerplate} boilerplate with project name ${projectName}.`);

    // Rename project in package.json and other necessary files
    const packageJsonPath = path.join(destPath, 'package.json');
    const appJsonPath = path.join(destPath, 'app.json');

    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    if (await fs.pathExists(appJsonPath) && boilerplate === 'expo') {
      const appJson = await fs.readJson(appJsonPath);
      appJson.expo.name = projectName;
      // appJson.displayName = projectName;
      await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
    }else {
      const appJson = await fs.readJson(appJsonPath);
      appJson.name = projectName;
      appJson.displayName = projectName;
      await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
    }

    // Replace in Android and iOS
    const androidPackagePath = path.join(destPath, 'android', 'app', 'src', 'main', 'java');
    const iosProjectPath = path.join(destPath, 'ios', projectName);

    console.log('androidPackagePath :: ', androidPackagePath);
    console.log('iosProjectPath :: ', iosProjectPath);
    // await replaceNameInFile(androidPackagePath, projectName, packageId);
    console.log('projectName: ', projectName);
    // await replaceNameInFile(iosProjectPath, projectName, packageId);
    console.log('packageId: ', packageId);

    if (boilerplate === 'rncli') {
      await updateAndroidPackage(destPath, projectName, packageId);
      await updateIosBundleId(destPath, projectName, packageId);
    }

    console.log('Project name and package ID set successfully.');
  } catch (err) {
    console.error('Error setting up boilerplate:', err);
  }
}

async function updateAndroidPackage(destPath, projectName, packageId) {
  const androidAppPath = path.join(destPath, 'android', 'app');
  const javaPath = path.join(androidAppPath, 'src', 'main', 'java');
  const oldPackagePath = 'com/miboilerplate';  // Adjust based on your boilerplate's default package path
  const newPackagePath = packageId.replace(/\./g, '/');
  const newPackageDir = path.join(javaPath, newPackagePath);

  // Create new package directories
  await fs.ensureDir(newPackageDir);

   // Move Java files to the new package directory
   const oldJavaFiles = await getJavaFiles(path.join(javaPath, oldPackagePath));
   await Promise.all(
     oldJavaFiles.map(file =>
       fs.move(file, path.join(newPackageDir, path.basename(file)))
     )
   );

   const newJavaFiles = await fs.readdir(newPackageDir);
   console.log('New Java files:', newJavaFiles);

  // Remove old package directory
  await fs.remove(path.join(javaPath, oldPackagePath));

  // Replace package ID in Android files
  const options = {
    files: [
      path.join(androidAppPath, '**', '*.java'),
      path.join(androidAppPath, '**', '*.xml'),
      path.join(androidAppPath, '**', 'AndroidManifest.xml'),
      path.join(androidAppPath, '**', '*.gradle'),
    ],
    from: [/com\.miboilerplate/g, /com\/miboilerplate/g], // Update these patterns as needed
    to: [packageId, newPackagePath],
  };

  await replaceInFile(options);
  console.log(`Updated Android package ID to ${packageId}`);
}

async function getJavaFiles(dir) {
  const files = await fs.readdir(dir);
  return files.filter(file => file.endsWith('.java')).map(file => path.join(dir, file));
}

async function updateIosBundleId(destPath, projectName, bundleId) {
  const iosPath = path.join(destPath, 'ios', projectName);
  const options = {
    files: [
      path.join(iosPath, 'Info.plist'),
      path.join(iosPath, '*.xcodeproj', 'project.pbxproj'),
    ],
    from: [/com.miboilerplate/g, /MIBoilerplate/g], // Update these patterns as needed
    to: [bundleId, projectName],
  };

  await replaceInFile(options);
  console.log(`Updated iOS bundle ID to ${bundleId}`);
}

// async function replaceNameInFile(basePath, projectName, packageId) {
//   try {
//     const packageIdPath = packageId.replace(/\./g, '/');
//     const options = {
//       files: [
//         `${basePath}/**/*.java`,
//         `${basePath}/**/*.xml`,
//         `${basePath}/**/AndroidManifest.xml`,
//         `${basePath}/**/*.gradle`,
//         `${basePath}/**/*.plist`,
//         `${basePath}/**/*.xcodeproj`,
//         `${basePath}/**/Info.plist`,
//       ],
//       from: [/com\.miboilerplate/g, /MIBoilerplate/g, /miboilerplate/g], // Update these patterns as needed
//       to: [packageId, projectName, projectName.toLowerCase()],
//     };

//     await replaceInFile(options);
//     console.log(`Replaced package ID and project name in ${basePath}`);
//   } catch (error) {
//     console.error('Error occurred while replacing package ID and project name:', error);
//   }
// }

main();