#!/usr/bin/env node

const { execSync } = require("child_process");

const inquirer = require("inquirer");
const { writeFile, readFile, rmSync } = require("fs");

const appName = process.argv[2];

// Function to log your details in the terminal
const bareReactNativeAppGenerator = (name) => {
  try {
    const command = `npx react-native init ${name} --template @mindinventory/react-native-boilerplate`;
    execSync(`${command}`, { stdio: "inherit" });
  } catch (e) {
    console.error("Failed to execute ${command}", e);
    return false;
  }
  return true;
};

const expoAppGenerator = (name) => {
  const cloneExpoProject = `git clone https://github.com/Mindinventory/expo-boilerplate.git ${name}`;
  execSync(`${cloneExpoProject}`, { stdio: "pipe" });
  const packagePath = `${process.cwd()}/${name}/package.json`;
  const appConfigPath = `${process.cwd()}/${name}/app.json`;
  const filesArr = [
    {
      path: packagePath,
      type: "package",
    },
    {
      path: appConfigPath,
      type: "config",
    },
  ];
  changeProjectNameForExpo(filesArr);
  finalizeExpoProject();
};

const changeProjectNameForExpo = (pathArr) => {
  for (let index = 0; index < pathArr.length; index++) {
    const element = pathArr[index];

    readFile(element.path, (error, data) => {
      if (error) {
        console.log(error);
        return;
      }

      const parsedData = JSON.parse(data);

      // // updating name in shipping_address
      // console.log("parsedData ::: ", parsedData);
      if (element.type === "config") {
        parsedData.expo.name = appName;
      } else {
        parsedData.name = appName;
      }

      writeFile(element.path, JSON.stringify(parsedData, null, 2), (err) => {
        if (err) {
          console.log("Failed to write updated data to file");
          return;
        }
        console.log("Updated file successfully");
      });
    });
  }
};

const finalizeExpoProject = () => {
  console.log("Project is created");
  // execSync(`cd ${process.cwd()}/${appName}`, { stdio: "pipe" });
  // execSync(`rm -rf .git*`, { stdio: "pipe" });
  rmSync(`${process.cwd()}/${appName}/.git`, { recursive: true, force: true });
  rmSync(`${process.cwd()}/${appName}/.gitignore`, {
    recursive: true,
    force: true,
  });
  execSync(`cd ${process.cwd()}/${appName} && yarn`, { stdio: "pipe" });
};

function main() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "Options",
        message: "Select an tool from below list",
        choices: ["Expo", "Bare React Native"],
      },
    ])
    .then((answers) => {
      if (answers.Options === "Bare React Native") {
        // process.exit();
        bareReactNativeAppGenerator(appName);
      } else {
        expoAppGenerator(appName);
      }
    });
}
if (require.main === module) {
  main();
}
