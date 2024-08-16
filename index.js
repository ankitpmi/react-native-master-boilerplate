#!/usr/bin/env node
import fs from "fs-extra"
import inquirer from "inquirer"
import path from "path"
import { replaceInFile } from "replace-in-file"
import { fileURLToPath } from "url"
import { exec } from "child_process"
import util from "util"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const boilerplates = {
  expo: "ExpoTemplate",
  rncli: "CliTemplate",
}

const execAsync = util.promisify(exec)

async function main() {

  


  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter the project name:",
      validate: (input) => (input ? true : "Project name cannot be empty"),
    },
  ])

  const destPath = path.resolve(process.cwd(), projectName)

  const packageJsonPath = path.join(destPath, "package.json")
  const appJsonPath = path.join(destPath, "app.json")

  if (await fs.pathExists(destPath)) {
    // const { overwrite } = await inquirer.prompt([
    //   {
    //     type: "confirm",
    //     name: "overwrite",
    //     message: `The directory "${projectName}" already exists. Do you want to overwrite it?`,
    //     default: false,
    //   },
    // ]);

    // if (!overwrite) {
    //   console.log("Operation aborted.");
    //   return;
    // }

    console.error(`The directory "${projectName}" already exists`);
    
    await fs.remove(destPath);
    return
  }


  const { boilerplate, packageId } = await inquirer.prompt([
    {
      type: "list",
      name: "boilerplate",
      message: "Select the boilerplate to use:",
      choices: ["expo", "rncli"],
    },
    {
      type: "input",
      name: "packageId",
      message: "Enter the package ID (e.g., com.myapp):",
      validate: (input) =>
        /^[a-zA-Z]+\.[a-zA-Z]+/.test(input) ? true : "Package ID is not valid",
      default: `com.${projectName.toLowerCase()}`,
    },
  ])

  const srcPath = path.resolve(
    __dirname,
    "templates",
    boilerplates[boilerplate]
  )

  try {
    if (boilerplate === "expo") {
      await fs.copy(srcPath, destPath)
      console.log(
        `Successfully set up ${boilerplate} boilerplate with project name ${projectName}.`
      )

      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath)
        packageJson.name = projectName
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
      }

      if (await fs.pathExists(appJsonPath)) {
        const appJson = await fs.readJson(appJsonPath)
        appJson.expo.name = projectName
        await fs.writeJson(appJsonPath, appJson, { spaces: 2 })
      }
    } else {
      const projectDir = path.resolve(process.cwd())
      console.log("Linking local boilerplate...")
      process.chdir(srcPath)

      try {
        await execAsync(`npm link`)
        process.chdir(projectDir)
        await execAsync(`npm link @mindinventory/react-native-boilerplate`)
        console.log("Initializing new React Native project...")
        await execAsync(
          `npx react-native init ${projectName} --template @mindinventory/react-native-boilerplate --package-name ${packageId}`
        )
      } catch (error) {
        console.error("Error during project setup:", error)
        return
      }

      // Verify if the project was created successfully
      if (await fs.pathExists(path.join(destPath, "package.json"))) {
        console.log("React Native CLI project created successfully.")

        const packageJsonFileIsExist = await fs.pathExists(packageJsonPath)
        console.log("packageJsonFileIsExist :::::: ", packageJsonFileIsExist)
        if (packageJsonFileIsExist) {
          console.log("::::: CALLING :::::")

          const packageJson = await fs.readJson(packageJsonPath)
          packageJson.name = projectName
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
        }
      } else {
        console.error("Failed to create React Native CLI project.")
        return
      }
    }

    console.log("Project name and package ID set successfully.")
  } catch (err) {
    console.error("Error setting up boilerplate:", err)
  }
}

main()
