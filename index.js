#!/usr/bin/env node
import fs from "fs-extra"
import inquirer from "inquirer"
import path from "path"
import { replaceInFile } from "replace-in-file"
import { fileURLToPath } from "url"
import { exec } from "child_process"
import util from "util"
import kleur from "kleur"

const { green, red } = kleur

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const boilerplates = {
  expo: "ExpoTemplate",
  rncli: "CliTemplate",
}

const execAsync = util.promisify(exec)

function loadingAnimation(
  getText,
  chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"],
  delay = 100
) {
  let x = 0

  return setInterval(function () {
    process.stdout.write("\r" + chars[x++] + " " + getText())
    x = x % chars.length
  }, delay)
}

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
    console.log(red().bold(`The directory "${projectName}" already exists`))
    return
  }

  const { boilerplate } = await inquirer.prompt([
    {
      type: "list",
      name: "boilerplate",
      message: "Select the boilerplate to use:",
      choices: ["expo", "bare react native"],
    },
  ])

  let packageId = null
  if (boilerplate === "bare react native") {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "packageId",
        message: "Enter the package ID (e.g., com.myapp):",
        validate: (input) =>
          /^[a-zA-Z]+\.[a-zA-Z]+/.test(input)
            ? true
            : "Package ID is not valid",
        default: `com.${projectName.toLowerCase()}`,
      },
    ])
    packageId = response.packageId
  }

  const selectedType =
    boilerplate === "bare react native" ? "rncli" : boilerplate

  const srcPath = path.resolve(
    __dirname,
    "templates",
    boilerplates[selectedType]
  )

  try {
    let loader
    if (boilerplate === "expo") {
      await fs.copy(srcPath, destPath)
      loader = loadingAnimation(() => `Setting up environment...`)
      clearInterval(loader)
      loader = loadingAnimation(
        () => `Initializing new React Native project...`
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
        clearInterval(loader)
        console.log("\n")
        console.log(
          green().bold("React Native EXPO project created successfully.")
        )
      }
    } else {
      if (projectName && packageId) {
        let loader
        const projectDir = path.resolve(process.cwd())
        loader = loadingAnimation(() => `Setting up environment...`)
        process.chdir(srcPath)

        try {
          await execAsync(`npm link`)
          process.chdir(projectDir)
          await execAsync(`npm link @mindinventory/react-native-boilerplate`)
          clearInterval(loader)
          loader = loadingAnimation(
            () => `Initializing new React Native project...`
          )
          await execAsync(
            `npx react-native init ${projectName} --template @mindinventory/react-native-boilerplate --package-name ${packageId}`
          )
        } catch (error) {
          console.error("Error during project setup:", error)
          return
        }

        // Remove the .git directory to uninitialize Git
        const gitDirPath = path.join(destPath, ".git")
        if (await fs.pathExists(gitDirPath)) {
          await fs.remove(gitDirPath)
        }

        // Verify if the project was created successfully
        if (await fs.pathExists(path.join(destPath, "package.json"))) {
          
          const packageJsonFileIsExist = await fs.pathExists(packageJsonPath)
          if (packageJsonFileIsExist) {
            const packageJson = await fs.readJson(packageJsonPath)
            packageJson.name = projectName
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
          }
          process.chdir(destPath)

          await execAsync("git init", { stdio: "inherit" });
          await execAsync("git add .");
          await execAsync(`git commit -m 'Initial commit'`);

          clearInterval(loader)
          console.log("\n")

          console.log(
            green().bold("React Native CLI project created successfully.")
          )
        } else {
          console.log("\n")
          console.error("Failed to create React Native CLI project.")
          return
        }
      } else {
        return
      }
    }
  } catch (err) {
    console.error("Error setting up boilerplate:", err)
  }
}

main()
